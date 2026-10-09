import { getGeminiApiKey } from './geminiService';

/**
 * The 6-Beat Classic Narrative Arc for Kids
 * Each beat defines:
 * - beat: 1..6
 * - title: Kid-friendly beat title
 * - question: How the Co-pilot character prompts the child
 * - options: 4 whimsical preset choices
 * - defaultSetting: Theme backdrop
 */
export const STORY_BEATS = [
  {
    beat: 1,
    id: 'ordinary_world',
    title: 'The Secret Beginning',
    subtitle: 'Where does our adventure start?',
    question: (charName) => `Hi there! I'm ${charName}! Where should we start our grand journey today?`,
    options: [
      { id: 'opt_castle', icon: '🏰', label: 'Grand Crystal Castle', desc: 'High atop the clouds with glowing towers' },
      { id: 'opt_treehouse', icon: '🌳', label: 'Enchanted Whispering Treehouse', desc: 'Hidden among giant glowing leaves and lanterns' },
      { id: 'opt_lagoon', icon: '🌊', label: 'Starfish Coral Lagoon', desc: 'Sparkling turquoise waters with friendly sea turtles' },
      { id: 'opt_bedroom', icon: '⭐', label: 'Cozy Starlight Bedroom', desc: 'Surrounded by floating toy ships and fairy lights' },
    ],
    hint: 'Pick our starting home or type your own cozy place!',
  },
  {
    beat: 2,
    id: 'inciting_incident',
    title: 'The Mysterious Discovery',
    subtitle: 'What exciting clue did we find?',
    question: (charName) => `Wait! Look behind that sparkly glow... what mysterious clue did we just stumble upon?!`,
    options: [
      { id: 'opt_map', icon: '🗺️', label: 'A Glowing Treasure Map', desc: 'Drawn in golden ink pointing to Rainbow Valley' },
      { id: 'opt_key', icon: '🗝️', label: 'An Antique Windup Key', desc: 'Humming a soft magical melody' },
      { id: 'opt_egg', icon: '🥚', label: 'A Speckled Dragon Egg', desc: 'Wobbling gently with warm violet sparkles' },
      { id: 'opt_letter', icon: '📜', label: 'A Flying Stardust Letter', desc: 'Folded like an origami bird asking for help' },
    ],
    hint: 'What mystery will guide our adventure?',
  },
  {
    beat: 3,
    id: 'journey_begins',
    title: 'Into The Unknown',
    subtitle: 'Where is our clue leading us?',
    question: (charName) => `Pack our bags! The clue is pulling us forward! Where are we exploring next?!`,
    options: [
      { id: 'opt_bridge', icon: '🌈', label: 'Across The Rainbow Bridge', desc: 'Floating high above a sea of fluffy pink clouds' },
      { id: 'opt_galleon', icon: '⛵', label: 'Sailing A Flying Cloud Ship', desc: 'Catching the cosmic solar wind with purple sails' },
      { id: 'opt_crystals', icon: '💎', label: 'Deep Into The Neon Caves', desc: 'Illuminated by singing giant quartz crystals' },
      { id: 'opt_mushroom', icon: '🍄', label: 'The Giant Mushroom Forest', desc: 'Bouncing softly from one huge cap to another' },
    ],
    hint: 'Choose our magical travel destination!',
  },
  {
    beat: 4,
    id: 'obstacle',
    title: 'The Surprising Obstacle',
    subtitle: 'Oh no! What is blocking our path?',
    question: (charName) => `Uh oh! Stop right there! Look ahead... what is blocking our way through?!`,
    options: [
      { id: 'opt_yeti', icon: '🐻', label: 'A Sleepy Furry Yeti', desc: 'Snoring so loudly the ground is shaking with giggles' },
      { id: 'opt_riddle', icon: '🐒', label: 'A Bridge Of Silly Monkeys', desc: 'Demanding the answer to their goofiest riddle' },
      { id: 'opt_marshmallow', icon: '☁️', label: 'A Sweet Cotton Candy Storm', desc: 'Thick yummy clouds making it impossible to see' },
      { id: 'opt_puzzle_gate', icon: '🚪', label: 'A Massive Musical Gate', desc: 'Locked tight with 3 color-coded glowing bells' },
    ],
    hint: 'Every great hero faces a funny challenge!',
  },
  {
    beat: 5,
    id: 'heroic_solution',
    title: 'The Heroic Magic',
    subtitle: 'How do we solve the puzzle?',
    question: (charName, sigItem) => `Quick! I brought my ${sigItem || 'magic item'}! How should we use it to solve this?!`,
    options: [
      { id: 'opt_beam', icon: '✨', label: 'Shine A Gentle Warm Beam', desc: 'Melting away the fear with golden comforting light' },
      { id: 'opt_melody', icon: '🎶', label: 'Play A Soothing Lullaby', desc: 'Helping our obstacle turn into a peaceful friend' },
      { id: 'opt_rune', icon: '💫', label: 'Wave It Like A Magic Wand', desc: 'Turning the whole barrier into harmless floating bubbles' },
      { id: 'opt_share', icon: '🤝', label: 'Offer It As A Token Of Kindness', desc: 'Sharing a heartfelt gift to open the magical gateway' },
    ],
    hint: "Use your character's signature power!",
  },
  {
    beat: 6,
    id: 'celebration',
    title: 'The Grand Celebration',
    subtitle: 'Victory & happily ever after!',
    question: (charName) => `Hooray!! We solved the mystery together! How should our grand story end?!`,
    options: [
      { id: 'opt_fireworks', icon: '🎆', label: 'Starlight Fireworks Party', desc: 'Cheered on by all our new forest and cloud friends' },
      { id: 'opt_feast', icon: '🥞', label: 'A Giant Pancake Feast', desc: 'Piled high with cosmic berries and maple sparkle syrup' },
      { id: 'opt_medal', icon: '🏆', label: 'Crowned As Kingdom Legends', desc: 'Awarded shiny golden star badges of brave kindness' },
      { id: 'opt_campfire', icon: '⛺', label: 'A Cozy Starry Campfire', desc: 'Curled up under warm blankets smiling at the moon' },
    ],
    hint: 'How do you want your storybook to celebrate?',
  },
];

/**
 * Fallback preset stories for instant offline or rate-limited generation
 */
export const PRESET_STORY_PAGES = [
  {
    beatIndex: 0,
    pageNumber: 1,
    title: 'The Secret Beginning',
    text: 'Once upon a time, in a grand palace high among the clouds, our brave friend looked out the crystal window, dreaming of an unforgettable adventure.',
    coPilotReply: 'I remember this morning! The sky was shining like liquid gold, and I knew today would be extra special!',
    imageUri: 'card_story.jpg',
  },
  {
    beatIndex: 1,
    pageNumber: 2,
    title: 'The Mysterious Discovery',
    text: 'Tucked beneath a patch of glowing starlight moss, they discovered an ancient, shimmering map etched with twinkling golden runes.',
    coPilotReply: 'Look at how it sparkles! It was warm in my paws, whispering secrets of forgotten valleys!',
    imageUri: 'card_website.jpg',
  },
  {
    beatIndex: 2,
    pageNumber: 3,
    title: 'Into The Unknown',
    text: 'Following the celestial markers, they marched bravely across the arching Rainbow Bridge, floating softly through cotton-candy skies.',
    coPilotReply: 'Every step made musical chimes under our feet! The clouds tickled my nose!',
    imageUri: 'card_app.jpg',
  },
  {
    beatIndex: 3,
    pageNumber: 4,
    title: 'The Surprising Obstacle',
    text: 'Suddenly, a colossal sleeping giant barred the pass, snoring great puffs of lilac smoke that gently rocked the mountains.',
    coPilotReply: 'His snores sounded like a funny tuba! We had to be so careful not to wake him grumpy!',
    imageUri: 'card_merch.jpg',
  },
  {
    beatIndex: 4,
    pageNumber: 5,
    title: 'The Heroic Magic',
    text: 'Raising their enchanted signature item high, a cascade of soothing golden starlight wrapped around the giant, turning his dreams sweet and peaceful.',
    coPilotReply: 'My signature magic worked like a charm! He rolled over smiling and let us pass safely!',
    imageUri: 'card_story.jpg',
  },
  {
    beatIndex: 5,
    pageNumber: 6,
    title: 'The Grand Celebration',
    text: 'Reaching the summit, glorious starlight fireworks burst across the heavens, celebrating a tale of courage, kindness, and everlasting friendship.',
    coPilotReply: 'We did it, my favorite storyteller! What an incredible book we made together!',
    imageUri: 'card_app.jpg',
  },
];

/**
 * Generates Co-Pilot dialogue, lyrical story sentence, and tailored image prompt using Gemini AI
 */
export async function generateStoryPageContent({
  beatIndex,
  character,
  childChoice,
  customInput = '',
  apiKey = null,
}) {
  const activeKey = apiKey || getGeminiApiKey();
  const currentBeat = STORY_BEATS[beatIndex] || STORY_BEATS[0];

  const charName = character?.name || 'Brave Companion';
  const sigItem = character?.signatureItem || 'Star Crystal';
  const charDesc = character?.visualDescription || character?.imagePrompt || 'A mythical, cute 3D character';
  const traits = (character?.traits || ['Mythical', 'Brave']).join(', ');

  const chosenDetail = customInput.trim()
    ? customInput.trim()
    : (childChoice?.label || 'A magical mystery') + ' — ' + (childChoice?.desc || '');

  const systemInstruction = `
You are the interactive Storybook Co-Author and Co-Pilot for a child.
The main character of this story is named: "${charName}".
Character Visual Description: "${charDesc}".
Character Traits: ${traits}.
Signature Magical Item: "${sigItem}".

You are crafting Page ${beatIndex + 1} of 6 in a children's picture book.
Narrative Beat: ${currentBeat.title} (${currentBeat.subtitle}).
Child's Idea / Choice for this page: "${chosenDetail}".

Respond ONLY with a valid JSON object matching this schema:
{
  "coPilotReply": "An excited, warm 1-2 sentence reaction spoken directly by ${charName} to the child celebrating their choice in first person (e.g., 'Oh wow! I love that idea! Let\\'s check behind the waterfall!')",
  "storyText": "2 charming, lyrical picture-book sentences narrating this moment for a 6-10 year old reader in third-person picture book style.",
  "imagePrompt": "A detailed 3D Pixar / DreamWorks cinematic illustration prompt showing ${charName} (${charDesc}) inside the scene: ${chosenDetail}. Vibrant colors, volumetric soft lighting, rich fairy-tale storybook aesthetic, whimsical composition, emotive character expression."
}
No markdown wrappers, no formatting, raw JSON only.
`;

  if (!activeKey) {
    const fallback = PRESET_STORY_PAGES[beatIndex] || PRESET_STORY_PAGES[0];
    return {
      success: true,
      coPilotReply: `${charName}: "I love choosing ${chosenDetail}! Let's make this page look magnificent!"`,
      storyText: fallback.text.replace('our brave friend', charName).replace('their enchanted signature item', `the ${sigItem}`),
      imagePrompt: `3D Pixar style storybook illustration of ${charName} (${charDesc}) in ${chosenDetail}. Cinematic golden hour, storybook art.`,
    };
  }

  const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemInstruction }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          success: true,
          coPilotReply: parsed.coPilotReply || `${charName}: "What a fantastic idea!"`,
          storyText: parsed.storyText || 'And so their grand journey continued with wonder and joy.',
          imagePrompt: parsed.imagePrompt || `3D Pixar style scene of ${charName} with ${chosenDetail}`,
        };
      }
    } catch (err) {
      console.warn(`Story text generation error on ${model}:`, err.message);
    }
  }

  const fallback = PRESET_STORY_PAGES[beatIndex] || PRESET_STORY_PAGES[0];
  return {
    success: true,
    coPilotReply: `${charName}: "I love choosing ${chosenDetail}! Let's make this page look magnificent!"`,
    storyText: fallback.text.replace('our brave friend', charName).replace('their enchanted signature item', `the ${sigItem}`),
    imagePrompt: `3D Pixar style storybook illustration of ${charName} (${charDesc}) in ${chosenDetail}.`,
  };
}

/**
 * Generates the full-scene picture book illustration using Gemini Image Generation
 */
export async function generateStoryPageImage(imagePrompt, apiKey = null) {
  const activeKey = apiKey || getGeminiApiKey();
  if (!activeKey) return null;

  const imageModels = ['gemini-3.1-flash-image', 'gemini-3-pro-image'];
  const fullScenePrompt = `Full-bleed cinematic 3D storybook illustration, children's animated feature film still, Pixar / DreamWorks render quality. Highly detailed environment, expressive lighting, whimsical fantasy aesthetic. ${imagePrompt}`;

  for (const model of imageModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: fullScenePrompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const part = data?.candidates?.[0]?.content?.parts?.[0];
      if (part && part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
      }
    } catch (err) {
      console.warn(`Story image gen error on ${model}:`, err.message);
    }
  }
  return null;
}
