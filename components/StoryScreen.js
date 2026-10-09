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
  getSceneSuggestions,
  generateStoryPageContent,
  generateStoryPageImage,
} from '../services/storyService';
import { saveStoryToAccount } from '../services/characterStorage';
import { getGeminiApiKey } from '../services/geminiService';

// Kid-friendly simplified questions across the 6-page story arc
const KID_FRIENDLY_BEATS = [
  {
    step: 1,
    title: 'The Secret Beginning',
    question: (name) => `Where should our adventure start today, storyteller?`,
  },
  {
    step: 2,
    title: 'The Mysterious Discovery',
    question: (name) => `Look! What mystery clue did we just find?!`,
  },
  {
    step: 3,
    title: 'Into The Unknown',
    question: (name) => `Hold on tight! Where are we exploring next?!`,
  },
  {
    step: 4,
    title: 'The Surprising Obstacle',
    question: (name) => `Uh oh! Look ahead... what is blocking our path?!`,
  },
  {
    step: 5,
    title: 'The Heroic Magic',
    question: (name, item) => `Quick! How do we use my ${item || 'magic'} to save the day?!`,
  },
  {
    step: 6,
    title: 'The Grand Celebration',
    question: (name) => `Hooray! How should our story finish?!`,
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
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
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
  const characterName = activeCharacter?.name || 'Brave Companion';
  const characterAvatar = activeCharacter?.avatarUri || activeCharacter?.imageUrl;
  const signatureItem = activeCharacter?.signatureItem || 'Star Crystal';
  const childAuthor = userInfo?.name || storyName || 'Explorer';

  // Navigation & Page State
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [customIdea, setCustomIdea] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
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

  // Update beat: reset scene input and trigger bounce
  useEffect(() => {
    setCustomIdea('');
    setSuggestionIndex(-1);

    Animated.sequence([
      Animated.timing(bubbleScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(bubbleScale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [currentBeatIndex]);

  // Read aloud helper for reader
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

  // Suggest a whimsical scene tailored to character & beat
  const handleSuggestScene = () => {
    const suggestions = getSceneSuggestions(currentBeatIndex, characterName, signatureItem);
    const nextIdx = (suggestionIndex + 1) % suggestions.length;
    setSuggestionIndex(nextIdx);
    setCustomIdea(suggestions[nextIdx]);
  };

  // Generate Page with Gemini AI (strictly attaching character visual memory)
  const handlePaintPage = async () => {
    const scenePrompt = customIdea.trim();
    if (!scenePrompt) {
      Alert.alert(
        'Describe Your Scene! ✨',
        `Type what happens with ${characterName} in this scene, or tap "💡 Suggest a Scene" to get an idea!`
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
        customInput: scenePrompt,
        apiKey: apiKey,
      });

      setLoadingText(`Creating 3D picture...`);

      let imgUri = null;
      if (apiKey) {
        try {
          imgUri = await generateStoryPageImage({
            imagePrompt: textResult.imagePrompt,
            character: activeCharacter,
            apiKey: apiKey,
          });
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
        choiceLabel: scenePrompt,
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
              <View style={styles.bubbleArrow} />
            </Animated.View>
          </View>

          {/* SQUARE STORY ILLUSTRATION VIEWPORT */}
          {currentPageData ? (
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
          ) : (
            /* DEDICATED SQUARE CANVAS PLACEHOLDER */
            <View style={styles.emptyCanvasCard}>
              <View style={styles.emptyCanvasDashed}>
                <Text style={styles.emptyCanvasIcon}>🎨</Text>
                <Text style={styles.emptyCanvasTitle}>Page {currentBeatIndex + 1} Canvas</Text>
                <Text style={styles.emptyCanvasSubtitle}>
                  Your square storybook illustration with {characterName} will appear here!
                </Text>
              </View>
            </View>
          )}

          {/* DEDICATED SCENE INPUT & SUGGESTION SECTION */}
          <View style={styles.sceneInputSection}>
            <View style={styles.sceneInputHeader}>
              <Text style={styles.sceneInputLabel}>
                ✍️ What happens on Page {currentBeatIndex + 1}?
              </Text>
              <TouchableOpacity
                style={styles.suggestBtn}
                onPress={handleSuggestScene}
                activeOpacity={0.75}
              >
                <Text style={styles.suggestBtnText}>💡 Suggest a Scene</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.customBox}>
              <TextInput
                style={styles.customInput}
                placeholder={`Describe what ${characterName} does in this scene (or tap Suggest a Scene)...`}
                placeholderTextColor="#94A3B8"
                value={customIdea}
                onChangeText={setCustomIdea}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* GIANT MAKE / GENERATE PAGE BUTTON */}
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
                  ? `✨ Re-generate Page ${currentBeatIndex + 1} ✨`
                  : `✨ Generate Page ${currentBeatIndex + 1} ✨`}
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

  // PAINTED PAGE CARD (SQUARE VIEWPORT)
  paintedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
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
    aspectRatio: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    marginBottom: 12,
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
  btnNextPage: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    alignSelf: 'flex-end',
  },
  btnNextPageText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // DEDICATED SQUARE CANVAS PLACEHOLDER
  emptyCanvasCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyCanvasDashed: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyCanvasIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyCanvasTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyCanvasSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },

  // DEDICATED SCENE INPUT & SUGGESTION SECTION
  sceneInputSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    marginBottom: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sceneInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sceneInputLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0A1C3E',
    flex: 1,
    marginRight: 8,
  },
  suggestBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  suggestBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  customBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    padding: 10,
  },
  customInput: {
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '600',
    minHeight: 64,
    textAlignVertical: 'top',
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
