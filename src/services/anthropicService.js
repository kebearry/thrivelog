import Constants from 'expo-constants';

const ANTHROPIC_API_KEY = Constants.expoConfig?.extra?.ANTHROPIC_API_KEY;

const baseUrl = 'https://api.anthropic.com/v1/messages';

export const anthropicService = {
  async generateAdaptivePrompts(userContext, questionCount = 7) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not found');
    }

    try {
      const prompt = this.createPrompt(userContext, questionCount);
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      try {
        const parsed = JSON.parse(content);
        return parsed.questions || [];
      } catch (parseError) {
        // Fallback parsing
        const questions = content.match(/"[^"]+"/g) || [];
        return questions.map(q => q.replace(/"/g, ''));
      }
    } catch (error) {
      console.error('Error generating adaptive prompts:', error);
      throw error;
    }
  },

  createPrompt(userContext, questionCount) {
    return `Generate ${questionCount} unique, diverse reflection questions that are directly rateable on a 1-5 emoji scale (😢😐😊😄🤩).

CRITICAL: Each question must ask "HOW" the user feels about something, not "WHAT" happened.

User context: ${JSON.stringify(userContext)}

Return JSON format: {"questions": ["question1", "question2", ...]}

Examples of GOOD questions:
- "How grateful do you feel today?"
- "How confident do you feel about your goals?"
- "How connected do you feel to others?"

Examples of BAD questions:
- "What did you accomplish today?" (asks WHAT, not HOW)
- "What challenges did you face?" (asks WHAT, not HOW)
- "What are your goals?" (asks WHAT, not HOW)

Focus on emotional states, feelings, and internal experiences that can be rated 1-5.`;
  }
};

// Export individual function for compatibility
export const generateAdaptivePrompts = anthropicService.generateAdaptivePrompts;
