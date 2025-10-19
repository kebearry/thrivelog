import { supabase } from "../supabaseClient";

export async function addSymptomLog({ symptom, intensity, time, notes }) {
  const user = supabase.auth.user(); // v1.x
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase.from("symptom_logs").insert([
    {
      user_id: user.id,
      symptom,
      intensity,
      time, // should be an ISO string, e.g. new Date().toISOString()
      notes,
    },
  ]);
  if (error) throw error;
  return data;
}

export async function getSymptomLogs(dateStr) {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");
  let query = supabase
    .from("symptom_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (dateStr) {
    query = query.gte('time', dateStr + 'T00:00:00').lt('time', dateStr + 'T23:59:59.999');
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
