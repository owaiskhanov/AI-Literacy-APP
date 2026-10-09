/**
 * Character Account Storage Service
 * 
 * Persists the child's finalized character details into their account so they can:
 * 1. Maintain 100% visual and personality consistency in Screen 4 (Story Creation).
 * 2. Generate custom merchandise (stickers, shirts, mugs, book covers) with the exact character cutout and traits.
 * 3. Access their character inventory anytime across sessions.
 */

// In-memory runtime cache for seamless cross-platform speed and offline resilience
const inMemoryAccountCharacters = new Map();
let inMemoryActiveCharacter = null;

const STORAGE_KEY_PREFIX = 'AI_LITERACY_ACCOUNT_CHARACTERS_';
const ACTIVE_CHAR_KEY = 'AI_LITERACY_ACTIVE_CHARACTER';

/**
 * Normalizes user account ID to support Google auth or guest story names
 */
export function getCanonicalUserId(user, storyName) {
  if (user && (user.id || user.sub)) {
    return String(user.id || user.sub);
  }
  if (user && user.email) {
    return `email_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }
  if (storyName && storyName.trim()) {
    return `story_${storyName.trim().toLowerCase().replace(/\s+/g, '_')}`;
  }
  return 'explorer_default';
}

/**
 * Saves a finalized character to the child's account with complete story & merchandise metadata
 */
export function saveCharacterToAccount(user, characterData, storyName = '') {
  const userId = getCanonicalUserId(user, storyName);
  const now = new Date().toISOString();
  
  const characterId = characterData.id || `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const charName = (characterData.name || characterData.characterName || 'Enchanted Companion').trim();
  
  // Build a comprehensive, production-grade character dossier
  const finalizedCharacter = {
    id: characterId,
    userId: userId,
    accountOwner: {
      name: user?.name || storyName || 'Explorer',
      email: user?.email || null,
      storyName: storyName || user?.name || 'Explorer',
      isGoogleAuth: Boolean(user?.email || user?.id),
    },
    name: charName,
    avatarUri: characterData.avatarUri || characterData.imageUrl || null,
    talkBubble: characterData.talkBubble || 'Adventure awaits us! 🌟',
    
    // Exact visual blueprint for story continuity
    visualDescription: characterData.visualDescription || characterData.imagePrompt || `A 3D Pixar-style mythical character named ${charName}.`,
    imagePrompt: characterData.imagePrompt || '',
    originalUserPrompt: characterData.originalPrompt || characterData.prompt || '',
    
    // Personality & storytelling pillars
    traits: Array.isArray(characterData.traits) && characterData.traits.length > 0
      ? characterData.traits
      : ['Mythical', 'Brave', 'Enchanted'],
    signatureItem: characterData.signatureItem || 'Star Crystal',
    storyRole: characterData.storyRole || 'Hero Companion & Protagonist',
    style: '3D Pixar / DreamWorks Animated Stylized Render',
    
    // Merchandise configuration (stickers, apparel, storybook)
    merchandiseProfile: {
      stickersReady: true,
      tshirtReady: true,
      storybookReady: true,
      mugPreviewReady: true,
      colorPalette: characterData.colorPalette || ['#4A90E2', '#DE9E36', '#FFFFFF'],
      badgeLabel: `Official Companion: ${charName}`,
    },
    
    createdAt: characterData.createdAt || now,
    updatedAt: now,
  };

  // 1. Update In-Memory cache
  inMemoryActiveCharacter = finalizedCharacter;
  if (!inMemoryAccountCharacters.has(userId)) {
    inMemoryAccountCharacters.set(userId, []);
  }
  const userList = inMemoryAccountCharacters.get(userId);
  // Replace if existing or prepend as most recent
  const existingIndex = userList.findIndex((c) => c.id === characterId);
  if (existingIndex >= 0) {
    userList[existingIndex] = finalizedCharacter;
  } else {
    userList.unshift(finalizedCharacter);
  }

  // 2. Persist to Web / React-Native-Web LocalStorage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(ACTIVE_CHAR_KEY, JSON.stringify(finalizedCharacter));
      window.localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${userId}`,
        JSON.stringify(userList)
      );
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }
  }

  return finalizedCharacter;
}

/**
 * Retrieves the child's currently active character
 */
export function getActiveCharacter(user = null, storyName = '') {
  if (inMemoryActiveCharacter) {
    return inMemoryActiveCharacter;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(ACTIVE_CHAR_KEY);
      if (saved) {
        inMemoryActiveCharacter = JSON.parse(saved);
        return inMemoryActiveCharacter;
      }
    } catch (e) {
      // Fallback
    }
  }

  const userId = getCanonicalUserId(user, storyName);
  const list = inMemoryAccountCharacters.get(userId);
  if (list && list.length > 0) {
    return list[0];
  }

  return null;
}

/**
 * Retrieves all saved characters for the child's account
 */
export function getSavedCharacters(user = null, storyName = '') {
  const userId = getCanonicalUserId(user, storyName);
  
  if (inMemoryAccountCharacters.has(userId)) {
    return inMemoryAccountCharacters.get(userId);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        inMemoryAccountCharacters.set(userId, parsed);
        return parsed;
      }
    } catch (e) {
      // Fallback
    }
  }

  return [];
}

/**
 * Formats a consistent prompt for Screen 4 (Story Scenes)
 * Ensures the exact character visual style, colors, and features are reproduced.
 */
export function formatStoryScenePrompt(character, sceneDescription) {
  if (!character) return sceneDescription;
  
  const desc = character.visualDescription || character.name;
  return `3D Pixar / DreamWorks animated movie style. The character is ${character.name} (${desc}). Scene: ${character.name} is ${sceneDescription}. Keep the exact same character appearance, facial features, proportions, and magical details as the original character design. High quality 3D render, vibrant storybook lighting.`;
}

/**
 * Formats merchandise design specifications for the character
 */
export function formatMerchandiseSpecs(character, productType = 'sticker') {
  if (!character) return null;

  switch (productType) {
    case 'sticker':
      return {
        title: `${character.name} Die-Cut Holographic Sticker`,
        characterName: character.name,
        quote: character.talkBubble,
        imageUri: character.avatarUri,
        signatureItem: character.signatureItem,
        cutoutType: 'Transparent PNG with 3mm protective border',
      };
    case 'tshirt':
      return {
        title: `${character.name} Adventure T-Shirt`,
        characterName: character.name,
        imageUri: character.avatarUri,
        tagline: `${character.name} & The Legend of Wonder`,
        printPosition: 'Front Chest Graphic',
      };
    case 'storybook':
      return {
        title: `The Chronicles of ${character.name}`,
        author: character.accountOwner?.name || 'Explorer',
        coverImageUri: character.avatarUri,
        protagonist: character.name,
        signatureItem: character.signatureItem,
        visualStyle: character.style,
      };
    default:
      return {
        characterName: character.name,
        imageUri: character.avatarUri,
      };
  }
}

const STORIES_STORAGE_KEY_PREFIX = 'AI_LITERACY_ACCOUNT_STORIES_';
const inMemoryAccountStories = new Map();

/**
 * Saves a completed or in-progress 6-page storybook to the child's account
 */
export function saveStoryToAccount(user, storyData, storyName = '') {
  const userId = getCanonicalUserId(user, storyName);
  const now = new Date().toISOString();
  const storyId = storyData.id || `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const finalizedStory = {
    ...storyData,
    id: storyId,
    userId,
    updatedAt: now,
    createdAt: storyData.createdAt || now,
  };

  if (!inMemoryAccountStories.has(userId)) {
    inMemoryAccountStories.set(userId, []);
  }
  const userStories = inMemoryAccountStories.get(userId);
  const existingIdx = userStories.findIndex((s) => s.id === storyId);
  if (existingIdx >= 0) {
    userStories[existingIdx] = finalizedStory;
  } else {
    userStories.unshift(finalizedStory);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(
        `${STORIES_STORAGE_KEY_PREFIX}${userId}`,
        JSON.stringify(userStories)
      );
    } catch (e) {
      console.warn('Could not save story to localStorage:', e);
    }
  }

  return finalizedStory;
}

/**
 * Gets all saved stories for a user
 */
export function getStoriesFromAccount(user, storyName = '') {
  const userId = getCanonicalUserId(user, storyName);
  if (inMemoryAccountStories.has(userId)) {
    return inMemoryAccountStories.get(userId);
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(`${STORIES_STORAGE_KEY_PREFIX}${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        inMemoryAccountStories.set(userId, parsed);
        return parsed;
      }
    } catch (e) {}
  }
  return [];
}
