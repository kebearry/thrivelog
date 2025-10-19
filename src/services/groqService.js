import Constants from 'expo-constants';

const GROQ_API_KEY = Constants.expoConfig?.extra?.GROQ_API_KEY;

// Debug: Log API key status

/**
 * Generate mood tags from reflection text using Groq
 * @param {string} text - The reflection text to analyze
 * @returns {Promise<Array>} - Array of mood tags
 */
export const generateMoodTags = async (text) => {
  try {
    
    if (!text || text.trim().length < 10) {
      return [];
    }

    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a mood analysis expert. Analyze the given reflection text and suggest 5-7 relevant mood tags that capture the emotional tone and feelings expressed. 

Return ONLY a JSON array of mood tags, no other text. Examples of good mood tags:
- "grateful", "anxious", "content", "overwhelmed", "hopeful", "frustrated", "peaceful", "excited", "lonely", "confident", "stressed", "joyful", "worried", "calm", "energized", "melancholy", "optimistic", "tired", "focused", "restless"

Focus on emotions and feelings, not activities or events. Generate 5-7 UNIQUE and diverse mood tags that capture different aspects of the emotional state. Do not repeat any tags.`
          },
          {
            role: 'user',
            content: `Analyze this reflection text and suggest mood tags: "${text}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return [];
    }

    // Try to parse JSON response
    try {
      const tags = JSON.parse(content);
      if (Array.isArray(tags)) {
        // Remove duplicates and limit to 7 tags
        const uniqueTags = [...new Set(tags)];
        const finalTags = uniqueTags.slice(0, 7);
        return finalTags;
      }
    } catch (parseError) {
      // If JSON parsing fails, try to extract tags from text
      const tagMatches = content.match(/"([^"]+)"/g);
      if (tagMatches) {
        const extractedTags = tagMatches.map(tag => tag.replace(/"/g, ''));
        // Remove duplicates and limit to 7 tags
        const uniqueTags = [...new Set(extractedTags)];
        const finalTags = uniqueTags.slice(0, 7);
        return finalTags;
      }
    }

    return [];
  } catch (error) {
    
    // Handle specific error types gracefully
    if (error.message.includes('Rate limit reached') || error.message.includes('429')) {
      return [];
    }
    
    if (error.message.includes('API key') || error.message.includes('401')) {
      return [];
    }
    
    if (error.message.includes('timeout') || error.message.includes('network')) {
      return [];
    }
    
    // Generic fallback - return empty array to not break the UI
    return [];
  }
};

/**
 * Debounced version of generateMoodTags to avoid too many API calls
 * @param {string} text - The reflection text to analyze
 * @param {number} delay - Delay in milliseconds (default: 1000)
 * @returns {Promise<Array>} - Array of mood tags
 */
export const generateMoodTagsDebounced = (() => {
  let timeoutId = null;
  
  return (text, delay = 1000) => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        const tags = await generateMoodTags(text);
        resolve(tags);
      }, delay);
    });
  };
})();
