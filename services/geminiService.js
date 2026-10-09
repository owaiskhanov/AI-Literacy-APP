import jpeg from 'jpeg-js';
import UPNG from 'upng-js';
import base64js from 'base64-js';
import Constants from 'expo-constants';

// Pre-configured Gemini API key (always connected for all users)
const DEFAULT_GEMINI_API_KEY = 'AQ.Ab8RN6K3JqGnId3q5NVKXEzuoRq0sk6WxuEKMSApd-FQ6kjLkQ';

// Storage key for custom user API key in localStorage / memory
let inMemoryApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants?.expoConfig?.extra?.geminiApiKey || DEFAULT_GEMINI_API_KEY;

export function setGeminiApiKey(key) {
  inMemoryApiKey = key ? key.trim() : DEFAULT_GEMINI_API_KEY;
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
  return (
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    Constants?.expoConfig?.extra?.geminiApiKey ||
    DEFAULT_GEMINI_API_KEY
  );
}

/**
 * Remove solid white background and convert RGBA buffer to transparent PNG
 */
function removeWhiteBackground(rgbaData, width, height) {
  const data = rgbaData;
  const totalPixels = width * height;
  const isBg = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  function isWhitePixel(idx) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r > 224 && g > 224 && b > 224;
  }

  // Push border pixels to flood queue
  for (let x = 0; x < width; x++) {
    const topIdx = x * 4;
    const botIdx = ((height - 1) * width + x) * 4;
    if (isWhitePixel(topIdx)) {
      isBg[x] = 1;
      queue[tail++] = x;
    }
    const bPixel = (height - 1) * width + x;
    if (isWhitePixel(botIdx)) {
      isBg[bPixel] = 1;
      queue[tail++] = bPixel;
    }
  }

  for (let y = 0; y < height; y++) {
    const lPixel = y * width;
    const rPixel = y * width + (width - 1);
    if (!isBg[lPixel] && isWhitePixel(lPixel * 4)) {
      isBg[lPixel] = 1;
      queue[tail++] = lPixel;
    }
    if (!isBg[rPixel] && isWhitePixel(rPixel * 4)) {
      isBg[rPixel] = 1;
      queue[tail++] = rPixel;
    }
  }

  // BFS flood-fill outside perimeter
  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const n = neighbors[i];
      if (n !== -1 && isBg[n] === 0) {
        if (isWhitePixel(n * 4)) {
          isBg[n] = 1;
          queue[tail++] = n;
        }
      }
    }
  }

  // Alpha assignment and soft anti-aliased edge feathering
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    if (isBg[i] === 1) {
      data[idx + 3] = 0;
    } else {
      const x = i % width;
      const y = Math.floor(i / width);
      let bgNeighbors = 0;
      if (x > 0 && isBg[i - 1] === 1) bgNeighbors++;
      if (x < width - 1 && isBg[i + 1] === 1) bgNeighbors++;
      if (y > 0 && isBg[i - width] === 1) bgNeighbors++;
      if (y < height - 1 && isBg[i + width] === 1) bgNeighbors++;

      if (bgNeighbors > 0) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const avg = (r + g + b) / 3;
        if (avg > 185) {
          const factor = Math.max(0, Math.min(1, (255 - avg) / 70));
          data[idx + 3] = Math.round(factor * 255);
        }
      }
    }
  }
}

/**
 * 1. Generate in-character spoken dialogue and optimized art prompt using Gemini 3.8
 */
async function generateCharacterTextAndPrompt(userPrompt, apiKey) {
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
  ];

  const systemInstruction =
    "You are the AI Literacy 3D Mythical Character Creator assistant.\n" +
    "A child or storyteller gives you a prompt describing a character.\n" +
    "MANDATORY CREATIVE DIRECTIVES:\n" +
    "1. STYLE: Always 3D Pixar / DreamWorks animated movie style character render. High-end 3D CGI, smooth subsurface scattering, tactile stylized finish, adorable expressive face.\n" +
    "2. MYTHICAL TOUCH: Always make the character slightly mythical and enchanted, regardless of what was requested (even for common animals). Infuse subtle magical traits: celestial stardust, glowing mystical markings, tiny iridescent fairy/dragon wings, enchanted crystal horns, or glowing gemstone eyes.\n" +
    "3. BACKGROUND: Strict NO BACKGROUND isolated subject directly on solid pure flat white #FFFFFF background. Absolutely NO floor, NO ground shadows, NO scenery, NO borders, NO white sticker outlines or die-cut margins.\n" +
    "4. POSE & GROUNDING (ALWAYS STANDING): Mandatory full-body standing or perched pose with feet, paws, or talons planted firmly flat at the bottom base of the frame, full body completely visible from head to toe. The character must stand upright so it plants firmly on a stone pedestal. Never floating in mid-air, never flying without ground contact, never lying down, and never cropped at the waist, knees, or neck.\n" +
    "5. DIALOGUE LENGTH: talkBubble MUST be a short, sweet 1-2 sentence spoken greeting (strictly 12 to 18 words maximum). E.g. \"The ocean breeze is calling! Adventure awaits beyond the horizon! 🌊⚓\". Never write long paragraphs.\n\n" +
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
 * 2. Generate the character image using Gemini Image generation and convert to transparent PNG
 */
async function generateCharacterImage(imagePrompt, apiKey) {
  const imageModels = [
    'gemini-3.1-flash-image',
    'gemini-3-pro-image',
  ];

  // Guarantee standing pose and isolated solid white background in final image prompt
  const enhancedPrompt = imagePrompt.toLowerCase().includes('standing')
    ? imagePrompt
    : `Full body standing pose, feet firmly planted at bottom of frame, full figure head to toe, upright posture. ${imagePrompt}. Isolated subject directly on solid pure white #FFFFFF background with no floor, no shadows, no white sticker outline or border.`;

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
              parts: [{ text: enhancedPrompt }],
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
          const rawBase64 = part.inlineData.data;
          try {
            // Convert to transparent PNG
            const jpegBytes = base64js.toByteArray(rawBase64);
            const decoded = jpeg.decode(jpegBytes, { useTArray: true });
            removeWhiteBackground(decoded.data, decoded.width, decoded.height);
            const pngBytes = UPNG.encode([decoded.data.buffer], decoded.width, decoded.height, 0);
            const pngBase64 = base64js.fromByteArray(new Uint8Array(pngBytes));
            return `data:image/png;base64,${pngBase64}`;
          } catch (procErr) {
            console.warn('Transparent PNG conversion fallback:', procErr);
            return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${rawBase64}`;
          }
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
