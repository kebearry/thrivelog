import { supabase } from "../supabaseClient";

export async function addCanonEvent({
  user_id,
  title,
  intensity,
  event_time,
  notes,
  category,
  emotional_impact,
}) {
  const { data, error } = await supabase
    .from("canon_events")
    .insert([{ user_id, title, intensity, event_time, notes, category, emotional_impact }]);
  if (error) throw error;
  return data;
}

export async function getCanonEventsForDay(user_id, date) {
  // date should be a JS Date object for the day you want to view
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('canon_events')
    .select('*')
    .eq('user_id', user_id)
    .gte('event_time', start.toISOString())
    .lte('event_time', end.toISOString())
    .order('event_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function closeCanonEvent(eventId) {
  const { data, error } = await supabase
    .from('canon_events')
    .update({ closed_time: new Date().toISOString() })
    .eq('id', eventId);
  if (error) throw error;
  return data;
}

export async function getCanonEventsForPeriod(user_id, startDate, endDate) {
  const { data, error } = await supabase
    .from('canon_events')
    .select('*')
    .eq('user_id', user_id)
    .gte('event_time', startDate.toISOString())
    .lte('event_time', endDate.toISOString())
    .order('event_time', { ascending: true });

  if (error) throw error;
  return data;
}
