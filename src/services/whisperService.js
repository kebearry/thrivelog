import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY;

/**
 * Transcribe audio using OpenAI Whisper API
 * @param {string} audioUri - URI of the audio file to transcribe
 * @returns {Promise<string>} - Transcribed text
 */
export const transcribeAudio = async (audioUri) => {
  try {
    console.log('Starting audio transcription...');
    
    // Create FormData to send the audio file
    const formData = new FormData();
    
    // For React Native, we need to create a file object
    const audioFile = {
      uri: audioUri,
      type: 'audio/m4a', // or 'audio/wav' depending on your recording format
      name: 'recording.m4a',
    };
    
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    // Remove language parameter to allow auto-detection
    
    // Make the API call to OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('Transcription successful:', result.text);
    
    return result.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

/**
 * Alternative method using OpenAI SDK (if the above doesn't work)
 * @param {string} audioUri - URI of the audio file to transcribe
 * @returns {Promise<string>} - Transcribed text
 */
export const transcribeAudioWithSDK = async (audioUri) => {
  try {
    console.log('Starting audio transcription with SDK...');
    
    // Read the audio file as a buffer
    const response = await fetch(audioUri);
    const audioBuffer = await response.arrayBuffer();
    
    // Create a File object from the buffer
    const audioFile = new File([audioBuffer], 'recording.m4a', { type: 'audio/m4a' });
    
    // Use OpenAI SDK to transcribe
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
    });
    
    console.log('Transcription successful:', transcription.text);
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio with SDK:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

/**
 * Translate text to user's preferred language using OpenAI GPT
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., 'es' for Spanish)
 * @returns {Promise<string>} - Translated text
 */
export const translateToLanguage = async (text, targetLanguage = 'en') => {
  try {
    console.log(`Starting translation to ${targetLanguage}...`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLanguage}. If the text is already in ${targetLanguage}, return it unchanged. Only return the translated text, no explanations.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    const translatedText = result.choices[0].message.content.trim();
    console.log('Translation successful:', translatedText);
    
    return translatedText;
  } catch (error) {
    console.error('Error translating text:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
};

/**
 * Transcribe and translate audio to user's preferred language
 * @param {string} audioUri - URI of the audio file
 * @param {string} targetLanguage - Target language code (e.g., 'es' for Spanish)
 * @returns {Promise<string>} - Transcribed and translated text
 */
export const transcribeAndTranslate = async (audioUri, targetLanguage = 'en') => {
  try {
    console.log('Starting transcription and translation...');
    
    // First transcribe the audio
    const transcribedText = await transcribeAudio(audioUri);
    console.log('Transcribed text:', transcribedText);
    
    // Check if translation is needed (detect non-English)
    // Korean: \u1100-\u11FF (Hangul Jamo), \u3130-\u318F (Hangul Compatibility Jamo), \uAC00-\uD7AF (Hangul Syllables)
    // Chinese: \u4e00-\u9fff (CJK Unified Ideographs)
    // Japanese: \u3040-\u309f (Hiragana), \u30a0-\u30ff (Katakana)
    const isLikelyNonEnglish = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u0400-\u04ff\u0370-\u03ff\u0600-\u06ff]/.test(transcribedText);
    
    console.log('🔍 Transcribed text:', transcribedText);
    console.log('🔍 Is likely non-English:', isLikelyNonEnglish);
    console.log('🔍 Target language:', targetLanguage);
    
    if (isLikelyNonEnglish) {
      console.log('Non-English text detected, translating...');
      const translatedText = await translateToLanguage(transcribedText, targetLanguage);
      console.log('🔍 Translated text:', translatedText);
      return translatedText;
    } else {
      // Additional check: if target language is not English, always translate
      if (targetLanguage !== 'en') {
        console.log('Target language is not English, translating anyway...');
        const translatedText = await translateToLanguage(transcribedText, targetLanguage);
        console.log('🔍 Translated text:', translatedText);
        return translatedText;
      } else {
        console.log('English text detected, no translation needed');
        return transcribedText;
      }
    }
  } catch (error) {
    console.error('Error in transcribeAndTranslate:', error);
    throw error;
  }
};

// Export the service
export const whisperService = {
  transcribeAudio,
  translateToLanguage,
  transcribeAndTranslate
};
