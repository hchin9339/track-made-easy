import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Snapshot } from '@/lib/types';

export function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Database configuration is missing. Connect the provisioned Supabase environment.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function snapshot(month: string): Promise<Snapshot> {
  const db = database();
  const results = await Promise.all([
    db.from('categories').select('id,name').order('name'),
    db.from('budgets').select('*').eq('month', month),
    db.from('expenses').select('*').eq('month', month).order('expense_date', { ascending: false }).order('created_at', { ascending: false }),
  ]);
  for (const result of results) if (result.error) throw new Error('Could not load your budget data. Please try again.');
  return { categories: results[0].data!, budgets: results[1].data!, expenses: results[2].data! } as Snapshot;
}
