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
 * Advanced multi-pass background and ground shadow removal:
 * Converts RGBA buffer to a clean, crisp, transparent PNG with ZERO white halo,
 * ZERO micro-area white residue, and ZERO ground puddle shadows under feet.
 */
function removeWhiteBackground(rgbaData, width, height) {
  const data = rgbaData;
  const totalPixels = width * height;
  const isBg = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  // Helper: check if a pixel is background (pure white, off-white, or neutral light grey)
  function isOuterBgPixel(idx, isNearBottom = false) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const avg = (r + g + b) / 3;
    const diff = Math.max(r, g, b) - Math.min(r, g, b);

    // Standard white / off-white background
    if (avg >= 195 && diff < 36) return true;
    if (avg >= 185 && diff < 26) return true;

    // In bottom half of image, ground shadows & contact puddles appear (neutral light-grey/white)
    if (isNearBottom) {
      if (avg >= 155 && diff < 34) return true;
      if (avg >= 140 && diff < 22) return true; // neutral contact shadow
    }

    return false;
  }

  // Helper: check if an enclosed interior pixel is a background void (hole between limbs/tail)
  function isVoidPixel(idx, y) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const avg = (r + g + b) / 3;
    const diff = Math.max(r, g, b) - Math.min(r, g, b);

    // Pure flat white background showing through gaps
    if (avg >= 230 && diff < 16) return true;
    if (avg >= 200 && diff < 30) return true;
    if (avg >= 190 && diff < 22) return true;

    // In lower half of the character (between legs, under belly, around tail), floor shadows / gaps
    if (y > height * 0.45) {
      if (avg >= 155 && diff < 30) return true;
      if (avg >= 140 && diff < 20) return true;
    }

    return false;
  }

  // --- PASS 1: Seed outer perimeter to flood queue ---
  const bottomThresholdY = Math.floor(height * 0.45);

  for (let x = 0; x < width; x++) {
    // Top border
    if (isOuterBgPixel(x * 4, false)) {
      isBg[x] = 1;
      queue[tail++] = x;
    }
    // Bottom border
    const botIdx = (height - 1) * width + x;
    if (isOuterBgPixel(botIdx * 4, true)) {
      isBg[botIdx] = 1;
      queue[tail++] = botIdx;
    }
  }

  for (let y = 0; y < height; y++) {
    const isBot = y >= bottomThresholdY;
    // Left border
    const lIdx = y * width;
    if (!isBg[lIdx] && isOuterBgPixel(lIdx * 4, isBot)) {
      isBg[lIdx] = 1;
      queue[tail++] = lIdx;
    }
    // Right border
    const rIdx = y * width + (width - 1);
    if (!isBg[rIdx] && isOuterBgPixel(rIdx * 4, isBot)) {
      isBg[rIdx] = 1;
      queue[tail++] = rIdx;
    }
  }

  // --- PASS 2: BFS Flood Fill from Outer Perimeter ---
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
        const ny = Math.floor(n / width);
        if (isOuterBgPixel(n * 4, ny >= bottomThresholdY)) {
          isBg[n] = 1;
          queue[tail++] = n;
        }
      }
    }
  }

  // --- PASS 3: Enclosed Hole & Micro-Area Clearing (Interior Voids) ---
  // Scan for connected components of white/void pixels that were trapped between limbs/tail
  const visited = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    if (isBg[i] === 1) {
      visited[i] = 1;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (visited[p] === 1) continue;

      const pIdx = p * 4;
      if (isVoidPixel(pIdx, y)) {
        // Collect this entire connected component of void pixels
        const comp = [];
        const cQueue = [p];
        visited[p] = 1;
        let cHead = 0;
        let touchesOuterBg = false;

        while (cHead < cQueue.length) {
          const cp = cQueue[cHead++];
          comp.push(cp);
          const cpx = cp % width;
          const cpy = Math.floor(cp / width);

          const cNeighbors = [
            cpx > 0 ? cp - 1 : -1,
            cpx < width - 1 ? cp + 1 : -1,
            cpy > 0 ? cp - width : -1,
            cpy < height - 1 ? cp + width : -1,
          ];

          for (let ni = 0; ni < 4; ni++) {
            const cn = cNeighbors[ni];
            if (cn !== -1) {
              if (isBg[cn] === 1) {
                touchesOuterBg = true;
              } else if (visited[cn] === 0) {
                const cny = Math.floor(cn / width);
                if (isVoidPixel(cn * 4, cny)) {
                  visited[cn] = 1;
                  cQueue.push(cn);
                }
              }
            }
          }
        }

        // An interior region is background if:
        // 1. It directly touches the outer background, OR
        // 2. It contains flat pure white pixels (background canvas showing through gap), OR
        // 3. Its average is near pure white with low saturation, OR
        // 4. It is neutral floor shadow in the bottom area (> 45% height)
        let hasPureFlatWhite = false;
        let compTotalAvg = 0;
        let compTotalDiff = 0;
        for (let ci = 0; ci < comp.length; ci++) {
          const cpi = comp[ci] * 4;
          const cr = data[cpi], cg = data[cpi + 1], cb = data[cpi + 2];
          const cavg = (cr + cg + cb) / 3;
          const cdiff = Math.max(cr, cg, cb) - Math.min(cr, cg, cb);
          compTotalAvg += cavg;
          compTotalDiff += cdiff;
          if (cavg >= 240 && cdiff <= 12) {
            hasPureFlatWhite = true;
          }
        }
        const meanAvg = compTotalAvg / comp.length;
        const meanDiff = compTotalDiff / comp.length;
        const compY = Math.floor(comp[0] / width);
        const isNearBottom = compY > height * 0.45;

        if (
          touchesOuterBg ||
          hasPureFlatWhite ||
          (meanAvg >= 235 && meanDiff <= 14) ||
          (isNearBottom && meanAvg >= 155 && meanDiff <= 22)
        ) {
          for (let ci = 0; ci < comp.length; ci++) {
            isBg[comp[ci]] = 1;
          }
        }
      }
    }
  }

  // --- PASS 4: Edge Feathering, De-Fringing & Unpremultiplication ---
  // Completely eliminates white halos, jagged edges, and off-white boundary bleed
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    if (isBg[i] === 1) {
      data[idx + 3] = 0; // 100% transparent
    } else {
      const x = i % width;
      const y = Math.floor(i / width);
      let bgCount = 0;

      // Check 3x3 neighborhood for background contact
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (isBg[ny * width + nx] === 1) {
            bgCount++;
          }
        }
      }

      if (bgCount > 0) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const avg = (r + g + b) / 3;
        const diff = Math.max(r, g, b) - Math.min(r, g, b);

        // If edge pixel is light (white background bleed from JPEG compression)
        if (avg > 160 && diff < 50) {
          // Calculate true alpha based on brightness distance from pure white
          const alphaFactor = Math.max(0, Math.min(1, (255 - avg) / (255 - 155)));
          data[idx + 3] = Math.round(alphaFactor * 255);

          // Color un-mixing (de-matting): remove white background luminance bleed
          if (alphaFactor > 0.15) {
            const unmix = (val) => Math.max(0, Math.min(255, Math.round((val - 255 * (1 - alphaFactor)) / alphaFactor)));
            data[idx] = unmix(r);
            data[idx + 1] = unmix(g);
            data[idx + 2] = unmix(b);
          }
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
    "3. BACKGROUND: Strict NO BACKGROUND isolated subject directly on solid pure flat white #FFFFFF background canvas. Absolutely NO floor, NO ground plane, NO surface shadows, NO ground shadows, NO scenery, NO borders, NO white sticker outlines or die-cut margins.\n" +
    "4. POSE & FULL BODY SILHOUETTE: Full-body standing or perched character pose with entire character completely visible head-to-toe inside the frame, never cropped at the edges or feet. Clean bottom silhouette on flat white with absolutely ZERO ground plane, ZERO floor surface, ZERO cast shadow, ZERO contact shadow puddles beneath paws or feet. The paws and feet must float cleanly against the pure white #FFFFFF void.\n" +
    "5. DIALOGUE LENGTH: talkBubble MUST be a short, sweet 1-2 sentence spoken greeting (strictly 12 to 18 words maximum). E.g. \"The ocean breeze is calling! Adventure awaits beyond the horizon! 🌊⚓\". Never write long paragraphs.\n" +
    "6. VISUAL CONTINUITY & MERCHANDISE SPECIFICATIONS:\n" +
    "- visualDescription: A vivid, concise 2-sentence visual description capturing the character's exact colors, fur/scales/feathers, wing texture, eye color, and unique magical marking. This is stored in the child's account so future story scenes and merchandise maintain 100% visual consistency!\n" +
    "- traits: An array of 3-4 inspiring traits (e.g. [\"Brave\", \"Crystal Wings\", \"Star Magic\"]).\n" +
    "- signatureItem: A signature magical item or accessory (e.g. \"Star Crystal Pendant\", \"Enchanted Compass\", \"Glowing Stardust Scarf\").\n\n" +
    "Output strictly valid JSON format:\n" +
    '{"characterName": "...", "talkBubble": "...", "imagePrompt": "...", "visualDescription": "...", "traits": ["...", "..."], "signatureItem": "..."}';

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

  // Guarantee standing pose, full-body visibility, and zero floor shadows on flat white canvas
  const enhancedPrompt = `${imagePrompt}. Full-body standing character pose, complete head-to-toe figure visible inside frame with clean margins. Isolated character floating on seamless solid pure flat white #FFFFFF canvas, absolutely ZERO ground shadows, ZERO floor shadows, ZERO contact shadow puddles beneath paws or feet, ZERO ambient occlusion on the floor, clean bottom silhouette, ZERO scenery, ZERO borders, NO sticker outlines.`;

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
  const traits = Array.isArray(textResult.traits) && textResult.traits.length > 0
    ? textResult.traits
    : ['Mythical', 'Brave', 'Kind'];
  const visualDesc = textResult.visualDescription || textResult.imagePrompt || `A magical 3D character named ${textResult.characterName || 'friend'}.`;
  const signatureItem = textResult.signatureItem || 'Enchanted Stardust';

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
      visualDescription: visualDesc,
      traits: traits,
      signatureItem: signatureItem,
      originalPrompt: userPrompt,
    };
  }

  return {
    success: true,
    characterName: textResult.characterName,
    talkBubble: textResult.talkBubble,
    imageUrl: imageUrl,
    imagePrompt: textResult.imagePrompt,
    visualDescription: visualDesc,
    traits: traits,
    signatureItem: signatureItem,
    originalPrompt: userPrompt,
  };
}
