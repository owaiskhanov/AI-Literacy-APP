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
 * 24 whimsical, beat-appropriate scene suggestions crafted around the child's hero
 */
export const SCENE_SUGGESTIONS = [
  // Beat 1: The Secret Beginning (Page 1)
  (name, item) => `${name} is waking up in a cozy starlight treehouse when an enchanted glowing letter flies through the window holding the ${item}!`,
  (name, item) => `${name} steps through a hidden glowing portal behind a sparkling waterfall holding the ${item}!`,
  (name, item) => `${name} climbs to the highest cloud tower to watch sunrise turn the sky into rainbow glitter!`,
  (name, item) => `${name} sets out across the whispering crystal meadow with the ${item} glowing brightly!`,

  // Beat 2: The Mysterious Discovery (Page 2)
  (name, item) => `${name} uncovers a singing ancient treasure chest buried in soft violet moss!`,
  (name, item) => `${name} notices their ${item} glowing brightly toward a golden map carved on a giant mushroom!`,
  (name, item) => `${name} finds a baby starlight fairy who needs help finding its family constellation!`,
  (name, item) => `${name} discovers a floating spiral staircase leading right into the starry aurora!`,

  // Beat 3: Into The Unknown (Page 3)
  (name, item) => `${name} soars across the cosmic sky riding a friendly cloud whale with sparkly fins!`,
  (name, item) => `${name} slides down a giant rainbow waterfall into a glowing neon bubble lagoon!`,
  (name, item) => `${name} hops across floating enchanted stepping stones above a sea of pink cotton candy clouds!`,
  (name, item) => `${name} sails on a magical wooden ship through a tunnel of glowing starlight crystals!`,

  // Beat 4: The Surprising Obstacle (Page 4)
  (name, item) => `${name} meets a gentle giant moss golem who lost his favorite singing crystal!`,
  (name, item) => `${name} encounters a mischievous storm cloud tickling everyone with candy raindrops!`,
  (name, item) => `${name} faces a massive ancient musical gate locked with glowing puzzle runes!`,
  (name, item) => `${name} gets lost in an enchanted mirror maze where playful reflections dance around!`,

  // Beat 5: The Heroic Magic (Page 5)
  (name, item) => `${name} holds up the ${item}, shining a brilliant beam of friendship that melts away the storm!`,
  (name, item) => `${name} taps the ${item} against the musical gate, making it sing in golden harmony and swing open!`,
  (name, item) => `${name} shares warm starlight hugs, turning the gloomy creature into a happy best friend!`,
  (name, item) => `${name} activates the ${item}'s magic, creating a giant protective bubble of rainbow sparkles!`,

  // Beat 6: The Grand Celebration (Page 6)
  (name, item) => `${name} and all their magical friends celebrate with a giant star-pancake feast under fireworks!`,
  (name, item) => `${name} curls up happily in a cozy hammock beneath the twinkling moonlight, dreaming of tomorrow!`,
  (name, item) => `${name} is crowned guardian of the enchanted skies with a gleaming badge of bravery!`,
  (name, item) => `${name} dances with friendly creatures around a warm campfire, laughing under the starlit sky!`,
];

/**
 * Continuity-aware scene suggestion generator:
 * When beatIndex > 0 and p1Prompt is provided, suggestions directly extend
 * what was established in Page 1 to ensure a cohesive 6-beat adventure.
 */
export function getSceneSuggestions(
  beatIndex,
  characterName = 'Brave Companion',
  signatureItem = 'Star Crystal',
  p1Prompt = ''
) {
  const safeIdx = Math.max(0, Math.min(5, beatIndex || 0));

  // If beat > 0 and child established an adventure context in Page 1, generate continuity options
  const cleanedP1 = (p1Prompt || '').trim().replace(/^.*?(?:is |in |at )/i, '').slice(0, 50).trim();

  if (safeIdx > 0 && cleanedP1) {
    const context = cleanedP1.length > 5 ? cleanedP1 : 'the magical realm from Page 1';
    switch (safeIdx) {
      case 1: // Beat 2: The Mysterious Discovery
        return [
          `${characterName} is exploring around ${context} when their ${signatureItem} flashes, revealing a glowing ancient map hidden under the floorboards!`,
          `Behind a shimmering crystal tapestry in ${context}, ${characterName} discovers an antique singing windup key floating in mid-air!`,
          `While peering out from ${context}, ${characterName} spots a speckled dragon egg wobbling with purple sparkles right outside!`,
          `A glowing origami stardust letter flies into ${context}, whispering an urgent secret riddle to ${characterName}!`,
        ];
      case 2: // Beat 3: Into The Unknown
        return [
          `Following the mysterious clue from ${context}, ${characterName} departs across the glowing Rainbow Bridge into fluffy cotton-candy clouds!`,
          `${characterName} leaves ${context} behind and boards a flying cloud galleon with purple sails guided by the clue!`,
          `Venturing along the secret path from ${context}, ${characterName} hops across giant singing neon crystals with the ${signatureItem}!`,
          `${characterName} glides down a sparkling starry slide leading away from ${context} into an uncharted enchanted forest!`,
        ];
      case 3: // Beat 4: The Surprising Obstacle
        return [
          `Far along the path from ${context}, a friendly sleepy yeti blocks the road, snoring lilac clouds with giggles!`,
          `Ahead on the trail, a playful troop of silly monkeys surrounds ${characterName}, demanding the answer to their goofiest riddle!`,
          `A sudden sweet cotton-candy fog rolls in, making it impossible to see the road back toward ${context}!`,
          `${characterName} reaches a colossal musical stone gate locked tight by three glowing bells that must be rung in harmony!`,
        ];
      case 4: // Beat 5: The Heroic Magic
        return [
          `${characterName} raises the ${signatureItem} high, shining a gentle warm beam of friendship that melts away the obstacle into harmless sparkles!`,
          `Tapping the ${signatureItem} in peaceful rhythm, ${characterName} plays a soothing lullaby, turning the challenge into a sweet new ally!`,
          `With a brave smile, ${characterName} offers a gift of starlight from the ${signatureItem}, unlocking the enchanted passage!`,
          `${characterName} swirls the ${signatureItem} through the air, creating a giant protective bubble of rainbow glitter that clears the way!`,
        ];
      case 5: // Beat 6: The Grand Celebration
        return [
          `Returning triumphant to ${context}, ${characterName} and all their new friends celebrate with a giant star-pancake feast under fireworks!`,
          `${characterName} is crowned guardian of the realm back at ${context}, awarded a gleaming golden star badge of bravery!`,
          `Surrounded by joyful laughter, ${characterName} dances with friendly creatures around a warm campfire near ${context} under shooting stars!`,
          `Curled up cozy and safe back at ${context}, ${characterName} hugs the ${signatureItem} with a happy smile, dreaming of their next grand tale!`,
        ];
      default:
        break;
    }
  }

  // Fallback to default beat suggestions
  const baseOffset = safeIdx * 4;
  const list = [];
  for (let i = 0; i < 4; i++) {
    const fn = SCENE_SUGGESTIONS[baseOffset + i];
    if (fn) list.push(fn(characterName, signatureItem));
  }
  return list;
}

/**
 * Generates Co-Pilot dialogue, lyrical story sentence, and tailored image prompt using Gemini AI
 * strictly anchoring the child's character visuals, traits, and signature item.
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
  const colors = (character?.merchandiseProfile?.colorPalette || []).join(', ');

  const chosenDetail = customInput.trim()
    ? customInput.trim()
    : (childChoice?.label || 'A magical mystery') + (childChoice?.desc ? ' — ' + childChoice.desc : '');

  const systemInstruction = `
You are the interactive Storybook Co-Author and Co-Pilot for a child.
The main character of this story is named: "${charName}".
CRITICAL CHARACTER VISUAL CONTINUITY:
- Character Visual Description: "${charDesc}".
- Personality Traits & Physical Features: ${traits}.
- Signature Magical Item: "${sigItem}".
${colors ? `- Characteristic Color Palette: ${colors}.` : ''}

You are crafting Page ${beatIndex + 1} of 6 in a children's picture book.
Narrative Beat: ${currentBeat.title} (${currentBeat.subtitle}).
Child's Custom Scene Idea for this page: "${chosenDetail}".

Respond ONLY with a valid JSON object matching this schema:
{
  "coPilotReply": "An excited, warm 1-2 sentence reaction spoken directly by ${charName} to the child celebrating their scene idea in first person (e.g., 'Oh wow! I love that idea! Let\\'s explore together!')",
  "storyText": "2 charming, lyrical picture-book sentences narrating this moment for a 6-10 year old reader in third-person picture book style featuring ${charName}.",
  "imagePrompt": "A detailed square 1:1 3D Pixar / DreamWorks cinematic illustration prompt showing ${charName} (${charDesc}, ${traits}, with ${sigItem}) inside the scene: ${chosenDetail}. Include an integrated whimsical illustrated talk bubble / speech balloon emerging from ${charName} with their dialogue: '${charName} says a short expressive line'. Vibrant colors, volumetric soft lighting, rich fairy-tale storybook aesthetic, square 1:1 composition, whimsical mood."
}
No markdown wrappers, no formatting, raw JSON only.
`;

  if (!activeKey) {
    const fallback = PRESET_STORY_PAGES[beatIndex] || PRESET_STORY_PAGES[0];
    return {
      success: true,
      coPilotReply: `${charName}: "I love that idea! Let's make this page look magnificent!"`,
      storyText: fallback.text.replace('our brave friend', charName).replace('their enchanted signature item', `the ${sigItem}`),
      imagePrompt: `Square 1:1 3D Pixar style storybook illustration of ${charName} (${charDesc}) in ${chosenDetail}. Cinematic golden hour, storybook art.`,
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
          storyText: parsed.storyText || `And so ${charName}'s grand journey continued with wonder and joy.`,
          imagePrompt: parsed.imagePrompt || `Square 1:1 3D Pixar style scene of ${charName} with ${chosenDetail}`,
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
    imagePrompt: `Square 1:1 3D Pixar style storybook illustration of ${charName} (${charDesc}) in ${chosenDetail}.`,
  };
}

/**
 * Generates the full-scene picture book illustration using Gemini Image Generation.
 * Strictly binds character identity, physical traits, signature item, and multimodal
 * reference avatar into the generation request to ensure visual memory and continuity.
 */
export async function generateStoryPageImage(imagePromptOrOptions, characterOrApiKey = null, maybeApiKey = null) {
  let imagePrompt = '';
  let character = null;
  let apiKey = null;

  if (imagePromptOrOptions && typeof imagePromptOrOptions === 'object') {
    imagePrompt = imagePromptOrOptions.imagePrompt || '';
    character = imagePromptOrOptions.character || null;
    apiKey = imagePromptOrOptions.apiKey || null;
  } else {
    imagePrompt = String(imagePromptOrOptions || '');
    if (characterOrApiKey && typeof characterOrApiKey === 'object') {
      character = characterOrApiKey;
      apiKey = maybeApiKey;
    } else {
      apiKey = characterOrApiKey;
    }
  }

  const activeKey = apiKey || getGeminiApiKey();
  if (!activeKey) return null;

  const charName = character?.name || 'Hero Companion';
  const charDesc = character?.visualDescription || character?.imagePrompt || 'A mythical 3D character';
  const traits = Array.isArray(character?.traits) ? character.traits.join(', ') : 'Brave, Enchanted';
  const sigItem = character?.signatureItem || 'Star Crystal';
  const colors = character?.merchandiseProfile?.colorPalette ? character.merchandiseProfile.colorPalette.join(', ') : '';

  // Extract base64 avatar image reference if present for true multimodal conditioning
  let base64Avatar = null;
  let avatarMime = 'image/png';
  const rawAvatar = character?.avatarUri || character?.imageUrl || character?.imageSrc || character?.avatar || '';
  if (typeof rawAvatar === 'string' && rawAvatar.startsWith('data:')) {
    const match = rawAvatar.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      avatarMime = match[1];
      base64Avatar = match[2];
    }
  }

  const characterAnchor = `
CRITICAL CHARACTER VISUAL CONTINUITY:
The hero in this illustration is named "${charName}".
Exact Visual Design: ${charDesc}.
Physical Traits: ${traits}.
Signature Item: ${sigItem}.
${colors ? `Color Palette: ${colors}.` : ''}
${base64Avatar ? `IMPORTANT: The hero MUST look EXACTLY like the attached reference image of ${charName}. Maintain their exact species, facial features, colors, scales/fur, wings/horns, and Pixar 3D animated styling.` : `The hero must strictly match: ${charDesc}.`}
`;

  const fullScenePrompt = `Square 1:1 picture book illustration, full-bleed cinematic 3D children's animated feature film still, Pixar / DreamWorks render quality. Highly detailed whimsical environment, expressive lighting. ${characterAnchor} In this scene: ${imagePrompt}. IMPORTANT: Render this scene as a rich children's storybook page with an integrated whimsical speech bubble / talk bubble emerging from ${charName} containing their expressive dialogue. No multiple split panels, single square scene with gorgeous fairytale composition.`;

  const imageModels = ['gemini-3.1-flash-image', 'gemini-3-pro-image'];

  // Try multimodal call first if base64 avatar reference is available
  if (base64Avatar) {
    for (const model of imageModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: avatarMime,
                      data: base64Avatar,
                    },
                  },
                  { text: fullScenePrompt },
                ],
              },
            ],
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
        console.warn(`Multimodal story image gen error on ${model}:`, err.message);
      }
    }
  }

  // Text-anchored fallback across models
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

