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

function SubtleBackGlow({ size = 160 }) {
  return (
    <View style={[styles.subtleBackGlow, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="storyGlowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.45" />
            <Stop offset="45%" stopColor="#FDE68A" stopOpacity="0.25" />
            <Stop offset="80%" stopColor="#93C5FD" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#storyGlowGrad)" />
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
  const characterName = activeCharacter?.name || 'Brave Friend';
  const characterAvatar = activeCharacter?.avatarUri || activeCharacter?.imageUrl;
  const signatureItem = activeCharacter?.signatureItem || 'Star Crystal';
  const childAuthor = userInfo?.name || storyName || 'Young Author';

  // State
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [readerModalVisible, setReaderModalVisible] = useState(false);
  const [readerPageIndex, setReaderPageIndex] = useState(0);

  // 6 Story Pages (starts with initial empty slots, auto-populates as child guides story)
  const [storyPages, setStoryPages] = useState(() => {
    return Array(6).fill(null);
  });

  // Current Co-Pilot Dialogue
  const [coPilotSpeech, setCoPilotSpeech] = useState(() => {
    return STORY_BEATS[0].question(characterName, signatureItem);
  });

  // Animations
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const charBounce = useRef(new Animated.Value(0)).current;
  const starSpin = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  const currentBeat = STORY_BEATS[currentBeatIndex] || STORY_BEATS[0];

  // Co-Pilot gentle breathing / hover animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(charBounce, {
          toValue: -6,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(charBounce, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Update Co-Pilot speech when beat changes
  useEffect(() => {
    const existing = storyPages[currentBeatIndex];
    if (existing && existing.coPilotReply) {
      setCoPilotSpeech(existing.coPilotReply);
    } else {
      setCoPilotSpeech(currentBeat.question(characterName, signatureItem));
    }
    setSelectedOptionId(null);
    setCustomInput('');
    setShowCustomInput(false);

    // Pop bubble smoothly
    Animated.sequence([
      Animated.timing(bubbleScale, { toValue: 0.92, duration: 120, useNativeDriver: true }),
      Animated.spring(bubbleScale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [currentBeatIndex]);

  // Read aloud helper (supports Web SpeechSynthesis)
  const handleReadAloud = (textToRead) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.15;
      window.speechSynthesis.speak(utterance);
    } else {
      Alert.alert('Story Voice 🎙️', textToRead);
    }
  };

  // Generate Current Page
  const handleGeneratePage = async () => {
    const chosenOption = currentBeat.options.find((o) => o.id === selectedOptionId);
    if (!chosenOption && !customInput.trim()) {
      Alert.alert(
        'Pick An Idea! ✨',
        `${characterName} is waiting for your choice! Tap an option above or type your own magical idea!`
      );
      return;
    }

    setLoading(true);
    setLoadingStep(`Writing Page ${currentBeatIndex + 1} with ${characterName}...`);

    try {
      const apiKey = getGeminiApiKey();

      // 1. Generate Lyrical Story Text & Co-Pilot Dialogue
      const textResult = await generateStoryPageContent({
        beatIndex: currentBeatIndex,
        character: activeCharacter,
        childChoice: chosenOption,
        customInput: customInput.trim(),
        apiKey: apiKey,
      });

      setLoadingStep(`Painting Page ${currentBeatIndex + 1} illustration...`);

      // 2. Generate Full Scene Illustration
      let imageUri = null;
      if (apiKey) {
        try {
          imageUri = await generateStoryPageImage(textResult.imagePrompt, apiKey);
        } catch (imgErr) {
          console.warn('Image generation fallback:', imgErr);
        }
      }

      // Fallback charming card illustration if image generation not configured/errored
      if (!imageUri) {
        const fallbackCard = PRESET_STORY_PAGES[currentBeatIndex]?.imageUri || 'card_story.jpg';
        imageUri = fallbackCard;
      }

      const newPage = {
        beatIndex: currentBeatIndex,
        pageNumber: currentBeatIndex + 1,
        title: currentBeat.title,
        subtitle: currentBeat.subtitle,
        choiceLabel: chosenOption?.label || customInput.trim(),
        coPilotReply: textResult.coPilotReply,
        storyText: textResult.storyText,
        imageUri: imageUri,
        imagePrompt: textResult.imagePrompt,
      };

      const updatedPages = [...storyPages];
      updatedPages[currentBeatIndex] = newPage;
      setStoryPages(updatedPages);
      setCoPilotSpeech(textResult.coPilotReply);

      // Save story to account
      saveStoryToAccount(
        userInfo,
        {
          id: `story_${characterName.replace(/\s+/g, '_')}`,
          title: `The Legend of ${characterName}`,
          author: childAuthor,
          characterName: characterName,
          characterAvatar: characterAvatar,
          signatureItem: signatureItem,
          pages: updatedPages.filter(Boolean),
          isComplete: updatedPages.filter(Boolean).length === 6,
        },
        storyName
      );

      setLoading(false);

      // If finished page 6, celebrate and prompt reader
      if (currentBeatIndex === 5) {
        Alert.alert(
          '🎉 Story Completed!!',
          `Congratulations ${childAuthor}! You and ${characterName} completed all 6 pages of your storybook!`,
          [
            { text: 'Read Storybook Now 📖', onPress: () => setReaderModalVisible(true) },
            { text: 'Awesome!', style: 'cancel' },
          ]
        );
      } else {
        // Automatically suggest advancing to next beat
        Alert.alert(
          `Page ${currentBeatIndex + 1} Painted! 🎨`,
          `"${textResult.storyText.slice(0, 75)}..."`,
          [
            {
              text: `Next Page (${currentBeatIndex + 2}/6) ➜`,
              onPress: () => setCurrentBeatIndex((prev) => Math.min(prev + 1, 5)),
            },
            { text: 'Stay Here', style: 'cancel' },
          ]
        );
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Story Error', err.message || 'Unable to paint story page. Please try again.');
    }
  };

  const completedPagesCount = storyPages.filter(Boolean).length;
  const currentPageData = storyPages[currentBeatIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ImageBackground
        source={require('../assets/page4ProjectsBg.png')}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.darkBackdropOverlay} />

        {/* TOP BAR */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonArrow}>‹</Text>
            <Text style={styles.backButtonText}>Projects</Text>
          </TouchableOpacity>

          <View style={styles.titleBadge}>
            <Text style={styles.titleBadgeEmoji}>📖</Text>
            <Text style={styles.titleBadgeText} numberOfLines={1}>
              {characterName}'s Story
            </Text>
          </View>

          {completedPagesCount > 0 && (
            <TouchableOpacity
              style={styles.readBookHeaderBtn}
              onPress={() => setReaderModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.readBookHeaderText}>Read Book ({completedPagesCount}/6)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 6-BEAT PROGRESS RAIL */}
        <View style={styles.progressRailContainer}>
          <View style={styles.progressRailInner}>
            {STORY_BEATS.map((beat, idx) => {
              const isCompleted = Boolean(storyPages[idx]);
              const isActive = idx === currentBeatIndex;
              return (
                <TouchableOpacity
                  key={beat.id}
                  style={[
                    styles.progressGem,
                    isActive && styles.progressGemActive,
                    isCompleted && styles.progressGemCompleted,
                  ]}
                  onPress={() => setCurrentBeatIndex(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.progressGemText, isActive && styles.progressGemTextActive]}>
                    {isCompleted ? '✓' : idx + 1}
                  </Text>
                  <Text style={styles.progressGemLabel}>Page {idx + 1}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* MAIN INTERACTIVE SCROLL */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* CO-PILOT CHARACTER DOCK (Talking Stage) */}
          <View style={styles.coPilotStage}>
            {/* Character Avatar with subtle floating bounce */}
            <Animated.View
              style={[
                styles.coPilotAvatarWrap,
                { transform: [{ translateY: charBounce }] },
              ]}
            >
              <SubtleBackGlow size={130} />
              {characterAvatar ? (
                <Image
                  source={
                    typeof characterAvatar === 'string' &&
                    (characterAvatar.startsWith('http') || characterAvatar.startsWith('data:'))
                      ? { uri: characterAvatar }
                      : require('../assets/characters/fox.png')
                  }
                  style={styles.coPilotAvatarImg}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require('../assets/characters/fox.png')}
                  style={styles.coPilotAvatarImg}
                  resizeMode="contain"
                />
              )}
              <View style={styles.coPilotNameTag}>
                <Text style={styles.coPilotNameTagText} numberOfLines={1}>
                  {characterName}
                </Text>
              </View>
            </Animated.View>

            {/* Speaking Speech Bubble */}
            <Animated.View
              style={[
                styles.speechBubbleCard,
                { transform: [{ scale: bubbleScale }] },
              ]}
            >
              <View style={styles.speechBubbleHeader}>
                <Text style={styles.speechBubbleAuthor}>Co-Author Guide 🎙️</Text>
                <TouchableOpacity
                  style={styles.btnListen}
                  onPress={() => handleReadAloud(coPilotSpeech)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnListenText}>🔊 Listen</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.speechBubbleText}>{coPilotSpeech}</Text>

              <View style={styles.speechBubbleTail} />
            </Animated.View>
          </View>

          {/* CURRENT BEAT HEADER */}
          <View style={styles.beatHeaderWrap}>
            <View style={styles.beatBadge}>
              <Text style={styles.beatBadgeText}>BEAT {currentBeatIndex + 1} OF 6</Text>
            </View>
            <Text style={styles.beatTitle}>{currentBeat.title}</Text>
            <Text style={styles.beatSubtitle}>{currentBeat.subtitle}</Text>
          </View>

          {/* CURRENT PAGE PREVIEW (If already generated) */}
          {currentPageData && (
            <View style={styles.pagePreviewCard}>
              <View style={styles.pagePreviewHeader}>
                <Text style={styles.pagePreviewTitle}>🎨 Page {currentBeatIndex + 1} Illustrated</Text>
                <TouchableOpacity
                  onPress={() => handleReadAloud(currentPageData.storyText)}
                  style={styles.btnListenSmall}
                >
                  <Text style={styles.btnListenSmallText}>🔊 Read Text</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pagePreviewImageWrap}>
                <Image
                  source={
                    currentPageData.imageUri && currentPageData.imageUri.startsWith('data:')
                      ? { uri: currentPageData.imageUri }
                      : require('../assets/cards/card_story.jpg')
                  }
                  style={styles.pagePreviewImage}
                  resizeMode="cover"
                />
              </View>

              <Text style={styles.pagePreviewStoryText}>"{currentPageData.storyText}"</Text>
            </View>
          )}

          {/* GUIDED CHOICE BUBBLES (Option B) */}
          <View style={styles.choicesSection}>
            <Text style={styles.choicesSectionHeader}>
              ✨ Pick an idea with {characterName}:
            </Text>

            <View style={styles.choiceGrid}>
              {currentBeat.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.choiceCard,
                      isSelected && styles.choiceCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedOptionId(option.id);
                      setCustomInput('');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.choiceCardTop}>
                      <Text style={styles.choiceCardIcon}>{option.icon}</Text>
                      {isSelected && (
                        <View style={styles.selectedCheckBadge}>
                          <Text style={styles.selectedCheckText}>✓</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.choiceCardLabel, isSelected && styles.choiceCardLabelSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.choiceCardDesc} numberOfLines={2}>
                      {option.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Input Toggle */}
            <TouchableOpacity
              style={styles.toggleCustomBtn}
              onPress={() => setShowCustomInput(!showCustomInput)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleCustomText}>
                {showCustomInput ? '▲ Hide Custom Idea' : '✍️ Have your own magic twist? Type it here!'}
              </Text>
            </TouchableOpacity>

            {showCustomInput && (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customTextInput}
                  placeholder={`e.g. ${characterName} flies high into a rainbow doughnut cloud...`}
                  placeholderTextColor="#94A3B8"
                  value={customInput}
                  onChangeText={(text) => {
                    setCustomInput(text);
                    if (text.trim()) setSelectedOptionId(null);
                  }}
                  multiline
                />
              </View>
            )}
          </View>

          {/* ACTION BUTTON: PAINT THIS PAGE */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[
                styles.paintPageBtn,
                loading && styles.paintPageBtnDisabled,
              ]}
              onPress={handleGeneratePage}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.loadingBtnText}>{loadingStep}</Text>
                </View>
              ) : (
                <View style={styles.paintBtnContent}>
                  <Text style={styles.paintBtnEmoji}>🎨</Text>
                  <Text style={styles.paintBtnText}>
                    {currentPageData
                      ? `Re-paint Page ${currentBeatIndex + 1} with AI`
                      : `Paint Page ${currentBeatIndex + 1} with AI ✨`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {completedPagesCount === 6 && (
              <TouchableOpacity
                style={styles.openBookFullBtn}
                onPress={() => setReaderModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.openBookFullText}>📖 Read Complete Storybook (6/6)</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* INTERACTIVE STORYBOOK READER MODAL */}
        <Modal
          visible={readerModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setReaderModalVisible(false)}
        >
          <View style={styles.readerModalContainer}>
            <StatusBar style="light" />

            {/* Reader Header */}
            <View style={styles.readerHeader}>
              <TouchableOpacity
                style={styles.readerCloseBtn}
                onPress={() => setReaderModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.readerCloseBtnText}>✕ Close</Text>
              </TouchableOpacity>

              <Text style={styles.readerHeaderTitle} numberOfLines={1}>
                The Tale of {characterName}
              </Text>

              <TouchableOpacity
                style={styles.readerMerchBtn}
                onPress={() => {
                  setReaderModalVisible(false);
                  if (onGoToMerch) onGoToMerch();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.readerMerchBtnText}>👕 Print Merch</Text>
              </TouchableOpacity>
            </View>

            {/* Reader Book Page Display */}
            <View style={styles.readerBookStage}>
              {storyPages[readerPageIndex] ? (
                <View style={styles.readerPageCard}>
                  {/* Page Image */}
                  <View style={styles.readerImageWrap}>
                    <Image
                      source={
                        storyPages[readerPageIndex].imageUri &&
                        storyPages[readerPageIndex].imageUri.startsWith('data:')
                          ? { uri: storyPages[readerPageIndex].imageUri }
                          : require('../assets/cards/card_story.jpg')
                      }
                      style={styles.readerImage}
                      resizeMode="cover"
                    />
                    <View style={styles.readerPageBadge}>
                      <Text style={styles.readerPageBadgeText}>
                        Page {readerPageIndex + 1} of 6
                      </Text>
                    </View>
                  </View>

                  {/* Page Text & Audio */}
                  <View style={styles.readerTextSection}>
                    <Text style={styles.readerPageTitle}>
                      {storyPages[readerPageIndex].title}
                    </Text>
                    <Text style={styles.readerStoryBody}>
                      {storyPages[readerPageIndex].storyText}
                    </Text>

                    <TouchableOpacity
                      style={styles.readerListenPill}
                      onPress={() => handleReadAloud(storyPages[readerPageIndex].storyText)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.readerListenPillText}>🔊 Read Page to Me</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyReaderPage}>
                  <Text style={styles.emptyReaderEmoji}>🎨</Text>
                  <Text style={styles.emptyReaderTitle}>Page {readerPageIndex + 1} Not Painted Yet</Text>
                  <Text style={styles.emptyReaderDesc}>
                    Go back to the story studio to paint Page {readerPageIndex + 1} with {characterName}!
                  </Text>
                </View>
              )}
            </View>

            {/* Reader Navigation Footer */}
            <View style={styles.readerFooter}>
              <TouchableOpacity
                style={[
                  styles.readerNavBtn,
                  readerPageIndex === 0 && styles.readerNavBtnDisabled,
                ]}
                disabled={readerPageIndex === 0}
                onPress={() => setReaderPageIndex((p) => Math.max(0, p - 1))}
              >
                <Text style={styles.readerNavBtnText}>◀ Previous</Text>
              </TouchableOpacity>

              <View style={styles.readerPageDots}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setReaderPageIndex(i)}
                    style={[
                      styles.readerDot,
                      readerPageIndex === i && styles.readerDotActive,
                      storyPages[i] && styles.readerDotComplete,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.readerNavBtn,
                  readerPageIndex === 5 && styles.readerNavBtnDisabled,
                ]}
                disabled={readerPageIndex === 5}
                onPress={() => setReaderPageIndex((p) => Math.min(5, p + 1))}
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
  darkBackdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
  },
  subtleBackGlow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  // TOP BAR
  headerBar: {
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonArrow: {
    fontSize: 20,
    color: '#0A1C3E',
    fontWeight: '700',
    marginRight: 4,
    marginTop: -2,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A1C3E',
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(238, 242, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    maxWidth: '46%',
  },
  titleBadgeEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  titleBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3730A3',
  },
  readBookHeaderBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  readBookHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 6-BEAT PROGRESS RAIL
  progressRailContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressRailInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressGem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minWidth: 48,
  },
  progressGemActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    transform: [{ scale: 1.05 }],
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  progressGemCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  progressGemText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  progressGemTextActive: {
    color: '#1D4ED8',
  },
  progressGemLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },

  // MAIN SCROLL
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // CO-PILOT CHARACTER DOCK
  coPilotStage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  coPilotAvatarWrap: {
    width: 88,
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  coPilotAvatarImg: {
    width: 78,
    height: 78,
    zIndex: 2,
  },
  coPilotNameTag: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: -6,
    zIndex: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  coPilotNameTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FDE68A',
  },
  speechBubbleCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  speechBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  speechBubbleAuthor: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnListen: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  btnListenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  speechBubbleText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 18,
  },
  speechBubbleTail: {
    position: 'absolute',
    left: -8,
    top: 24,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderTopColor: 'transparent',
    borderBottomWidth: 8,
    borderBottomColor: 'transparent',
    borderRightWidth: 8,
    borderRightColor: '#F8FAFC',
  },

  // CURRENT BEAT HEADER
  beatHeaderWrap: {
    marginBottom: 14,
  },
  beatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: 4,
  },
  beatBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  beatTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A1C3E',
    letterSpacing: -0.3,
  },
  beatSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    marginTop: 2,
  },

  // PAGE PREVIEW CARD
  pagePreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  pagePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pagePreviewTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0A1C3E',
  },
  btnListenSmall: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  btnListenSmallText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4F46E5',
  },
  pagePreviewImageWrap: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  pagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  pagePreviewStoryText: {
    fontSize: 13.5,
    fontStyle: 'italic',
    color: '#1E293B',
    lineHeight: 19,
    fontWeight: '500',
  },

  // GUIDED CHOICES
  choicesSection: {
    marginBottom: 18,
  },
  choicesSectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A1C3E',
    marginBottom: 10,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  choiceCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  choiceCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    transform: [{ scale: 1.02 }],
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  choiceCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  choiceCardIcon: {
    fontSize: 24,
  },
  selectedCheckBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  choiceCardLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  choiceCardLabelSelected: {
    color: '#1D4ED8',
  },
  choiceCardDesc: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
  },
  toggleCustomBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 2,
  },
  toggleCustomText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  customInputContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    padding: 10,
  },
  customTextInput: {
    fontSize: 13,
    color: '#0F172A',
    minHeight: 50,
  },

  // ACTION BUTTONS
  actionSection: {
    marginBottom: 20,
  },
  paintPageBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  paintPageBtnDisabled: {
    backgroundColor: '#60A5FA',
  },
  paintBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paintBtnEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  paintBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  openBookFullBtn: {
    marginTop: 10,
    backgroundColor: '#10B981',
    paddingVertical: 13,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  openBookFullText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // READER MODAL
  readerModalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  readerHeader: {
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  readerCloseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#334155',
    borderRadius: 14,
  },
  readerCloseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  readerHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    maxWidth: '50%',
  },
  readerMerchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F59E0B',
    borderRadius: 14,
  },
  readerMerchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  readerBookStage: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  readerPageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  readerImageWrap: {
    width: '100%',
    height: 240,
    backgroundColor: '#000000',
    position: 'relative',
  },
  readerImage: {
    width: '100%',
    height: '100%',
  },
  readerPageBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  readerPageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },
  readerTextSection: {
    padding: 18,
  },
  readerPageTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  readerStoryBody: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1E293B',
    fontWeight: '600',
    marginBottom: 14,
  },
  readerListenPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  readerListenPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  emptyReaderPage: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#1E293B',
    borderRadius: 22,
  },
  emptyReaderEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyReaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptyReaderDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  readerFooter: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  readerNavBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  readerNavBtnDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  readerNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  readerPageDots: {
    flexDirection: 'row',
    gap: 6,
  },
  readerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#475569',
  },
  readerDotActive: {
    backgroundColor: '#3B82F6',
    width: 18,
  },
  readerDotComplete: {
    backgroundColor: '#10B981',
  },
});
