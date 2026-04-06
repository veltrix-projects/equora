"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsSummary({ expenses = [] }: { expenses?: any[] }) {
  // Aggregate real spending by category
  const categoryData = expenses.reduce((acc: any, curr) => {
    const category = curr.category || 'general';
    const existing = acc.find((item: any) => item.name === category);
    if (existing) {
      existing.amount += Number(curr.amount);
    } else {
      acc.push({ name: category, amount: Number(curr.amount) });
    }
    return acc;
  }, []);

  const data = categoryData.length > 0 ? categoryData : [{ name: 'None', amount: 0 }];

  return (
    <div className="glass p-6 rounded-3xl h-[300px] w-full">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Spending by Category</h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#888', fontSize: 10 }}
            className="capitalize"
          />
          <YAxis hide />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
