// Gemini 3.1 AI Service for Dynamic Character & Dialogue Generation

// Storage key for custom user API key in localStorage / memory
let inMemoryApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;

export function setGeminiApiKey(key) {
  inMemoryApiKey = key ? key.trim() : null;
  if (typeof window !== 'undefined' && window.localStorage) {
    if (inMemoryApiKey) {
      window.localStorage.setItem('GEMINI_API_KEY', inMemoryApiKey);
    } else {
      window.localStorage.removeItem('GEMINI_API_KEY');
    }
  }
}

export function getGeminiApiKey() {
  if (inMemoryApiKey) return inMemoryApiKey;
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('GEMINI_API_KEY');
    if (saved) return saved;
  }
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;
}

/**
 * 1. Generate in-character spoken dialogue and optimized art prompt using Gemini 3.1
 */
async function generateCharacterTextAndPrompt(userPrompt, apiKey) {
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
  ];

  const systemInstruction =
    "You are the AI Literacy 3D Mythical Character Creator assistant.\n" +
    "A child or storyteller gives you a prompt describing a character.\n" +
    "MANDATORY CREATIVE DIRECTIVES:\n" +
    "1. STYLE: Always 3D Pixar / DreamWorks animated movie style character render. High-end 3D CGI, smooth subsurface scattering, tactile stylized finish, adorable expressive face.\n" +
    "2. MYTHICAL TOUCH: Always make the character slightly mythical and enchanted, regardless of what was requested (even for common animals). Infuse subtle magical traits: celestial stardust, glowing mystical markings, tiny iridescent fairy/dragon wings, enchanted crystal horns, or glowing gemstone eyes.\n" +
    "3. BACKGROUND: Strict NO BACKGROUND isolated asset. Pure solid white (#FFFFFF) background cutout sticker with absolutely NO floor, NO ground shadows, NO scenery, NO borders.\n\n" +
    "Output strictly valid JSON format:\n" +
    '{"characterName": "...", "talkBubble": "...", "imagePrompt": "..."}';

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `Create character dialogue and image prompt for: "${userPrompt}"` }],
            },
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          generationConfig: {
            temperature: 0.8,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = new Error(`Gemini Text Error (${res.status}): ${errText}`);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        return JSON.parse(rawText);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('No response generated from Gemini API');
}

/**
 * 2. Generate the character image using Gemini Image generation (gemini-3.1-flash-image)
 */
async function generateCharacterImage(imagePrompt, apiKey) {
  const imageModels = [
    'gemini-3.1-flash-image',
    'gemini-2.5-flash-image',
    'gemini-3-pro-image',
  ];

  let lastErr = null;
  for (const model of imageModels) {
    try {
      const geminiImageUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(geminiImageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: imagePrompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastErr = new Error(`Image Generation Error (${model} - ${res.status}): ${errText}`);
        continue;
      }

      const data = await res.json();
      const candidate = data?.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
        }
      }
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error('Image data was not returned in Gemini response');
}

/**
 * Main export: Generate complete character (image + dialogue) with Gemini AI
 */
export async function generateCharacterWithGemini(userPrompt, customApiKey = null) {
  const activeKey = customApiKey || getGeminiApiKey();

  if (!activeKey) {
    return {
      needsApiKey: true,
      message: 'Please provide your Google Gemini API Key to generate real-time AI characters.',
    };
  }

  // 1. Generate personality & dialogue
  const textResult = await generateCharacterTextAndPrompt(userPrompt, activeKey);

  // 2. Generate isolated character illustration
  let imageUrl = null;
  try {
    imageUrl = await generateCharacterImage(textResult.imagePrompt, activeKey);
  } catch (imageErr) {
    console.warn('Image generation error, returning dialogue:', imageErr.message);
    return {
      success: true,
      characterName: textResult.characterName,
      talkBubble: textResult.talkBubble,
      imageError: imageErr.message,
      imagePrompt: textResult.imagePrompt,
    };
  }

  return {
    success: true,
    characterName: textResult.characterName,
    talkBubble: textResult.talkBubble,
    imageUrl: imageUrl,
    imagePrompt: textResult.imagePrompt,
  };
}
