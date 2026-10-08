// Gemini 3.1 AI Service for Character Generation & Talk Bubble Interaction
const FALLBACK_PROFILES = {
  fox: {
    name: 'Captain Rusty',
    type: 'fox',
    quotes: [
      "The ocean breeze is calling! Let's hoist the sails and find hidden treasure! 🌊⚓",
      "My compass always points toward brave new adventures! Are you ready? 🧭✨",
      "Look at that golden sunset over the castle waves! Let's explore the tide pools!",
      "With a trusty map and a curious heart, no storm can stop us! ⛵🦊",
    ],
  },
  owl: {
    name: 'Professor Hoot',
    type: 'owl',
    quotes: [
      "Hoo-hoo! Every starry night holds secrets waiting to be uncovered in ancient books! 📖✨",
      "Put on your explorer glasses—wisdom is the greatest superpower in the realm! 👓🦉",
      "I've read tales of the floating castle islands... shall we decipher their riddle together?",
      "Curiosity is the key that unlocks every enchanted door in the kingdom!",
    ],
  },
  dragon: {
    name: 'Sparky the Emerald',
    type: 'dragon',
    quotes: [
      "I found a glimmering sunstone in the sea caves! Wanna see it glow? 💎🔥",
      "My wings are tiny, but my courage can soar higher than the tallest castle turret! 🐉✨",
      "Warm sea breeze, sunny rocks, and good friends—today is a magical day to fly!",
      "Roar! That's dragon for 'I'm super excited to be your story companion!' 💚",
    ],
  },
};

/**
 * Determine character type from prompt text
 */
function inferCharacterType(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('owl') || p.includes('bird') || p.includes('wise') || p.includes('book') || p.includes('glass')) {
    return 'owl';
  }
  if (p.includes('dragon') || p.includes('scale') || p.includes('fire') || p.includes('wing') || p.includes('lizard')) {
    return 'dragon';
  }
  return 'fox';
}

/**
 * Call Gemini 3.1 (or fallback) to generate in-character talk bubble and metadata
 */
export async function generateCharacterWithGemini(userPrompt, apiKey = null) {
  const activeKey = apiKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || null;

  if (activeKey) {
    try {
      // Using Gemini 3.1 Flash-Lite for fast, responsive character dialogue
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${activeKey}`;
      
      const systemInstruction = 
        "You are an imaginative character creation AI for a magical children's storytelling app called 'AI Literacy'. " +
        "When given a character description prompt, generate a lively in-character response that appears in the character's speech bubble. " +
        "Output strictly valid JSON with this format:\n" +
        "{\n" +
        '  "characterName": "Name of character",\n' +
        '  "talkBubble": "Short (1-2 sentences) enthusiastic in-character spoken dialogue addressed to the child",\n' +
        '  "characterType": "fox" | "owl" | "dragon",\n' +
        '  "visualSummary": "One sentence summary of their appearance"\n' +
        "}";

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `Create character and speech bubble for prompt: "${userPrompt}"` }],
            },
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 300,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            characterName: parsed.characterName || 'Adventurer',
            talkBubble: parsed.talkBubble,
            characterType: ['fox', 'owl', 'dragon'].includes(parsed.characterType) ? parsed.characterType : inferCharacterType(userPrompt),
            visualSummary: parsed.visualSummary || userPrompt,
            isAiGenerated: true,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini 3.1 call fallback:', err.message);
    }
  }

  // Fallback simulator with intelligent matching & simulated delay for natural feel
  await new Promise((resolve) => setTimeout(resolve, 800));

  const type = inferCharacterType(userPrompt);
  const profile = FALLBACK_PROFILES[type];
  const randomQuote = profile.quotes[Math.floor(Math.random() * profile.quotes.length)];

  return {
    characterName: profile.name,
    talkBubble: randomQuote,
    characterType: type,
    visualSummary: userPrompt,
    isAiGenerated: false,
  };
}
