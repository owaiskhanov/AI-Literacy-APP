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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

  const systemInstruction =
    "You are the AI Literacy Character Creator assistant. " +
    "A child or storyteller gives you a prompt describing a storybook character. " +
    "You must return strictly valid JSON with:\n" +
    "1. talkBubble: A delightful, warm, 1-2 sentence in-character spoken dialogue from this character to the child.\n" +
    "2. characterName: An imaginative, charming name for the character.\n" +
    "3. imagePrompt: A detailed image generation prompt requesting an adorable fairytale watercolor children's book illustration of the character, isolated on a pure clean white background, full body standing character sticker style with clean edges, no text inside the image.\n\n" +
    "Output JSON format:\n" +
    '{"characterName": "...", "talkBubble": "...", "imagePrompt": "..."}';

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
    throw new Error(`Gemini Text Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('No response generated from Gemini 3.1');
  return JSON.parse(rawText);
}

/**
 * 2. Generate the character image using Gemini Image generation (Imagen 3 / Gemini Flash Image)
 */
async function generateCharacterImage(imagePrompt, apiKey) {
  // Method A: Try Imagen 3 Predict API
  try {
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const res = await fetch(imagenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: imagePrompt }],
        parameters: { sampleCount: 1, aspectRatio: '1:1' },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
      const mime = data?.predictions?.[0]?.mimeType || 'image/png';
      if (b64) {
        return `data:${mime};base64,${b64}`;
      }
    }
  } catch (err) {
    console.warn('Imagen 3 attempt failed, trying Gemini 3.1 Flash Image:', err.message);
  }

  // Method B: Try Gemini 3.1 Flash Image generateContent API
  const geminiImageUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`;
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
    throw new Error(`Image Generation Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('Image data was not returned in Gemini response');
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
