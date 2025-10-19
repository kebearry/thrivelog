import { supabase } from '../supabaseClient';

export async function getDay(dateStr) {
  const user = supabase.auth.user();
  if (!user) throw new Error('Not logged in');
  const { data, error } = await supabase
    .from('days')
    .select('*, temperature')
    .eq('user_id', user.id)
    .eq('date', dateStr)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // ignore no row found
  // Return all fields, defaulting to false if not present
  return {
    is_period: data?.is_period ?? false,
    is_pooped: data?.is_pooped ?? false,
    is_housekeeping_day: data?.is_housekeeping_day ?? false,
    reflection: data?.reflection ?? '',
    temperature: data?.temperature ?? null,
    // Add more fields here as you extend the table
  };
}

export async function setDay(fields, dateStr) {
  const user = supabase.auth.user();
  if (!user) throw new Error('Not logged in');
  const { data, error } = await supabase
    .from('days')
    .upsert([{ user_id: user.id, date: dateStr, ...fields }], { onConflict: ['user_id', 'date'] });
  if (error) throw error;
  return data;
}

export async function getDaysForMonth(year, month) {
  const user = supabase.auth.user();
  if (!user) throw new Error('Not logged in');
  const monthStr = month.toString().padStart(2, '0');
  const start = `${year}-${monthStr}-01`;
  // Get the first day of the next month
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
  const { data, error } = await supabase
    .from('days')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', start)
    .lt('date', end);
  if (error) throw error;
  return data || [];
} 
