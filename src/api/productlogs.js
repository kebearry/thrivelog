// thrivelog/src/api/productlogs.js
import { supabase } from "../supabaseClient";

// Add a new product log
export async function addProductLog({
  product,
  notes,
  category,
  photo_url,
  time,
}) {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase.from("product_logs").insert([
    {
      user_id: user.id,
      product,
      notes,
      category,
      photo_url,
      time,
    },
  ]);
  if (error) throw error;
  return data;
}

// Get product logs for a specific date (YYYY-MM-DD)
export async function getProductLogs(dateStr) {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");
  let query = supabase
    .from("product_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (dateStr) {
    query = query
      .gte("time", dateStr + "T00:00:00")
      .lt("time", dateStr + "T23:59:59.999");
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Get distinct product names for autosuggest
export async function getDistinctProducts() {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");
  const { data, error } = await supabase
    .from("product_logs")
    .select("product")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // Return unique product names, most recent first
  const seen = new Set();
  return data
    .map(p => p.product)
    .filter(p => {
      if (!p || seen.has(p.toLowerCase())) return false;
      seen.add(p.toLowerCase());
      return true;
    });
}
