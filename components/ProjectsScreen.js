import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Platform,
  Modal,
  Alert,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const PROJECT_CARDS = [
  {
    id: 'story',
    title: 'Make a Story',
    tag: '📖 Story Quest',
    tagColor: '#3B82F6',
    tagBg: '#EFF6FF',
    description: 'Illustrated fairytale chapters with 100% visual consistency.',
    badge: 'Popular',
    image: require('../assets/cards/card_story.jpg'),
    actionLabel: 'Write Story ➜',
    details: {
      headline: 'Storybook Studio with Gemini',
      points: [
        'Write chapters starring your exact character and signature item.',
        'AI maintains identical facial features, colors, and wings throughout.',
        'Export as a digital flipbook or printable bedtime story.',
      ],
    },
  },
  {
    id: 'website',
    title: 'Make a Mini website',
    tag: '🌐 Web Studio',
    tagColor: '#8B5CF6',
    tagBg: '#F5F3FF',
    description: 'Build a personalized mini website showcasing your character.',
    badge: 'Interactive',
    image: require('../assets/cards/card_website.jpg'),
    actionLabel: 'Build Site ➜',
    details: {
      headline: 'Character Homepage Creator',
      points: [
        'Generate an instant custom web portfolio with glowing neon buttons.',
        'Add a live voice chat widget powered by your companion\'s dialogue.',
        'Share a public link with family and friends.',
      ],
    },
  },
  {
    id: 'merch',
    title: 'Make Merchandise',
    tag: '👕 Merch Studio',
    tagColor: '#EC4899',
    tagBg: '#FDF2F8',
    description: 'Create custom t-shirts, holographic stickers & mugs.',
    badge: 'Print Ready',
    image: require('../assets/cards/card_merch.jpg'),
    actionLabel: 'Design Merch ➜',
    details: {
      headline: 'Merchandise Studio & Mockups',
      points: [
        'High-res transparent cutout pre-formatted for direct printing.',
        'Preview character on die-cut holographic stickers & apparel.',
        'Generate direct-to-garment ready vector specifications.',
      ],
    },
  },
  {
    id: 'app',
    title: 'Make your Own App',
    tag: '📱 App Lab',
    tagColor: '#F59E0B',
    tagBg: '#FFFBEB',
    description: 'Turn your character into an interactive mobile mini-game & app.',
    badge: 'GenAI Powered',
    image: require('../assets/cards/card_app.jpg'),
    actionLabel: 'Build App ➜',
    details: {
      headline: 'Mobile App & Mini-Game Builder',
      points: [
        'Animate your character as an interactive playable game sprite.',
        'Add sound effects, coin collectors, and jumping physics.',
        'Test on mobile device with zero coding required.',
      ],
    },
  },
];

function SubtleBackGlow({ size = 160 }) {
  return (
    <View style={[styles.subtleBackGlow, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="charGlowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.45" />
            <Stop offset="45%" stopColor="#FDE68A" stopOpacity="0.25" />
            <Stop offset="80%" stopColor="#93C5FD" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#charGlowGrad)" />
      </Svg>
    </View>
  );
}

export default function ProjectsScreen({ onBack, userInfo, storyName, activeCharacter }) {
  const { width, height } = useWindowDimensions();
  const [selectedProject, setSelectedProject] = useState(null);

  const characterImageUri = activeCharacter?.avatarUri || activeCharacter?.imageUrl;
  const characterName = activeCharacter?.name || 'Brave Kitsune';
  const ownerName = userInfo?.name || storyName || 'Explorer';
  const signatureItem = activeCharacter?.signatureItem || 'Star Crystal';

  const serifFont = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: '"Playfair Display", "Fraunces", Georgia, "Times New Roman", serif',
    default: 'serif',
  });

  // 70% bigger character in top corner (120px * 1.7 ≈ 205-212px)
  const characterSize = Math.min(width * 0.52, 212);
  const topSectionHeight = Math.max(height * 0.33, 268);
  const cardWidth = (width - 32 - 12) / 2;

  // Home Screen-style Animation Controllers
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(8)).current;
  const cursiveFade = useRef(new Animated.Value(0)).current;
  const cursiveScale = useRef(new Animated.Value(0.72)).current;
  const cursiveSlide = useRef(new Animated.Value(6)).current;
  const badgeFade = useRef(new Animated.Value(0)).current;
  const charScale = useRef(new Animated.Value(0.85)).current;
  const charFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      // 1. Character pops in smoothly (70% bigger!)
      Animated.timing(charFade, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(charScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      // 2. Headline & Cursive Character Name sequence (matching Home Screen)
      Animated.sequence([
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(titleFade, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleSlide, {
            toValue: 0,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Cursive Character Name blooming in
        Animated.parallel([
          Animated.timing(cursiveFade, {
            toValue: 1,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(cursiveScale, {
            toValue: 1,
            friction: 5,
            tension: 70,
            useNativeDriver: true,
          }),
          Animated.timing(cursiveSlide, {
            toValue: 0,
            duration: 460,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // Signature Item badge appears
        Animated.timing(badgeFade, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleStartProject = () => {
    if (selectedProject) {
      Alert.alert(
        'Studio Ready! 🚀',
        `Launching ${selectedProject.title} starring ${characterName}!`,
        [{ text: 'Great!', onPress: () => setSelectedProject(null) }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent />
      <ImageBackground
        source={require('../assets/page4ProjectsBg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* TOP 30% SECTION: Castle & Sky + 70% Bigger Saved Character on Right */}
        <View style={[styles.topSection, { height: topSectionHeight }]}>
          {/* Top Navigation Row: Back Button & Child Realm grouped on the LEFT */}
          <View style={styles.topNavRow}>
            <View style={styles.navLeftGroup}>
              {onBack ? (
                <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.75}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M15 18l-6-6 6-6"
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              ) : null}

              {/* Child Realm Pill (Safely on Left, 0 overlap with Character) */}
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText} numberOfLines={1}>
                  🏰 {ownerName}'s Kingdom
                </Text>
              </View>
            </View>
          </View>

          {/* Left Title: "What will you create with" + Cursive Character Name + Signature Item */}
          <View style={styles.topLeftContent}>
            <Animated.Text
              style={[
                styles.headlineTitle,
                {
                  fontFamily: serifFont,
                  opacity: titleFade,
                  transform: [{ translateY: titleSlide }],
                },
              ]}
            >
              {'What will you\ncreate with'}
            </Animated.Text>

            <Animated.View
              style={[
                styles.cursiveContainer,
                {
                  opacity: cursiveFade,
                  transform: [{ scale: cursiveScale }, { translateY: cursiveSlide }],
                },
              ]}
            >
              <Text
                style={[
                  styles.cursiveCharacterName,
                  {
                    fontFamily: Platform.select({
                      web: "'Sacramento', cursive",
                      default: 'Sacramento_400Regular',
                    }),
                  },
                ]}
                numberOfLines={1}
              >
                {characterName}
              </Text>
              <Text style={styles.cursiveQuestionMark}>?</Text>
            </Animated.View>

            <Animated.View style={[styles.signatureBadgeRow, { opacity: badgeFade }]}>
              <View style={styles.signatureBadge}>
                <Text style={styles.signatureBadgeText}>✨ Item: {signatureItem}</Text>
              </View>
            </Animated.View>
          </View>

          {/* Right Side: Saved Character Cutout in Dedicated Sky Dock (70% LARGER!) */}
          <Animated.View
            style={[
              styles.topRightCharacter,
              {
                opacity: charFade,
                transform: [{ scale: charScale }],
              },
            ]}
          >
            {/* Speech Bubble to the LEFT of Character Head (Never overlaps badge or face) */}
            <View style={styles.characterBubble}>
              <Text style={styles.characterBubbleText} numberOfLines={1}>
                ✨ Ready!
              </Text>
              <View style={styles.characterBubbleTail} />
            </View>

            <View style={[styles.characterWrapper, { width: characterSize, height: characterSize }]}>
              <SubtleBackGlow size={characterSize + 40} />
              {characterImageUri ? (
                <Image
                  source={typeof characterImageUri === 'string' && (characterImageUri.startsWith('http') || characterImageUri.startsWith('data:'))
                    ? { uri: characterImageUri }
                    : require('../assets/characters/fox.png')}
                  style={[styles.characterImg, { width: characterSize, height: characterSize }]}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={require('../assets/characters/fox.png')}
                  style={[styles.characterImg, { width: characterSize, height: characterSize }]}
                  resizeMode="contain"
                />
              )}

              {/* Name Tag Pill Cleanly Beneath Character Feet */}
              <View style={styles.characterNamePill}>
                <Text style={styles.characterNamePillText} numberOfLines={1}>
                  🐾 {characterName}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* BOTTOM 70% SECTION: 4 Rich Project Cards on Warm Canvas */}
        <View style={styles.bottomSection}>
          <ScrollView
            contentContainerStyle={styles.scrollCardsContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.gridContainer}>
              {PROJECT_CARDS.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.projectCard, { width: cardWidth }]}
                  onPress={() => setSelectedProject(project)}
                  activeOpacity={0.88}
                >
                  {/* Card Thumbnail Image (150px height for rich visual immersion) */}
                  <View style={styles.cardImageContainer}>
                    <Image source={project.image} style={styles.cardImage} resizeMode="cover" />
                    {/* Badge Pill */}
                    <View style={[styles.cardBadge, { backgroundColor: project.tagBg }]}>
                      <Text style={[styles.cardBadgeText, { color: project.tagColor }]}>
                        {project.badge}
                      </Text>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardTag, { color: project.tagColor }]}>
                      {project.tag}
                    </Text>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {project.description}
                    </Text>

                    {/* Bottom Action Pill Button */}
                    <View style={[styles.cardActionPill, { backgroundColor: project.tagBg, borderColor: project.tagColor }]}>
                      <Text style={[styles.cardActionText, { color: project.tagColor }]}>
                        {project.actionLabel}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom Storybook Reassurance Banner */}
            <View style={styles.footerBanner}>
              <Text style={styles.footerBannerText}>
                ✨ All 4 studios keep <Text style={styles.footerHighlight}>{characterName}</Text>'s exact style & magic item!
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Interactive Project Preview Modal */}
        <Modal
          visible={Boolean(selectedProject)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedProject(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {selectedProject ? (
                <>
                  <View style={styles.modalHeaderImgContainer}>
                    <Image source={selectedProject.image} style={styles.modalHeaderImg} resizeMode="cover" />
                    <View style={styles.modalTagBadge}>
                      <Text style={styles.modalTagText}>{selectedProject.tag}</Text>
                    </View>
                  </View>

                  <Text style={styles.modalTitle}>{selectedProject.title}</Text>
                  <Text style={styles.modalHeadline}>{selectedProject.details.headline}</Text>

                  <View style={styles.modalPointsList}>
                    {selectedProject.details.points.map((pt, idx) => (
                      <View key={idx} style={styles.modalPointRow}>
                        <Text style={styles.modalPointBullet}>✦</Text>
                        <Text style={styles.modalPointText}>{pt}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.modalStartButton}
                    onPress={handleStartProject}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalStartButtonText}>
                      Start with {characterName} 🚀
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedProject(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCloseButtonText}>Back to Studios</Text>
                  </TouchableOpacity>
                </>
              ) : null}
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
    backgroundColor: '#FAF5EE',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  // Top 30% Section
  topSection: {
    paddingTop: 48,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    position: 'relative',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 20,
  },
  navLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(10, 28, 62, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  ownerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1.2,
    borderColor: 'rgba(215, 195, 170, 0.8)',
    shadowColor: '#0A1C3E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A1C3E',
  },
  topLeftContent: {
    maxWidth: '52%',
    marginBottom: 8,
    zIndex: 15,
  },
  headlineTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A1C3E',
    lineHeight: 28,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(255, 255, 255, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cursiveContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
    marginBottom: 4,
  },
  cursiveCharacterName: {
    fontSize: 38,
    color: '#1E3A8A',
    lineHeight: 44,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.95)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  cursiveQuestionMark: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
    marginLeft: 3,
  },
  signatureBadgeRow: {
    marginTop: 4,
  },
  signatureBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#0A1C3E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  signatureBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  // Top Right Saved Character (70% Bigger!)
  topRightCharacter: {
    position: 'absolute',
    right: 4,
    top: 38,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 18,
  },
  characterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  subtleBackGlow: {
    position: 'absolute',
    zIndex: 1,
  },
  characterImg: {
    zIndex: 5,
  },
  characterBubble: {
    position: 'absolute',
    top: 14,
    left: -66,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 25,
  },
  characterBubbleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  characterBubbleTail: {
    position: 'absolute',
    right: -5,
    top: 7,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
  },
  characterNamePill: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: 'rgba(10, 28, 62, 0.92)',
    paddingHorizontal: 11,
    paddingVertical: 3.5,
    borderRadius: 14,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  characterNamePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
  },
  // Bottom 70% Section
  bottomSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollCardsContainer: {
    paddingBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  // Project Cards
  projectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 195, 170, 0.75)',
    overflow: 'hidden',
    shadowColor: '#0A1C3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImageContainer: {
    width: '100%',
    height: 148,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  cardBody: {
    padding: 11,
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0A1C3E',
    marginBottom: 3,
    lineHeight: 18,
  },
  cardDescription: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
    marginBottom: 8,
  },
  cardActionPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerBanner: {
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(215, 195, 170, 0.7)',
    alignItems: 'center',
    shadowColor: '#0A1C3E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  footerBannerText: {
    fontSize: 11.5,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '500',
  },
  footerHighlight: {
    fontWeight: '700',
    color: '#0A1C3E',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 28, 62, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderImgContainer: {
    width: '100%',
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 14,
  },
  modalHeaderImg: {
    width: '100%',
    height: '100%',
  },
  modalTagBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(10, 28, 62, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A1C3E',
    marginBottom: 3,
    textAlign: 'center',
  },
  modalHeadline: {
    fontSize: 12.5,
    color: '#2563EB',
    fontWeight: '600',
    marginBottom: 14,
    textAlign: 'center',
  },
  modalPointsList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  modalPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  modalPointBullet: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 1,
  },
  modalPointText: {
    flex: 1,
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
  },
  modalStartButton: {
    width: '100%',
    backgroundColor: '#1E3A8A',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  modalStartButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  modalCloseButton: {
    paddingVertical: 6,
  },
  modalCloseButtonText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
});
