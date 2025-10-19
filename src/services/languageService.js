import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY;

// Cache for languages to avoid repeated API calls
let languagesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fallback language list if API fails
const FALLBACK_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'tl', name: 'Filipino' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'he', name: 'Hebrew' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'et', name: 'Estonian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'el', name: 'Greek' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ga', name: 'Irish' },
  { code: 'cy', name: 'Welsh' },
  { code: 'mt', name: 'Maltese' },
  { code: 'eu', name: 'Basque' },
  { code: 'ca', name: 'Catalan' },
  { code: 'gl', name: 'Galician' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'sw', name: 'Swahili' },
  { code: 'am', name: 'Amharic' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'fa', name: 'Persian' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ha', name: 'Hausa' },
  { code: 'ig', name: 'Igbo' },
  { code: 'jw', name: 'Javanese' },
  { code: 'ka', name: 'Georgian' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'mr', name: 'Marathi' },
  { code: 'my', name: 'Burmese' },
  { code: 'ne', name: 'Nepali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'so', name: 'Somali' },
  { code: 'sq', name: 'Albanian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'tg', name: 'Tajik' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' }
];

export const languageService = {
  async getSupportedLanguages() {
    console.log('🌍 languageService: getSupportedLanguages called');
    
    // Check cache first
    if (languagesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      console.log('🌍 languageService: Using cached languages');
      return languagesCache;
    }

    console.log('🌍 languageService: OPENAI_API_KEY exists:', !!OPENAI_API_KEY);
    if (!OPENAI_API_KEY) {
      console.log('🌍 languageService: OpenAI API key not found, using fallback languages');
      languagesCache = FALLBACK_LANGUAGES;
      cacheTimestamp = Date.now();
      return FALLBACK_LANGUAGES;
    }

    try {
      console.log('🌍 languageService: Making API call to OpenAI');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a language expert. Provide a comprehensive list of languages that OpenAI ChatGPT can translate to/from. Return ONLY a JSON array of objects with "code" and "name" properties. Example: [{"code": "en", "name": "English"}, {"code": "es", "name": "Spanish"}]. Include major world languages and regional languages.'
            },
            {
              role: 'user',
              content: 'List all languages supported by ChatGPT for translation, with their ISO language codes and English names.'
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        // Remove markdown code blocks if present
        let jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Remove any other markdown formatting
        jsonContent = jsonContent.replace(/\*\*.*?\*\*/g, '');
        jsonContent = jsonContent.replace(/#{1,6}\s*/g, '');
        
        // Try to find JSON array in the content
        const jsonMatch = jsonContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        console.log('🌍 languageService: Parsing JSON content:', jsonContent.substring(0, 200) + '...');
        const languages = JSON.parse(jsonContent);
        
        if (Array.isArray(languages) && languages.length > 0) {
          // Deduplicate languages by code
          const uniqueLanguages = languages.filter((lang, index, self) => 
            index === self.findIndex(l => l.code === lang.code)
          );
          
          console.log('🌍 languageService: Successfully parsed', uniqueLanguages.length, 'languages');
          
          // Check if English is in the parsed languages
          const englishLang = uniqueLanguages.find(lang => lang.code === 'en');
          console.log('🌍 languageService: English language found in API response:', englishLang);
          
          // Debug: Show first few languages to see the format
          console.log('🌍 languageService: First 5 languages:', uniqueLanguages.slice(0, 5));
          
          // Check for any language with "English" in the name
          const englishByName = uniqueLanguages.find(lang => 
            lang.name && lang.name.toLowerCase().includes('english')
          );
          console.log('🌍 languageService: English by name search:', englishByName);
          
          languagesCache = uniqueLanguages;
          cacheTimestamp = Date.now();
          return uniqueLanguages;
        }
      } catch (parseError) {
        console.error('🌍 languageService: Error parsing OpenAI language response:', parseError);
        console.log('🌍 languageService: Raw content:', content.substring(0, 500));
      }
    } catch (error) {
      console.error('Error fetching languages from OpenAI:', error);
    }

    // Fallback to cached or default languages
    if (languagesCache) {
      return languagesCache;
    }

    languagesCache = FALLBACK_LANGUAGES;
    cacheTimestamp = Date.now();
    return FALLBACK_LANGUAGES;
  },

  getLanguageName(code) {
    if (!languagesCache) {
      const lang = FALLBACK_LANGUAGES.find(l => l.code === code);
      return lang ? lang.name : code;
    }
    
    const lang = languagesCache.find(l => l.code === code);
    return lang ? lang.name : code;
  }
};
