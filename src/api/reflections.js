import { supabase } from "../supabaseClient";
import { generateAdaptivePrompts } from '../services/anthropicService';

// Create a new reflection entry
export async function createReflection({
  text,
  photo_url,
  voice_url,
  voice_duration,
  prompt_question,
  mood_rating,
  tags = [],
  // Groq mood analysis data
  groq_mood_label,
  groq_mood_score,
  groq_confidence,
  groq_analysis_timestamp,
}) {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("reflections")
    .insert({
      user_id: user.id,
      text: text || null,
      photo_url: photo_url || null,
      voice_url: voice_url || null,
      voice_duration: voice_duration || null,
      prompt_question: prompt_question || null,
      mood_rating: mood_rating || null,
      tags: tags.length > 0 ? tags : null,
      // Groq mood analysis fields
      groq_mood_label: groq_mood_label || null,
      groq_mood_score: groq_mood_score || null,
      groq_confidence: groq_confidence || null,
      groq_analysis_timestamp: groq_analysis_timestamp || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get reflections for a specific date
export async function getReflectionsForDate(dateStr) {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", `${dateStr}T00:00:00`)
    .lt("created_at", `${dateStr}T23:59:59`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get reflections for a date range
export async function getReflectionsForPeriod(startDate, endDate) {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get recent reflections (for feed)
export async function getRecentReflections(limit = 20) {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Update a reflection
export async function updateReflection(reflectionId, updates) {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("reflections")
    .update(updates)
    .eq("id", reflectionId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a reflection
export async function deleteReflection(reflectionId) {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase
    .from("reflections")
    .delete()
    .eq("id", reflectionId)
    .eq("user_id", user.id);

  if (error) throw error;
  return true;
}

// Subscribe to realtime reflections feed
export function subscribeToReflections(callback) {
  const user = supabase.auth.user();
  if (!user) return null;

  return supabase
    .channel("reflections_channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reflections",
        filter: `user_id=eq.${user.id}`,
      },
      callback
    )
    .subscribe();
}

// Upload file to Supabase storage
export async function uploadReflectionFile(
  file,
  fileName,
  bucket = "reflections"
) {

  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");


  const fileExt = fileName.split(".").pop();
  const filePath = `${user.id}/${Date.now()}.${fileExt}`;


  try {
    // Add timeout and retry logic for uploads
    const uploadWithRetry = async (retryCount = 0) => {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });
        
        if (error) {
          throw error;
        }
        
        return data;
      } catch (error) {
        if (error.message?.includes('timeout') && retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          return uploadWithRetry(retryCount + 1);
        }
        throw error;
      }
    };
    
    const data = await uploadWithRetry();


    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;

    // If the method doesn't work, construct URL manually
    let finalUrl = publicUrl;
    if (!finalUrl) {
      // Manual URL construction as fallback
      const supabaseUrl = supabase.supabaseUrl;
      finalUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
    }

    if (!finalUrl) {
      throw new Error("Failed to generate public URL for uploaded file");
    }

    return finalUrl;
  } catch (error) {
    
    // Provide more helpful error messages
    if (error.message?.includes('timeout')) {
      throw new Error("Upload timed out. Please check your internet connection and try again.");
    } else if (error.message?.includes('Network request failed')) {
      throw new Error("Network error. Please check your internet connection and try again.");
    } else {
      throw error;
    }
  }
}

// Delete file from Supabase storage
export async function deleteReflectionFile(fileUrl, bucket = "reflections") {
  const user = supabase.auth.user();
  if (!user) throw new Error("Not logged in");

  // Extract file path from URL
  const urlParts = fileUrl.split("/");
  const fileName = urlParts[urlParts.length - 1];
  const filePath = `${user.id}/${fileName}`;

  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) throw error;
  return true;
}




// Get user context for generating adaptive prompts
export async function getUserContextForPrompts(userId) {
  try {
    // Get recent reflections to understand user patterns
    const { data: recentReflections, error: reflectionsError } = await supabase
      .from("reflections")
      .select("mood_rating, tags, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (reflectionsError) throw reflectionsError;

    // Analyze mood patterns
    const moodRatings = recentReflections?.map(r => r.mood_rating).filter(Boolean) || [];
    const averageMood = moodRatings.length > 0 
      ? moodRatings.reduce((a, b) => a + b, 0) / moodRatings.length 
      : 3; // Default neutral mood

    // Get common tags
    const allTags = recentReflections?.flatMap(r => r.tags || []) || [];
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
    const commonTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);

    return {
      userId,
      recentMoodAverage: averageMood,
      commonTags,
      reflectionCount: recentReflections?.length || 0,
      lastReflectionDate: recentReflections?.[0]?.created_at,
      userPreferences: {
        focusAreas: commonTags.length > 0 ? commonTags : ['emotional', 'gratitude'],
        moodPattern: averageMood > 3.5 ? 'positive' : averageMood < 2.5 ? 'struggling' : 'neutral'
      }
    };
  } catch (error) {
    // Return default context
    return {
      userId,
      recentMoodAverage: 3,
      commonTags: [],
      reflectionCount: 0,
      userPreferences: {
        focusAreas: ['emotional', 'gratitude'],
        moodPattern: 'neutral'
      }
    };
  }
}

// Create adaptive prompts
export async function createAdaptivePrompts({
  user_id,
  userContext = {},
  questionCount = 7
}) {
  try {
    const generatedPrompts = await generateAdaptivePrompts(userContext, questionCount);
    
    const { data, error } = await supabase
      .from("adaptive_prompts")
      .insert({
        user_id: user_id,
        prompts: generatedPrompts,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// Get adaptive prompts for a user
export async function getAdaptivePrompts(userId) {
  try {
    const { data, error } = await supabase
      .from("adaptive_prompts")
      .select("prompts")
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .limit(1);

    if (error) throw error;
    
    // Return the first result or null if no prompts exist
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    return null;
  }
}

// End of file - all functions properly declared
