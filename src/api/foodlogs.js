import { supabase } from "../supabaseClient";

export async function addFoodLog({ food, notes, category, photo_url, time }) {
  const user = supabase.auth.user(); // v1.x
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase.from("food_logs").insert([
    {
      user_id: user.id,
      food,
      notes,
      category,
      photo_url,
      time, // ISO string, e.g. new Date().toISOString()
    },
  ]);
  if (error) throw error;
  return data;
}

export async function getFoodLogs(dateStr) {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");
  let query = supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (dateStr) {
    // Only logs for the given date
    query = query.gte('time', dateStr + 'T00:00:00').lt('time', dateStr + 'T23:59:59.999');
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDistinctFoods() {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");
  const { data, error } = await supabase
    .from("food_logs")
    .select("food")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // Return unique food names, most recent first
  const seen = new Set();
  return data
    .map(f => f.food)
    .filter(f => {
      if (!f || seen.has(f.toLowerCase())) return false;
      seen.add(f.toLowerCase());
      return true;
    });
}
