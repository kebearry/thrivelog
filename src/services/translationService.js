import Constants from 'expo-constants';

/**
 * Translation service using OpenAI ChatGPT
 * Translates app text based on user's profile language
 */
class TranslationService {
  constructor() {
    this.cache = new Map();
    this.userLanguage = 'en'; // Default to English
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.requestWindowStart = Date.now();
  }

  /**
   * Set the user's preferred language
   */
  setUserLanguage(language) {
    this.userLanguage = language || 'en';
  }

  /**
   * Get user's current language
   */
  getUserLanguage() {
    return this.userLanguage;
  }

  /**
   * Check if translation is needed
   */
  needsTranslation() {
    return this.userLanguage !== 'en';
  }

  /**
   * Translate text using OpenAI ChatGPT
   */
  async translateText(text, context = '') {
    if (!this.needsTranslation() || !text) {
      return text;
    }

    // Check cache first
    const cacheKey = `${this.userLanguage}:${text}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Rate limiting: 3 requests per minute (20 seconds between requests)
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 20000; // 20 seconds between requests (3 RPM = 1 per 20 seconds)
    
    if (timeSinceLastRequest < minInterval) {
      console.log(`🔍 Rate limiting: Waiting ${minInterval - timeSinceLastRequest}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
    }

    // Check if we've made too many requests in the current window
    const windowDuration = 60000; // 1 minute window
    if (now - this.requestWindowStart > windowDuration) {
      // Reset the window
      this.requestWindowStart = now;
      this.requestCount = 0;
    }

    if (this.requestCount >= 3) {
      console.log('🔍 Rate limit: Too many requests in current window, using original text');
      return text;
    }

    try {
      const apiKey = Constants.expoConfig?.extra?.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn('OpenAI API key not found, returning original text');
        return text;
      }
      
      console.log('🔍 TranslationService: API key found, proceeding with translation');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini', // Better rate limits: 60,000 TPM vs 10,000 TPM
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text to ${this.getLanguageName(this.userLanguage)}. 

IMPORTANT RULES:
1. DO NOT translate proper nouns like "Thrivelog", brand names, or user names
2. DO NOT translate technical terms that should remain in English
3. Keep the same tone and style as the original
4. If the text contains a user's name (like "Riley", "John", etc.), keep it unchanged
5. Maintain any HTML tags or formatting
6. Return ONLY the translated text, no explanations

Context: ${context}`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.choices[0]?.message?.content?.trim();

      // Update rate limiting counters
      this.lastRequestTime = Date.now();
      this.requestCount++;

      if (translatedText && translatedText !== text) {
        // Cache the result
        this.cache.set(cacheKey, translatedText);
        return translatedText;
      }

      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  /**
   * Get language name for the system prompt
   */
  getLanguageName(languageCode) {
    const languageNames = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese (Simplified)',
      'zh-tw': 'Chinese (Traditional)',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'tl': 'Filipino',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'pl': 'Polish',
      'tr': 'Turkish',
      'he': 'Hebrew',
      'uk': 'Ukrainian',
      'cs': 'Czech',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'sk': 'Slovak',
      'sl': 'Slovenian',
      'et': 'Estonian',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'el': 'Greek',
      'ca': 'Catalan',
      'eu': 'Basque',
      'gl': 'Galician',
      'is': 'Icelandic',
      'ga': 'Irish',
      'mt': 'Maltese',
      'cy': 'Welsh',
      'sq': 'Albanian',
      'mk': 'Macedonian',
      'sr': 'Serbian',
      'bs': 'Bosnian',
      'be': 'Belarusian',
      'ka': 'Georgian',
      'hy': 'Armenian',
      'az': 'Azerbaijani',
      'kk': 'Kazakh',
      'mn': 'Mongolian',
      'uz': 'Uzbek',
      'ky': 'Kyrgyz',
      'tg': 'Tajik',
      'tk': 'Turkmen',
      'af': 'Afrikaans',
      'sw': 'Swahili',
      'am': 'Amharic',
      'ha': 'Hausa',
      'ig': 'Igbo',
      'yo': 'Yoruba',
      'zu': 'Zulu',
      'xh': 'Xhosa',
      'st': 'Sotho',
      'tn': 'Tswana',
      'ss': 'Swati',
      've': 'Venda',
      'ts': 'Tsonga',
      'nr': 'Ndebele',
      'nso': 'Northern Sotho',
      'bn': 'Bengali',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'mr': 'Marathi',
      'ne': 'Nepali',
      'pa': 'Punjabi',
      'si': 'Sinhala',
      'ta': 'Tamil',
      'te': 'Telugu',
      'ur': 'Urdu',
      'fa': 'Persian',
      'ps': 'Pashto',
      'sd': 'Sindhi',
      'my': 'Burmese',
      'km': 'Khmer',
      'lo': 'Lao'
    };
    return languageNames[languageCode] || 'English';
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Batch translate multiple texts
   */
  async translateBatch(texts, context = '') {
    if (!this.needsTranslation()) {
      return texts;
    }

    const results = {};
    const promises = Object.entries(texts).map(async ([key, text]) => {
      const translated = await this.translateText(text, context);
      results[key] = translated;
    });

    await Promise.all(promises);
    return results;
  }
}

// Export singleton instance
export const translationService = new TranslationService();
export default translationService;
