import { supabase } from "../supabaseClient";

export async function addAfterEffect({ user_id, log_type, log_id, response, log_name }) {
  const { data, error } = await supabase
    .from("after_effects")
    .insert([{ user_id, log_type, log_id, response, log_name }])
    .single();
  if (error) throw error;
  return data;
}

export async function getAfterEffectsForDay(user_id, dateStr) {
  const { data, error } = await supabase
    .from("after_effects")
    .select("*")
    .eq("user_id", user_id)
    .gte("created_at", dateStr + "T00:00:00")
    .lt("created_at", dateStr + "T23:59:59.999");
  if (error) throw error;
  return data;
}

export async function getAfterEffectsForPeriod(user_id, startDate, endDate) {
  const { data, error } = await supabase
    .from("after_effects")
    .select("*")
    .eq("user_id", user_id)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());
  if (error) throw error;
  return data;
}
