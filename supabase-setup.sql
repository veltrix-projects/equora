-- Equora: Universal Group Expense Splitting Platform
-- Database Schema (PostgreSQL)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. GROUPS
create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  currency text default 'INR',
  invite_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete set null
);

-- 2. GROUP MEMBERS
create table group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- 3. EXPENSES
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  paid_by uuid references auth.users(id) on delete cascade not null,
  description text not null,
  amount decimal(12,2) not null,
  category text default 'general',
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  is_recurring boolean default false,
  is_draft boolean default false,
  request_id text unique, -- Idempotency protection
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. EXPENSE ITEMS (Itemization)
create table expense_items (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade not null,
  name text not null,
  amount decimal(12,2) not null
);

-- 5. SPLITS
create table splits (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount decimal(12,2) not null,
  percentage decimal(5,2),
  unique(expense_id, user_id)
);

-- 6. GROUP BALANCES (Precomputed for performance)
-- amount > 0 means the user is owed money
-- amount < 0 means the user owes money
create table group_balances (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  balance decimal(12,2) default 0.00 not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- 7. DRAFTS
create table drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  group_id uuid references groups(id) on delete cascade,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. AI USAGE (Tracking for free tier limits)
create table ai_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  group_id uuid references groups(id) on delete cascade not null,
  usage_date date default current_date not null,
  count int default 0 not null,
  unique(user_id, group_id, usage_date)
);

-- 9. CACHED INSIGHTS
create table cached_insights (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade not null,
  insights jsonb not null,
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null
);

-- TRIGGERS FOR PRECOMPUTED BALANCES

-- Function to update group_balances
create or replace function update_group_balances_on_split_change()
returns trigger as $$
declare
    expense_paid_by uuid;
    expense_group_id uuid;
begin
    -- Get expense details
    select paid_by, group_id into expense_paid_by, expense_group_id 
    from expenses where id = coalesce(new.expense_id, old.expense_id);

    if (TG_OP = 'INSERT') then
        -- User who owes (new.user_id) gets balance decreased
        insert into group_balances (group_id, user_id, balance)
        values (expense_group_id, new.user_id, -new.amount)
        on conflict (group_id, user_id) 
        do update set balance = group_balances.balance - new.amount;

        -- User who paid gets balance increased
        insert into group_balances (group_id, user_id, balance)
        values (expense_group_id, expense_paid_by, new.amount)
        on conflict (group_id, user_id) 
        do update set balance = group_balances.balance + new.amount;

    elsif (TG_OP = 'DELETE') then
        -- Reverse the logic for deletion
        update group_balances 
        set balance = balance + old.amount
        where group_id = expense_group_id and user_id = old.user_id;

        update group_balances 
        set balance = balance - old.amount
        where group_id = expense_group_id and user_id = expense_paid_by;
    end if;

    return null;
end;
$$ language plpgsql;

create trigger trg_update_balances_on_split
after insert or delete on splits
for each row execute function update_group_balances_on_split_change();

-- INDEXING FOR PERFORMANCE
create index idx_expenses_group_id on expenses(group_id);
create index idx_expenses_created_at on expenses(created_at);
create index idx_splits_user_id on splits(user_id);
create index idx_group_members_group_id on group_members(group_id);
create index idx_group_balances_group_id on group_balances(group_id);

-- Reconciliation System: Recalculate group_balances from splits
create or replace function reconcile_group_balances(p_group_id uuid)
returns void as $$
begin
  -- Clear existing balances for the group
  update group_balances set balance = 0 where group_id = p_group_id;

  -- Recompute from splits
  -- 1. Decrease balance for users who owe (debtors)
  insert into group_balances (group_id, user_id, balance)
  select e.group_id, s.user_id, -sum(s.amount)
  from splits s
  join expenses e on s.expense_id = e.id
  where e.group_id = p_group_id
  group by e.group_id, s.user_id
  on conflict (group_id, user_id) 
  do update set balance = excluded.balance;

  -- 2. Increase balance for users who paid (creditors)
  insert into group_balances (group_id, user_id, balance)
  select group_id, paid_by, sum(amount)
  from expenses
  where group_id = p_group_id
  group by group_id, paid_by
  on conflict (group_id, user_id) 
  do update set balance = group_balances.balance + excluded.balance;
end;
$$ language plpgsql;

-- AI Usage Tracking Function
create or replace function increment_ai_usage(p_group_id uuid)
returns void as $$
begin
  insert into ai_usage (user_id, group_id, usage_date, count)
  values (auth.uid(), p_group_id, current_date, 1)
  on conflict (user_id, group_id, usage_date)
  do update set count = ai_usage.count + 1;
end;
$$ language plpgsql;

-- Generate Invite Code Function
create or replace function generate_invite_code()
returns text as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer := 0;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- RLS POLICIES (Hardened)
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table splits enable row level security;
alter table group_balances enable row level security;
alter table drafts enable row level security;

-- Helper function for RLS: check if user is member of a group
create or replace function is_group_member(p_group_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
end;
$$ language plpgsql;

-- Groups: Members can view and admins can update
create policy "Members can view groups" on groups for select using (is_group_member(id));
create policy "Admins can update groups" on groups for update using (
  exists (select 1 from group_members where group_id = id and user_id = auth.uid() and role = 'admin')
);

-- Group Members: Members can view each other
create policy "Members can view group_members" on group_members for select using (is_group_member(group_id));

-- Expenses: Members can view and add, but only creator can delete
create policy "Members can view expenses" on expenses for select using (is_group_member(group_id));
create policy "Members can add expenses" on expenses for insert with check (is_group_member(group_id));
create policy "Creator can delete expenses" on expenses for delete using (paid_by = auth.uid());

-- Splits: Members can view
create policy "Members can view splits" on splits for select using (
  exists (select 1 from expenses where id = expense_id and is_group_member(group_id))
);

-- Balances: Members can view
create policy "Members can view balances" on group_balances for select using (is_group_member(group_id));

-- Drafts: Only owner can access
create policy "Owners can manage drafts" on drafts using (user_id = auth.uid());
