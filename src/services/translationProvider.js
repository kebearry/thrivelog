import Constants from 'expo-constants';

/**
 * Translation provider that can switch between different services
 */
class TranslationProvider {
  constructor() {
    this.cache = new Map();
    this.userLanguage = 'en';
    this.provider = this.detectBestProvider();
  }

  detectBestProvider() {
    // Check if OpenAI API key is available
    const hasOpenAI = !!Constants.expoConfig?.extra?.OPENAI_API_KEY;
    
    if (hasOpenAI) {
      console.log('🔍 Using OpenAI for translation');
      return 'openai';
    } else {
      console.log('🔍 No translation providers available');
      return 'none';
    }
  }

  setUserLanguage(language) {
    this.userLanguage = language || 'en';
  }

  needsTranslation() {
    return this.userLanguage !== 'en';
  }

  async translateText(text, context = '') {
    if (!this.needsTranslation() || !text) {
      return text;
    }

    // Check cache first
    const cacheKey = `${this.userLanguage}:${text}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let translated;
      
      if (this.provider === 'openai') {
        translated = await this.translateWithOpenAI(text, context);
      } else {
        console.log('🔍 No translation provider available, using original text');
        return text;
      }

      if (translated && translated !== text) {
        this.cache.set(cacheKey, translated);
        return translated;
      }

      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  // Google Translate method removed - using OpenAI only

  async translateWithOpenAI(text, context) {
    const apiKey = Constants.expoConfig?.extra?.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not found');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `Translate the following text from ${this.userLanguage} to English. Return only the translated text.`
          },
          { role: 'user', content: text }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim();
  }

  clearCache() {
    this.cache.clear();
  }
}

export const translationProvider = new TranslationProvider();
export default translationProvider;
