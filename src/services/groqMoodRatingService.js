import Constants from 'expo-constants';

const GROQ_API_KEY = Constants.expoConfig?.extra?.GROQ_API_KEY;

const baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

// Rate limiting for Groq API
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Conservative limit for Groq

export const groqMoodRatingService = {
  // Check rate limit before making request
  checkRateLimit() {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Clean old entries
    for (const [timestamp] of rateLimitMap) {
      if (timestamp < windowStart) {
        rateLimitMap.delete(timestamp);
      }
    }
    
    // Check if we're within limits
    if (rateLimitMap.size >= MAX_REQUESTS_PER_WINDOW) {
      const oldestRequest = Math.min(...rateLimitMap.keys());
      const waitTime = RATE_LIMIT_WINDOW - (now - oldestRequest);
      throw new Error(`Groq rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }
    
    // Add current request
    rateLimitMap.set(now, true);
  },

  async analyzeMoodWithGroq(reflectionText) {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not found');
    }

    // Check rate limit before making request
    try {
      groqMoodRatingService.checkRateLimit();
    } catch (rateLimitError) {
      console.warn('Groq rate limit:', rateLimitError.message);
      throw rateLimitError;
    }

    try {
      const response = await fetch(baseUrl, {
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
              content: 'You are an AI mood analyst. Analyze the emotional content of the given text and provide a mood rating on a scale of 1-10, where 1 is very negative/low mood and 10 is very positive/high mood. Also provide a confidence score (0-100) and a brief mood label. Return JSON format: {"mood_label": "emotion", "mood_score": number, "confidence": number}'
            },
            {
              role: 'user',
              content: `Analyze the mood of this reflection: "${reflectionText}"`
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        // Remove markdown code blocks if present
        let jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Remove any other markdown formatting
        jsonContent = jsonContent.replace(/\*\*.*?\*\*/g, '');
        jsonContent = jsonContent.replace(/#{1,6}\s*/g, '');
        
        // Try to find JSON object in the content
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        console.log('🌍 groqMoodRatingService: Parsing JSON content:', jsonContent);
        const parsed = JSON.parse(jsonContent);
        
        // Convert confidence to decimal (0-1) for database storage
        let confidence = parsed.confidence || 50;
        if (confidence > 1) {
          // Convert from percentage to decimal
          confidence = confidence / 100;
        }
        // Ensure confidence is between 0-1
        confidence = Math.min(Math.max(confidence, 0), 1);
        
        return {
          groq_mood_label: parsed.mood_label || 'neutral',
          groq_mood_score: Math.round(parsed.mood_score || 5), // Ensure integer
          groq_confidence: Math.round(confidence * 100) / 100, // Convert to decimal with 2 decimal places
          groq_analysis_timestamp: new Date().toISOString()
        };
      } catch (parseError) {
        console.error('🌍 groqMoodRatingService: Error parsing Groq mood response:', parseError);
        console.log('🌍 groqMoodRatingService: Raw content:', content);
        
        // Fallback parsing
        const moodLabel = content.match(/mood_label["\s]*:["\s]*([^,}]+)/i)?.[1]?.replace(/['"]/g, '').trim() || 'neutral';
        const moodScore = parseInt(content.match(/mood_score["\s]*:["\s]*(\d+)/i)?.[1]) || 5;
        let confidence = parseInt(content.match(/confidence["\s]*:["\s]*(\d+)/i)?.[1]) || 50;
        
        // Convert confidence to decimal (0-1) for database storage
        if (confidence > 1) {
          confidence = confidence / 100;
        }
        // Ensure confidence is between 0-1
        confidence = Math.min(Math.max(confidence, 0), 1);
        
        return {
          groq_mood_label: moodLabel,
          groq_mood_score: Math.round(moodScore),
          groq_confidence: Math.round(confidence * 100) / 100, // Convert to decimal with 2 decimal places
          groq_analysis_timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error analyzing mood with Groq:', error);
      throw error;
    }
  }
};

// Export individual function for compatibility
export const analyzeMoodWithGroq = groqMoodRatingService.analyzeMoodWithGroq;
