import Constants from 'expo-constants';

const FAL_API_KEY = Constants.expoConfig?.extra?.FAL_API_KEY;

const baseUrl = 'https://fal.run/fal-ai/flux/dev';

export const falArtService = {
  async generateMoodArt(mood, theme, postcardText = '') {
    if (!FAL_API_KEY) {
      throw new Error('Fal.ai API key not found');
    }

    try {
      const reflectionData = { mood, theme, postcardText };
      const prompt = this.createMoodPrompt(reflectionData);
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          seed: Math.floor(Math.random() * 1000000)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fal.ai API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.images || data.images.length === 0) {
        throw new Error('No image generated');
      }

      return {
        imageUrl: data.images[0].url,
        mood: mood,
        theme: theme,
        postcardText: postcardText,
        prompt: prompt
      };
    } catch (error) {
      console.error('Error generating mood art:', error);
      throw error;
    }
  },

  createMoodPrompt(reflectionData) {
    const { mood, theme, summary, postcardText } = reflectionData;
    
    let prompt = `Create a beautiful, artistic representation of the emotion "${mood}". `;
    
    if (theme) {
      prompt += `The theme is "${theme}". `;
    }
    
    if (summary) {
      prompt += `The mood should reflect: ${summary}. `;
    }
    
    prompt += `Style: soft, dreamy, artistic, emotional, with warm colors and gentle lighting. `;
    prompt += `Avoid text or words in the image. Focus on abstract emotional representation.`;
    
    if (postcardText) {
      prompt += ` IMPORTANT: Add the following text directly onto the image: "${postcardText}". `;
      prompt += `The text should be:`;
      prompt += `- Written in beautiful cursive handwriting style`;
      prompt += `- Positioned elegantly on the image (bottom center or artistically placed)`;
      prompt += `- In white or light colored cursive font with subtle shadow for readability`;
      prompt += `- Integrated naturally into the artistic composition as if handwritten`;
      prompt += `- Elegant, flowing cursive script that complements the mood`;
      prompt += `- Not too large, but clearly visible and readable`;
    }
    
    return prompt;
  }
};
