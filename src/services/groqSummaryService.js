import Constants from 'expo-constants';

const GROQ_API_KEY = Constants.expoConfig?.extra?.GROQ_API_KEY;

const baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

// Rate limiting for Groq API
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Conservative limit for Groq

export const groqSummaryService = {
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

  async generateWeeklyDigest() {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not found');
    }

    // Check rate limit before making request
    try {
      groqSummaryService.checkRateLimit();
    } catch (rateLimitError) {
      console.warn('Groq rate limit:', rateLimitError.message);
      throw rateLimitError;
    }

    try {
      // Get recent reflections from Supabase
      const reflections = await this.getRecentReflections();
      
      if (!reflections || reflections.length === 0) {
        return {
          summary: "No reflections found. Start reflecting to get AI insights!",
          bullets: ["Add your first reflection to see personalized insights"],
          tip: "Try reflecting daily to build meaningful patterns"
        };
      }

      const prompt = this.createSummaryPrompt(reflections);
      
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
              content: 'You are an AI wellness coach that analyzes personal reflections to provide meaningful insights. You MUST respond with ONLY valid JSON in this exact format: {"summary": "text", "bullets": ["item1", "item2"], "tip": "text", "theme": "text"}. Do not include any markdown, explanations, or other text - only the JSON object.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Groq API rate limit exceeded. Please wait a moment before trying again.');
        } else if (response.status === 402) {
          throw new Error('Groq API quota exceeded. Please check your spending limits.');
        } else if (response.status === 403) {
          throw new Error('Groq API access denied. Please check your API key and permissions.');
        } else {
          throw new Error(`Groq API error: ${response.status}`);
        }
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parse JSON response - handle various formats
      try {
        console.log('🌍 groqSummaryService: Raw content:', content.substring(0, 200) + '...');
        
        let jsonContent = content.trim();
        
        // Remove markdown code blocks if present
        jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Remove any markdown formatting
        jsonContent = jsonContent.replace(/\*\*.*?\*\*/g, '');
        jsonContent = jsonContent.replace(/#{1,6}\s*/g, '');
        jsonContent = jsonContent.replace(/\* /g, '');
        
        // Remove any leading text before JSON
        jsonContent = jsonContent.replace(/^[^{]*/, '');
        
        // Try to find JSON object in the content
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        // Clean up any trailing text after JSON
        jsonContent = jsonContent.replace(/\}[\s\S]*$/, '}');
        
        console.log('🌍 groqSummaryService: Parsing JSON content:', jsonContent.substring(0, 200) + '...');
        const parsed = JSON.parse(jsonContent);
        
        console.log('🌍 groqSummaryService: Successfully parsed JSON');
        return {
          summary: parsed.summary || "Your reflection patterns show interesting insights",
          bullets: parsed.bullets || ["Keep up the great reflection work"],
          tip: parsed.tip || "Continue your wellness journey",
          theme: parsed.theme || "Wellness"
        };
      } catch (parseError) {
        console.error('🌍 groqSummaryService: Error parsing Groq response:', parseError);
        console.log('🌍 groqSummaryService: Raw content that failed to parse:', content);
        
        // Enhanced fallback: try to extract structured info from markdown
        const lines = content.split('\n').filter(line => line.trim());
        const summary = lines.find(line => line.includes('Summary') || line.includes('**Summary**'))?.replace(/.*Summary[:\s]*/i, '').replace(/\*\*/g, '').trim() || 
                     lines[0]?.replace(/\*\*/g, '').trim() || 
                     "Your reflection patterns show interesting insights";
        
        const bullets = [];
        let inBullets = false;
        for (const line of lines) {
          if (line.includes('Key Areas') || line.includes('**Key Areas**') || line.includes('Areas for Reflection')) {
            inBullets = true;
            continue;
          }
          if (inBullets && (line.startsWith('*') || line.startsWith('-') || line.match(/^\d+\./))) {
            bullets.push(line.replace(/^[\*\-\d\.\s]+/, '').trim());
          }
          if (inBullets && line.trim() === '') {
            break;
          }
        }
        
        const tip = lines.find(line => line.includes('Tip') || line.includes('**Tip**'))?.replace(/.*Tip[:\s]*/i, '').replace(/\*\*/g, '').trim() || 
                   "Continue your wellness journey";
        
        return {
          summary: summary,
          bullets: bullets.length > 0 ? bullets : ["Keep up the great reflection work"],
          tip: tip,
          theme: "Wellness"
        };
      }
    } catch (error) {
      console.error('Error generating weekly digest:', error);
      
      // If it's a quota/rate limit error, provide a fallback response
      if (error.message.includes('rate limit') || error.message.includes('quota') || error.message.includes('Rate limit')) {
        console.warn('Groq quota/rate limit hit, providing fallback response');
        return {
          summary: "AI insights temporarily unavailable due to API limits. Your reflections are being processed.",
          bullets: ["Continue reflecting daily", "Track your emotional patterns", "Focus on self-awareness"],
          tip: "Regular reflection helps build emotional intelligence and self-understanding.",
          theme: "Personal Growth"
        };
      }
      
      throw error;
    }
  },

  async getRecentReflections() {
    try {
      const { supabase } = await import('../supabaseClient');
      
      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching reflections:', error);
        return [];
      }

      console.log('🌍 groqSummaryService: Fetched reflections:', data?.length || 0);
      console.log('🌍 groqSummaryService: Sample reflection:', data?.[0]);
      return data || [];
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      return [];
    }
  },

  createSummaryPrompt(reflections) {
    console.log('🌍 groqSummaryService: Creating prompt for reflections:', reflections.length);
    const reflectionTexts = reflections.map(r => r.text || '').filter(text => text.trim());
    console.log('🌍 groqSummaryService: Reflection texts found:', reflectionTexts.length);
    console.log('🌍 groqSummaryService: Sample texts:', reflectionTexts.slice(0, 2));
    
    if (reflectionTexts.length === 0) {
      return "The user has no reflection texts to analyze.";
    }

    return `Analyze these personal reflections and provide insights:

${reflectionTexts.map((text, index) => `${index + 1}. ${text}`).join('\n\n')}

Please respond with ONLY a valid JSON object in this exact format:
{
  "summary": "A brief overview of their emotional patterns and themes",
  "bullets": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "tip": "One actionable piece of advice",
  "theme": "The main emotional theme"
}

Do not include any markdown, explanations, or other text - only the JSON object. Focus on positive patterns, growth opportunities, and supportive insights.`;
  }
};