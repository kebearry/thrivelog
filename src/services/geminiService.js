import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY;
const GROQ_API_KEY = Constants.expoConfig?.extra?.GROQ_API_KEY;

const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;

// Rate limiting for Gemini API
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 120000; // 2 minutes
const MAX_REQUESTS_PER_WINDOW = 3; // Very conservative limit
const MIN_REQUEST_INTERVAL = 20000; // 20 seconds between requests

export const geminiService = {
  // Check rate limit
  checkRateLimit() {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Clean old entries
    for (const [timestamp] of rateLimitMap) {
      if (timestamp < windowStart) {
        rateLimitMap.delete(timestamp);
      }
    }
    
    // Check minimum interval between requests
    if (rateLimitMap.size > 0) {
      const lastRequest = Math.max(...rateLimitMap.keys());
      const timeSinceLastRequest = now - lastRequest;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        throw new Error(`Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`);
      }
    }
    
    // Check if we're within limits
    if (rateLimitMap.size >= MAX_REQUESTS_PER_WINDOW) {
      const oldestRequest = Math.min(...rateLimitMap.keys());
      const waitTime = RATE_LIMIT_WINDOW - (now - oldestRequest);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }
    
    // Add current request
    rateLimitMap.set(now, true);
  },

  // Convert blob to base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  // Groq image analysis as fallback
  async analyzeImageWithGroq(imageUri) {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not found');
    }

    try {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await geminiService.blobToBase64(blob);

      const requestBody = {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and provide: 1) A brief emotional caption describing the mood/feeling, 2) Multiple mood tags (3-5) that capture the emotional state, 3) The overall mood as a single word. Focus on emotional content, not factual description. Be empathetic and understanding. Return JSON format: {\"caption\": \"...\", \"moodTags\": [\"tag1\", \"tag2\", \"tag3\"], \"mood\": \"emotion\"}"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      };

      console.log('🔄 Groq request body size:', JSON.stringify(requestBody).length);
      console.log('🔄 Groq base64 image size:', base64.length);

      const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error('Groq API error details:', errorData);
        throw new Error(`Groq API error: ${apiResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await apiResponse.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content generated from Groq');
      }

      // Parse JSON response
      try {
        const parsed = JSON.parse(content);
        return {
          caption: parsed.caption || 'Image analyzed',
          moodTags: parsed.moodTags || [],
          mood: parsed.mood || 'neutral'
        };
      } catch (parseError) {
        console.error('Error parsing Groq response:', parseError);
        // Fallback parsing
        const lines = content.split('\n');
        const caption = lines.find(line => line.includes('caption')) || 'Image analyzed';
        const moodTags = lines.filter(line => line.includes('tag')).map(line => line.replace(/[^\w\s]/g, '').trim());
        const mood = lines.find(line => line.includes('mood')) || 'neutral';
        
        return {
          caption: caption.replace(/[^\w\s]/g, '').trim(),
          moodTags: moodTags.filter(tag => tag.length > 0),
          mood: mood.replace(/[^\w\s]/g, '').trim()
        };
      }
    } catch (error) {
      console.error('Error analyzing image with Groq:', error);
      throw error;
    }
  },

  async analyzeImage(imageUri) {
    // Try Gemini first (primary method)
    try {
      console.log('🔄 Using Gemini for image analysis...');
      
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not found');
      }

      // Check rate limit before making request
      try {
        geminiService.checkRateLimit();
      } catch (rateLimitError) {
        console.warn('Gemini rate limit:', rateLimitError.message);
        throw rateLimitError;
      }

      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await geminiService.blobToBase64(blob);

      const requestBody = {
        contents: [{
          parts: [
            {
              text: "Analyze this image and provide: 1) A brief emotional caption describing the mood/feeling, 2) Multiple mood tags (3-5) that capture the emotional state, 3) The overall mood as a single word. Focus on emotional content, not factual description. Be empathetic and understanding. Return JSON format: {\"caption\": \"...\", \"moodTags\": [\"tag1\", \"tag2\", \"tag3\"], \"mood\": \"emotion\"}"
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        }
      };

      const apiResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!apiResponse.ok) {
        if (apiResponse.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please wait a moment before trying again.');
        } else if (apiResponse.status === 400) {
          throw new Error('Invalid request to Gemini API. Please check your image format.');
        } else if (apiResponse.status === 403) {
          throw new Error('Gemini API access denied. Please check your API key.');
        } else {
          throw new Error(`Gemini API error: ${apiResponse.status}`);
        }
      }

      const data = await apiResponse.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content generated');
      }

      // Parse JSON response
      try {
        const parsed = JSON.parse(content);
        return {
          caption: parsed.caption || 'Image analyzed',
          moodTags: parsed.moodTags || [],
          mood: parsed.mood || 'neutral'
        };
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        // Fallback parsing
        const lines = content.split('\n');
        const caption = lines.find(line => line.includes('caption')) || 'Image analyzed';
        const moodTags = lines.filter(line => line.includes('tag')).map(line => line.replace(/[^\w\s]/g, '').trim());
        const mood = lines.find(line => line.includes('mood')) || 'neutral';
        
        return {
          caption: caption.replace(/[^\w\s]/g, '').trim(),
          moodTags: moodTags.filter(tag => tag.length > 0),
          mood: mood.replace(/[^\w\s]/g, '').trim()
        };
      }
    } catch (geminiError) {
      console.warn('Gemini image analysis failed, trying Groq fallback...', geminiError.message);
      
      // Fallback to Groq if Gemini fails
      try {
        console.log('🔄 Using Groq as fallback for image analysis...');
        return await geminiService.analyzeImageWithGroq(imageUri);
      } catch (groqError) {
        console.error('Both Gemini and Groq failed:', groqError.message);
        
        // Final fallback response
        return {
          caption: 'Image captured - analysis will be available shortly',
          moodTags: ['content', 'peaceful', 'reflective'],
          mood: 'content'
        };
      }
    }
  }
};

// Export individual functions for compatibility
export const analyzeImage = geminiService.analyzeImage;
