import { supabase } from "../supabaseClient";

// Fetch a user's profile by userId
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// Update a user's profile
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// Create a new profile (e.g. on sign up)
export async function createProfile(userId, profile) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: userId, ...profile }])
    .single();
  if (error) throw error;
  return data;
} 
