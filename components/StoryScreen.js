import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Animated,
  Easing,
  Alert,
  Modal,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import {
  STORY_BEATS,
  PRESET_STORY_PAGES,
  generateStoryPageContent,
  generateStoryPageImage,
} from '../services/storyService';
import { saveStoryToAccount } from '../services/characterStorage';
import { getGeminiApiKey } from '../services/geminiService';

// Kid-friendly simplified questions and punchy choices
const KID_FRIENDLY_BEATS = [
  {
    step: 1,
    title: 'Where do we start?',
    question: (name) => `Where should our adventure start, storyteller?`,
    choices: [
      { id: 'castle', icon: '🏰', label: 'Cloud Castle', color: '#EFF6FF', borderColor: '#93C5FD' },
      { id: 'treehouse', icon: '🌳', label: 'Magic Treehouse', color: '#ECFDF5', borderColor: '#6EE7B7' },
      { id: 'lagoon', icon: '🌊', label: 'Rainbow Lagoon', color: '#F0FDFA', borderColor: '#5EEAD4' },
      { id: 'bedroom', icon: '⭐', label: 'Starry Bedroom', color: '#FEF3C7', borderColor: '#FCD34D' },
    ],
  },
  {
    step: 2,
    title: 'What did we find?',
    question: (name) => `Look! What mystery clue did we just find?!`,
    choices: [
      { id: 'map', icon: '🗺️', label: 'Golden Map', color: '#FEF3C7', borderColor: '#FCD34D' },
      { id: 'key', icon: '🗝️', label: 'Singing Key', color: '#EFF6FF', borderColor: '#93C5FD' },
      { id: 'egg', icon: '🥚', label: 'Dragon Egg', color: '#FDF2F8', borderColor: '#F472B6' },
      { id: 'letter', icon: '📜', label: 'Flying Letter', color: '#F5F3FF', borderColor: '#C4B5FD' },
    ],
  },
  {
    step: 3,
    title: 'Where are we traveling?',
    question: (name) => `Hold on! Where are we flying next?!`,
    choices: [
      { id: 'bridge', icon: '🌈', label: 'Rainbow Bridge', color: '#FDF2F8', borderColor: '#F472B6' },
      { id: 'ship', icon: '⛵', label: 'Cloud Ship', color: '#EFF6FF', borderColor: '#93C5FD' },
      { id: 'caves', icon: '💎', label: 'Crystal Caves', color: '#F0FDFA', borderColor: '#5EEAD4' },
      { id: 'mushrooms', icon: '🍄', label: 'Giant Forest', color: '#ECFDF5', borderColor: '#6EE7B7' },
    ],
  },
  {
    step: 4,
    title: 'What is blocking our path?',
    question: (name) => `Uh oh! Look ahead... what is blocking us?!`,
    choices: [
      { id: 'yeti', icon: '🐻', label: 'Sleepy Giant', color: '#FEF3C7', borderColor: '#FCD34D' },
      { id: 'monkeys', icon: '🐒', label: 'Silly Monkeys', color: '#ECFDF5', borderColor: '#6EE7B7' },
      { id: 'storm', icon: '☁️', label: 'Candy Storm', color: '#FDF2F8', borderColor: '#F472B6' },
      { id: 'gate', icon: '🚪', label: 'Musical Gate', color: '#EFF6FF', borderColor: '#93C5FD' },
    ],
  },
  {
    step: 5,
    title: 'How do we save the day?',
    question: (name, item) => `Quick! How do we use my ${item || 'magic'}?`,
    choices: [
      { id: 'beam', icon: '✨', label: 'Warm Glow', color: '#FEF3C7', borderColor: '#FCD34D' },
      { id: 'music', icon: '🎶', label: 'Sweet Song', color: '#F5F3FF', borderColor: '#C4B5FD' },
      { id: 'bubbles', icon: '💫', label: 'Magic Bubbles', color: '#EFF6FF', borderColor: '#93C5FD' },
      { id: 'kindness', icon: '💖', label: 'Friendship Hug', color: '#FDF2F8', borderColor: '#F472B6' },
    ],
  },
  {
    step: 6,
    title: 'How do we celebrate?',
    question: (name) => `Hooray! How should our story finish?!`,
    choices: [
      { id: 'fireworks', icon: '🎆', label: 'Fireworks Party', color: '#F5F3FF', borderColor: '#C4B5FD' },
      { id: 'pancakes', icon: '🥞', label: 'Giant Pancakes', color: '#FEF3C7', borderColor: '#FCD34D' },
      { id: 'trophy', icon: '🏆', label: 'Golden Badges', color: '#FEF3C7', borderColor: '#F59E0B' },
      { id: 'campfire', icon: '⛺', label: 'Cozy Campfire', color: '#ECFDF5', borderColor: '#6EE7B7' },
    ],
  },
];

function GentleGlow({ size = 120 }) {
  return (
    <View style={[styles.gentleGlow, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="glowG" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.5" />
            <Stop offset="50%" stopColor="#FDE68A" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#glowG)" />
      </Svg>
    </View>
  );
}

export default function StoryScreen({
  userInfo,
  storyName,
  activeCharacter,
  onBack,
  onGoToMerch,
}) {
  const { width, height } = useWindowDimensions();

  // Character Dossier
  const characterName = activeCharacter?.name || 'Brave Kitsune';
  const characterAvatar = activeCharacter?.avatarUri || activeCharacter?.imageUrl;
  const signatureItem = activeCharacter?.signatureItem || 'Star Crystal';
  const childAuthor = userInfo?.name || storyName || 'Explorer';

  // Navigation & Page State
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const [customIdea, setCustomIdea] = useState('');
  const [showCustomBox, setShowCustomBox] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Reader Modal
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerPage, setReaderPage] = useState(0);

  // 6 Story Pages
  const [pages, setPages] = useState(() => Array(6).fill(null));

  // Companion Animation
  const avatarBounce = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;

  const currentBeat = KID_FRIENDLY_BEATS[currentBeatIndex];
  const currentPageData = pages[currentBeatIndex];

  // Gentle floating companion
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarBounce, { toValue: -6, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(avatarBounce, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Update beat
  useEffect(() => {
    setSelectedChoiceId(null);
    setCustomIdea('');
    setShowCustomBox(false);

    Animated.sequence([
      Animated.timing(bubbleScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(bubbleScale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [currentBeatIndex]);

  // Read aloud helper
  const handleSpeak = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.15;
      window.speechSynthesis.speak(u);
    } else {
      Alert.alert('Story Speaker 🔊', text);
    }
  };

  // Paint Page with AI
  const handlePaintPage = async () => {
    const chosenChoice = currentBeat.choices.find((c) => c.id === selectedChoiceId);
    if (!chosenChoice && !customIdea.trim()) {
      Alert.alert(
        'Pick an Idea! ✨',
        `Tap one of the 4 magical cards or type your own idea so ${characterName} can paint your page!`
      );
      return;
    }

    setIsPainting(true);
    setLoadingText(`Painting Page ${currentBeatIndex + 1} with fairy dust...`);

    try {
      const apiKey = getGeminiApiKey();
      const textResult = await generateStoryPageContent({
        beatIndex: currentBeatIndex,
        character: activeCharacter,
        childChoice: chosenChoice,
        customInput: customIdea.trim(),
        apiKey: apiKey,
      });

      setLoadingText(`Creating 3D picture...`);

      let imgUri = null;
      if (apiKey) {
        try {
          imgUri = await generateStoryPageImage(textResult.imagePrompt, apiKey);
        } catch (e) {
          console.warn('Image generation fallback:', e);
        }
      }

      if (!imgUri) {
        imgUri = PRESET_STORY_PAGES[currentBeatIndex]?.imageUri || 'card_story.jpg';
      }

      const newPage = {
        pageNumber: currentBeatIndex + 1,
        title: currentBeat.title,
        choiceLabel: chosenChoice?.label || customIdea.trim(),
        storyText: textResult.storyText,
        copilotReply: textResult.coPilotReply,
        imageUri: imgUri,
      };

      const updated = [...pages];
      updated[currentBeatIndex] = newPage;
      setPages(updated);

      // Save to account
      saveStoryToAccount(
        userInfo,
        {
          id: `story_${characterName.replace(/\s+/g, '_')}`,
          title: `The Tale of ${characterName}`,
          author: childAuthor,
          characterName: characterName,
          characterAvatar: characterAvatar,
          signatureItem: signatureItem,
          pages: updated.filter(Boolean),
          isComplete: updated.filter(Boolean).length === 6,
        },
        storyName
      );

      setIsPainting(false);

      if (currentBeatIndex === 5) {
        Alert.alert(
          '🎉 You Did It!!',
          `You and ${characterName} completed all 6 pages of your storybook!`,
          [
            { text: 'Read Storybook Now 📖', onPress: () => { setReaderPage(0); setReaderOpen(true); } },
            { text: 'Awesome!', style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      setIsPainting(false);
      Alert.alert('Story Paint', 'Page saved! Let\'s keep creating!');
    }
  };

  const completedCount = pages.filter(Boolean).length;
  const companionQuestion = currentPageData?.copilotReply || currentBeat.question(characterName, signatureItem);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent />
      <ImageBackground
        source={require('../assets/page4ProjectsBg.png')}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.whiteOverlay} />

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>‹ Projects</Text>
          </TouchableOpacity>

          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeText} numberOfLines={1}>
              🏰 {characterName}'s Story
            </Text>
          </View>

          {completedCount > 0 ? (
            <TouchableOpacity
              style={styles.readHeaderBtn}
              onPress={() => { setReaderPage(0); setReaderOpen(true); }}
              activeOpacity={0.8}
            >
              <Text style={styles.readHeaderText}>Read ({completedCount}/6) 📖</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>

        {/* 6 STAR STEPPERS ACROSS TOP (Super simple for kids) */}
        <View style={styles.starStepperRow}>
          {KID_FRIENDLY_BEATS.map((beat, idx) => {
            const isDone = Boolean(pages[idx]);
            const isCurrent = idx === currentBeatIndex;
            return (
              <TouchableOpacity
                key={beat.step}
                style={[
                  styles.starStep,
                  isCurrent && styles.starStepCurrent,
                  isDone && styles.starStepDone,
                ]}
                onPress={() => setCurrentBeatIndex(idx)}
                activeOpacity={0.8}
              >
                <Text style={styles.starStepIcon}>
                  {isDone ? '✓' : isCurrent ? '⭐' : idx + 1}
                </Text>
                <Text style={[styles.starStepText, isCurrent && styles.starStepTextCurrent]}>
                  P.{idx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* MAIN KID CONTENT SCROLL */}
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* CUTE TALKING COMPANION STAGE */}
          <View style={styles.companionDock}>
            <Animated.View style={[styles.companionAvatarWrap, { transform: [{ translateY: avatarBounce }] }]}>
              <GentleGlow size={110} />
              {characterAvatar ? (
                <Image
                  source={
                    typeof characterAvatar === 'string' && (characterAvatar.startsWith('http') || characterAvatar.startsWith('data:'))
                      ? { uri: characterAvatar }
                      : require('../assets/characters/fox.png')
                  }
                  style={styles.companionImg}
                  resizeMode="contain"
                />
              ) : (
                <Image source={require('../assets/characters/fox.png')} style={styles.companionImg} resizeMode="contain" />
              )}
              <View style={styles.companionPill}>
                <Text style={styles.companionPillText}>{characterName}</Text>
              </View>
            </Animated.View>

            {/* BIG FRIENDLY QUESTION BUBBLE */}
            <Animated.View style={[styles.bubbleCard, { transform: [{ scale: bubbleScale }] }]}>
              <Text style={styles.bubbleQuestion}>{companionQuestion}</Text>
              <TouchableOpacity style={styles.listenBtn} onPress={() => handleSpeak(companionQuestion)} activeOpacity={0.7}>
                <Text style={styles.listenBtnText}>🔊 Read to Me</Text>
              </TouchableOpacity>
              <View style={styles.bubbleArrow} />
            </Animated.View>
          </View>

          {/* IF ALREADY PAINTED: SHOW BIG BEAUTIFUL PREVIEW CARD */}
          {currentPageData && (
            <View style={styles.paintedCard}>
              <View style={styles.paintedImgWrap}>
                <Image
                  source={
                    currentPageData.imageUri && currentPageData.imageUri.startsWith('data:')
                      ? { uri: currentPageData.imageUri }
                      : require('../assets/cards/card_story.jpg')
                  }
                  style={styles.paintedImg}
                  resizeMode="cover"
                />
                <View style={styles.paintedBadge}>
                  <Text style={styles.paintedBadgeText}>Page {currentBeatIndex + 1} of 6 ✨</Text>
                </View>
              </View>

              <Text style={styles.paintedStoryText}>"{currentPageData.storyText}"</Text>

              <View style={styles.paintedBtnRow}>
                <TouchableOpacity
                  style={styles.btnSpeakText}
                  onPress={() => handleSpeak(currentPageData.storyText)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnSpeakTextLabel}>🔊 Listen</Text>
                </TouchableOpacity>

                {currentBeatIndex < 5 && (
                  <TouchableOpacity
                    style={styles.btnNextPage}
                    onPress={() => setCurrentBeatIndex((prev) => Math.min(5, prev + 1))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnNextPageText}>Next Page (P.{currentBeatIndex + 2}) ➜</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* 4 BIG COLORFUL CHOICES (Super fun to tap!) */}
          <View style={styles.choicesSection}>
            <Text style={styles.sectionTitle}>
              Pick what happens:
            </Text>

            <View style={styles.choiceGrid}>
              {currentBeat.choices.map((choice) => {
                const isSelected = selectedChoiceId === choice.id;
                return (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.bigChoiceCard,
                      { backgroundColor: choice.color, borderColor: isSelected ? '#2563EB' : choice.borderColor },
                      isSelected && styles.bigChoiceCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedChoiceId(choice.id);
                      setCustomIdea('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bigChoiceIcon}>{choice.icon}</Text>
                    <Text style={[styles.bigChoiceLabel, isSelected && styles.bigChoiceLabelSelected]}>
                      {choice.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.choiceCheckPill}>
                        <Text style={styles.choiceCheckText}>✓ Picked</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Simple toggle for custom twist */}
            <TouchableOpacity
              style={styles.customToggle}
              onPress={() => setShowCustomBox(!showCustomBox)}
              activeOpacity={0.7}
            >
              <Text style={styles.customToggleText}>
                {showCustomBox ? '▲ Hide typing' : '✍️ Have your own idea? Tap here!'}
              </Text>
            </TouchableOpacity>

            {showCustomBox && (
              <View style={styles.customBox}>
                <TextInput
                  style={styles.customInput}
                  placeholder={`Type your idea here...`}
                  placeholderTextColor="#94A3B8"
                  value={customIdea}
                  onChangeText={(t) => {
                    setCustomIdea(t);
                    if (t.trim()) setSelectedChoiceId(null);
                  }}
                />
              </View>
            )}
          </View>

          {/* GIANT MAKE PAGE BUTTON */}
          <TouchableOpacity
            style={[styles.bigActionBtn, isPainting && styles.bigActionBtnDisabled]}
            onPress={handlePaintPage}
            disabled={isPainting}
            activeOpacity={0.85}
          >
            {isPainting ? (
              <View style={styles.btnLoadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.btnLoadingText}>{loadingText}</Text>
              </View>
            ) : (
              <Text style={styles.bigActionBtnText}>
                {currentPageData
                  ? `✨ Re-paint Page ${currentBeatIndex + 1} ✨`
                  : `✨ Make Page ${currentBeatIndex + 1} ✨`}
              </Text>
            )}
          </TouchableOpacity>

          {/* READ FULL BOOK BUTTON (WHEN COMPLETED) */}
          {completedCount === 6 && (
            <TouchableOpacity
              style={styles.celebrationReadBtn}
              onPress={() => { setReaderPage(0); setReaderOpen(true); }}
              activeOpacity={0.85}
            >
              <Text style={styles.celebrationReadBtnText}>
                🎉 Read Finished Storybook! (6/6) 📖
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* FULL SCREEN STORYBOOK READER MODAL */}
        <Modal
          visible={readerOpen}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setReaderOpen(false)}
        >
          <View style={styles.readerModal}>
            <StatusBar style="light" />

            {/* Reader Top */}
            <View style={styles.readerTop}>
              <TouchableOpacity style={styles.readerClose} onPress={() => setReaderOpen(false)}>
                <Text style={styles.readerCloseText}>✕ Close</Text>
              </TouchableOpacity>
              <Text style={styles.readerBookTitle} numberOfLines={1}>
                The Tale of {characterName}
              </Text>
              <TouchableOpacity
                style={styles.readerMerch}
                onPress={() => {
                  setReaderOpen(false);
                  if (onGoToMerch) onGoToMerch();
                }}
              >
                <Text style={styles.readerMerchText}>👕 Merch</Text>
              </TouchableOpacity>
            </View>

            {/* Reader Page View */}
            <View style={styles.readerStage}>
              {pages[readerPage] ? (
                <View style={styles.readerCard}>
                  <View style={styles.readerImgWrap}>
                    <Image
                      source={
                        pages[readerPage].imageUri && pages[readerPage].imageUri.startsWith('data:')
                          ? { uri: pages[readerPage].imageUri }
                          : require('../assets/cards/card_story.jpg')
                      }
                      style={styles.readerImg}
                      resizeMode="cover"
                    />
                    <View style={styles.readerPageTag}>
                      <Text style={styles.readerPageTagText}>Page {readerPage + 1} of 6</Text>
                    </View>
                  </View>

                  <View style={styles.readerTextWrap}>
                    <Text style={styles.readerStoryLine}>"{pages[readerPage].storyText}"</Text>

                    <TouchableOpacity
                      style={styles.readerSpeakBtn}
                      onPress={() => handleSpeak(pages[readerPage].storyText)}
                    >
                      <Text style={styles.readerSpeakBtnText}>🔊 Read Page to Me</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.readerEmpty}>
                  <Text style={styles.readerEmptyEmoji}>🎨</Text>
                  <Text style={styles.readerEmptyTitle}>Page {readerPage + 1} not made yet!</Text>
                </View>
              )}
            </View>

            {/* Reader Navigation Footer */}
            <View style={styles.readerBottom}>
              <TouchableOpacity
                style={[styles.readerNavBtn, readerPage === 0 && styles.readerNavBtnDisabled]}
                disabled={readerPage === 0}
                onPress={() => setReaderPage((p) => Math.max(0, p - 1))}
              >
                <Text style={styles.readerNavBtnText}>◀ Prev</Text>
              </TouchableOpacity>

              <View style={styles.readerDots}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      readerPage === i && styles.dotActive,
                      pages[i] && styles.dotDone,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.readerNavBtn, readerPage === 5 && styles.readerNavBtnDisabled]}
                disabled={readerPage === 5}
                onPress={() => setReaderPage((p) => Math.min(5, p + 1))}
              >
                <Text style={styles.readerNavBtnText}>Next ▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  whiteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
  },
  gentleGlow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  // TOP BAR
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0A1C3E',
  },
  titleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    maxWidth: '50%',
  },
  titleBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  readHeaderBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  readHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 6 STAR STEPPERS (Super clean for kids)
  starStepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  starStep: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  starStepCurrent: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    transform: [{ scale: 1.08 }],
    elevation: 3,
  },
  starStepDone: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  starStepIcon: {
    fontSize: 16,
    fontWeight: '900',
    color: '#64748B',
  },
  starStepText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 1,
  },
  starStepTextCurrent: {
    color: '#1E3A8A',
    fontWeight: '800',
  },

  // SCROLL CONTENT
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // CUTE TALKING COMPANION
  companionDock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 14,
  },
  companionAvatarWrap: {
    width: 80,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  companionImg: {
    width: 72,
    height: 72,
    zIndex: 2,
  },
  companionPill: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    zIndex: 5,
    marginTop: -4,
  },
  companionPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FDE68A',
  },
  bubbleCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  bubbleQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 6,
  },
  listenBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  listenBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4F46E5',
  },
  bubbleArrow: {
    position: 'absolute',
    left: -7,
    top: 20,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderTopColor: 'transparent',
    borderBottomWidth: 7,
    borderBottomColor: 'transparent',
    borderRightWidth: 7,
    borderRightColor: '#F8FAFC',
  },

  // PAINTED PAGE CARD
  paintedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  paintedImgWrap: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    position: 'relative',
    marginBottom: 10,
  },
  paintedImg: {
    width: '100%',
    height: '100%',
  },
  paintedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paintedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDE68A',
  },
  paintedStoryText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#1E293B',
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 10,
  },
  paintedBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnSpeakText: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  btnSpeakTextLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  btnNextPage: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  btnNextPageText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 4 BIG CHOICES SECTION
  choicesSection: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A1C3E',
    marginBottom: 8,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bigChoiceCard: {
    width: '48.5%',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 2,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bigChoiceCardSelected: {
    borderColor: '#2563EB',
    transform: [{ scale: 1.04 }],
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bigChoiceIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  bigChoiceLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  bigChoiceLabelSelected: {
    color: '#1D4ED8',
  },
  choiceCheckPill: {
    marginTop: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  choiceCheckText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  customToggle: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  customToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  customBox: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  customInput: {
    fontSize: 13,
    color: '#0F172A',
    minHeight: 40,
  },

  // BIG ACTION BUTTON
  bigActionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 10,
  },
  bigActionBtnDisabled: {
    backgroundColor: '#60A5FA',
  },
  bigActionBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnLoadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  celebrationReadBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  celebrationReadBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // READER MODAL
  readerModal: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  readerTop: {
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  readerClose: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#334155',
    borderRadius: 14,
  },
  readerCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  readerBookTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    maxWidth: '55%',
  },
  readerMerch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 14,
  },
  readerMerchText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  readerStage: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  readerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
  },
  readerImgWrap: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
    position: 'relative',
  },
  readerImg: {
    width: '100%',
    height: '100%',
  },
  readerPageTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readerPageTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDE68A',
  },
  readerTextWrap: {
    padding: 16,
  },
  readerStoryLine: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1E293B',
    fontWeight: '600',
    marginBottom: 12,
  },
  readerSpeakBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  readerSpeakBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  readerEmpty: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#1E293B',
    borderRadius: 22,
  },
  readerEmptyEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  readerEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  readerBottom: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  readerNavBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  readerNavBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  readerNavBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  readerDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#475569',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#3B82F6',
  },
  dotDone: {
    backgroundColor: '#10B981',
  },
});
