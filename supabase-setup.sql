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

-- RLS POLICIES (Simplified for Setup)
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table splits enable row level security;
alter table group_balances enable row level security;

-- Basic policy: Users can see groups they are members of
create policy "Users can view their groups"
on groups for select
using (
  exists (
    select 1 from group_members
    where group_members.group_id = groups.id
    and group_members.user_id = auth.uid()
  )
);
