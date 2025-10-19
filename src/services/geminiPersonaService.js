import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.GEMINI_API_KEY;

// Use latest Gemini Flash model
const getGeminiUrl = () => {
  // Use the latest Flash model (auto-updates to newest version)
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
};

const baseUrl = getGeminiUrl();

export const geminiPersonaService = {
  // Try different models with fallback
  async tryWithFallback(apiCall) {
    const models = [
      'gemini-flash-latest',  // Latest Flash model (recommended)
      'gemini-1.5-flash',     // Fallback to stable 1.5
      'gemini-1.5-pro',       // Fallback to pro
      'gemini-2.5-flash'      // Try 2.5 if available
    ];
    
    for (const model of models) {
      try {
        console.log(`🤖 Trying Gemini model: ${model}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const result = await apiCall(url);
        console.log(`✅ Successfully using Gemini model: ${model}`);
        return result;
      } catch (error) {
        if (error.message.includes('404') && models.indexOf(model) < models.length - 1) {
          console.warn(`❌ Model ${model} not available, trying next...`);
          continue;
        }
        throw error;
      }
    }
  },

  async generateConversationStarter(personaId, context) {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not found');
    }

    try {
      let prompt;
      
      if (context && (context.mood || context.theme || context.reflectionText)) {
        prompt = this.createContextualStarterPrompt(personaId, context);
      } else {
        prompt = this.createGenericStarterPrompt(personaId, context);
      }

      const response = await this.tryWithFallback(async (url) => {
        return await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 1000,
            }
          })
        });
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error details:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 Gemini API response:', JSON.stringify(data, null, 2));
      
      // Check for different content structures
      const candidate = data.candidates?.[0];
      let content = null;
      
      if (candidate?.content?.parts?.[0]?.text) {
        // Standard structure
        content = candidate.content.parts[0].text;
      } else if (candidate?.content?.text) {
        // Alternative structure
        content = candidate.content.text;
      } else if (candidate?.content && typeof candidate.content === 'string') {
        // Direct string content
        content = candidate.content;
      }
      
      console.log('🔍 Extracted content:', content);
      console.log('🔍 Finish reason:', candidate?.finishReason);
      
      if (!content) {
        console.error('❌ No content in response. Full response:', data);
        
        // Fallback for MAX_TOKENS or empty content
        if (candidate?.finishReason === 'MAX_TOKENS') {
          console.warn('⚠️ Response truncated due to token limit, using fallback');
          const persona = this.getPersonaDetails(personaId);
          return `Hello! I'm ${persona.name}. How are you feeling today? I'm here to listen and support you.`;
        }
        
        throw new Error('No content generated');
      }

      return content.trim();
    } catch (error) {
      console.error('Error generating conversation starter:', error);
      throw error;
    }
  },

  async generateResponse(personaId, userMessage, conversationHistory, context) {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not found');
    }

    try {
      const prompt = this.createResponsePrompt(personaId, userMessage, conversationHistory, context);
      
      const response = await this.tryWithFallback(async (url) => {
        return await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 1000,
            }
          })
        });
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error details:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 Gemini API response:', JSON.stringify(data, null, 2));
      
      // Check for different content structures
      const candidate = data.candidates?.[0];
      let content = null;
      
      if (candidate?.content?.parts?.[0]?.text) {
        // Standard structure
        content = candidate.content.parts[0].text;
      } else if (candidate?.content?.text) {
        // Alternative structure
        content = candidate.content.text;
      } else if (candidate?.content && typeof candidate.content === 'string') {
        // Direct string content
        content = candidate.content;
      }
      
      console.log('🔍 Extracted content:', content);
      console.log('🔍 Finish reason:', candidate?.finishReason);
      
      if (!content) {
        console.error('❌ No content in response. Full response:', data);
        
        // Fallback for MAX_TOKENS or empty content
        if (candidate?.finishReason === 'MAX_TOKENS') {
          console.warn('⚠️ Response truncated due to token limit, using fallback');
          const persona = this.getPersonaDetails(personaId);
          return `I understand. I'm here to listen and support you. Can you tell me more about what's on your mind?`;
        }
        
        throw new Error('No content generated');
      }

      return content.trim();
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  },

  createContextualStarterPrompt(personaId, context) {
    const persona = this.getPersonaDetails(personaId);
    
    // Use personalized persona data if available
    let personaDescription = persona.description;
    if (context.personaDetails) {
      const { personality, communication_style, interests, memories, speaking_style } = context.personaDetails;
      personaDescription = `a ${personality || 'caring'} person who ${communication_style || 'speaks with warmth'}. ${interests ? `You're interested in ${interests}.` : ''} ${memories ? `You share memories like ${memories}.` : ''} ${speaking_style ? `You speak ${speaking_style}.` : ''}`;
    }
    
    return `You are ${persona.name}, ${personaDescription}. 

IMPORTANT: The user is feeling ${context.mood || 'uncertain'} and their recent reflection theme is "${context.theme || 'general reflection'}". Their recent reflection was: "${context.reflectionText || 'No specific reflection provided'}"

CRITICAL: You must directly reference their mood (${context.mood}) and their specific situation from their reflection. Be personal and specific to what they shared.

Speak as ${persona.name} would, with their personality and speaking style. Start the conversation by acknowledging their current emotional state and offering support or guidance based on what they shared.

Keep it conversational, warm, and supportive. Start with 1-2 sentences that directly relate to their situation.`;
  },

  createGenericStarterPrompt(personaId, context = null) {
    const persona = this.getPersonaDetails(personaId);
    
    // Use personalized persona data if available
    let personaDescription = persona.description;
    if (context?.personaDetails) {
      const { personality, communication_style, interests, memories, speaking_style } = context.personaDetails;
      personaDescription = `a ${personality || 'caring'} person who ${communication_style || 'speaks with warmth'}. ${interests ? `You're interested in ${interests}.` : ''} ${memories ? `You share memories like ${memories}.` : ''} ${speaking_style ? `You speak ${speaking_style}.` : ''}`;
    }
    
    return `You are ${persona.name}, ${personaDescription}. 

Start a warm, supportive conversation as ${persona.name} would. Ask how they're doing or offer encouragement. Keep it conversational and caring.

Start with 1-2 sentences that feel natural for ${persona.name} to say.`;
  },

  createResponsePrompt(personaId, userMessage, conversationHistory, context) {
    const persona = this.getPersonaDetails(personaId);
    const historyText = conversationHistory.map(msg => 
      `${msg.isUser ? 'User' : persona.name}: ${msg.text}`
    ).join('\n');
    
    // Use personalized persona data if available
    let personaDescription = persona.description;
    if (context?.personaDetails) {
      const { personality, communication_style, interests, memories, speaking_style } = context.personaDetails;
      personaDescription = `a ${personality || 'caring'} person who ${communication_style || 'speaks with warmth'}. ${interests ? `You're interested in ${interests}.` : ''} ${memories ? `You share memories like ${memories}.` : ''} ${speaking_style ? `You speak ${speaking_style}.` : ''}`;
    }
    
    return `You are ${persona.name}, ${personaDescription}. 

Conversation history:
${historyText}

User's latest message: ${userMessage}

${context ? `Context: The user is feeling ${context.mood || 'uncertain'} and their theme is "${context.theme || 'general reflection'}"` : ''}

Respond as ${persona.name} would, staying in character. Be supportive, understanding, and helpful. Keep responses conversational and warm.`;
  },

  getPersonaDetails(personaId) {
    const personas = {
      mom: {
        name: 'Mom',
        description: 'a caring, nurturing mother who always wants the best for you. You speak with love, warmth, and gentle wisdom. You offer comfort and practical advice with a mother\'s touch.'
      },
      teacher: {
        name: 'Teacher',
        description: 'an encouraging, wise teacher who believes in your potential. You speak with patience, knowledge, and inspiration. You offer guidance and motivation to help them grow.'
      },
      friend: {
        name: 'Best Friend',
        description: 'a supportive, understanding best friend who knows you well. You speak with empathy, humor, and genuine care. You offer comfort and honest advice.'
      },
      therapist: {
        name: 'Therapist',
        description: 'a professional, insightful therapist who helps you understand yourself better. You speak with empathy, professionalism, and therapeutic insight. You offer guidance and help them process their feelings.'
      },
      mentor: {
        name: 'Mentor',
        description: 'an experienced, wise mentor who guides you toward success. You speak with wisdom, encouragement, and practical advice. You offer guidance and help them see their potential.'
      }
    };
    
    return personas[personaId] || personas.friend;
  }
};
