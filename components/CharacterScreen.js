import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import {
  generateCharacterWithGemini,
  getGeminiApiKey,
  setGeminiApiKey,
} from '../services/geminiService';

const INK = '#0A1C3E';
const SUBTITLE_COLOR = '#475569';

function StarSparkle({ size = 16, color = '#DE9E36' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z"
        fill={color}
      />
    </Svg>
  );
}

function DualSparkles({ color = '#4A90E2', secondaryColor = '#DE9E36' }) {
  return (
    <View style={styles.dualSparklesContainer}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z"
          fill={color}
        />
      </Svg>
      <View style={styles.smallSparkleOffset}>
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z"
            fill={secondaryColor}
          />
        </Svg>
      </View>
    </View>
  );
}

export default function CharacterScreen({ onBack, onComplete }) {
  const { width, height } = useWindowDimensions();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  // Dynamic AI Generated State (no hardcoded characters)
  const [characterImageUri, setCharacterImageUri] = useState(null);
  const [characterName, setCharacterName] = useState('');
  const [talkBubble, setTalkBubble] = useState(
    'Add what they look like\nand what makes them\nspecial!'
  );

  // Gemini API Key Modal
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Check initial API key
    const existingKey = getGeminiApiKey();
    if (existingKey) {
      setHasApiKey(true);
      setApiKeyInput(existingKey);
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Subtle idle floating
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -6,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Summoning aura pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Empty Key', 'Please enter your Google Gemini API Key.');
      return;
    }
    setGeminiApiKey(apiKeyInput.trim());
    setHasApiKey(true);
    setApiKeyModalVisible(false);
    Alert.alert('Gemini Connected!', 'Your Gemini API key is configured. You can now generate characters!');
  };

  const handleGenerate = async () => {
    const userText = prompt.trim();
    if (!userText) {
      Alert.alert('Prompt Needed', 'Please describe your character (e.g. "A brave fox who loves the ocean")');
      return;
    }

    const activeKey = getGeminiApiKey();
    if (!activeKey) {
      setApiKeyModalVisible(true);
      return;
    }

    setLoading(true);
    setLoadingStep('Crafting character voice & story...');

    // Pop bubble down slightly during thinking
    Animated.timing(bubbleScale, {
      toValue: 0.9,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const result = await generateCharacterWithGemini(userText, activeKey);

      if (result.needsApiKey) {
        setApiKeyModalVisible(true);
        return;
      }

      if (result.talkBubble) {
        setTalkBubble(result.talkBubble);
      }
      if (result.characterName) {
        setCharacterName(result.characterName);
      }

      if (result.imageUrl) {
        setCharacterImageUri(result.imageUrl);
      } else if (result.imageError) {
        Alert.alert('Image Generation Notice', `Generated character story & dialogue! Note: ${result.imageError}`);
      }
    } catch (err) {
      Alert.alert('Generation Error', err.message || 'Unable to generate character. Please check your Gemini API key.');
    } finally {
      setLoading(false);
      setLoadingStep('');
      Animated.spring(bubbleScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  };

  const serifFont = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia, "Playfair Display", "Times New Roman", serif',
    default: 'serif',
  });

  const titleFontSize = Math.min(width * 0.096, 38);
  const characterSize = Math.min(width * 0.88, 390);
  const characterBottom = height * 0.25;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent />
      <ImageBackground
        source={require('../assets/characterStageRockBg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Top Bar: Back Button & API Key Settings */}
          <View style={styles.topBar}>
            {onBack ? (
              <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.7}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15 18l-6-6 6-6"
                    stroke="#FFFFFF"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            ) : <View style={{ width: 40 }} />}

            {/* Gemini API Key Indicator & Trigger */}
            <TouchableOpacity
              style={[styles.apiKeyPill, hasApiKey ? styles.apiKeyPillActive : null]}
              onPress={() => setApiKeyModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.apiKeyPillText}>
                {hasApiKey ? '✨ Gemini Connected' : '🔑 Set Gemini Key'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Heading with Fairytale Star Sparkles */}
          <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
            <View style={styles.titleSparkleRow}>
              <View style={styles.sparkleLeft}>
                <StarSparkle size={18} color="#DE9E36" />
              </View>
              <Text
                style={[
                  styles.titleText,
                  {
                    fontSize: titleFontSize,
                    fontFamily: serifFont,
                    lineHeight: titleFontSize * 1.12,
                  },
                ]}
              >
                {'Dream up your\ncharacter'}
              </Text>
              <View style={styles.sparkleRight}>
                <StarSparkle size={14} color="#DE9E36" />
              </View>
            </View>
          </Animated.View>

          {/* Character Viewport Stage (no background frame, transparent on rocks) */}
          <Animated.View
            style={[
              styles.characterStage,
              {
                bottom: characterBottom,
                opacity: fadeAnim,
                transform: [{ translateY: floatAnim }],
              },
            ]}
          >
            {/* Talk / Speech Bubble beside character's head */}
            <Animated.View
              style={[
                styles.speechBubbleWrapper,
                { transform: [{ scale: bubbleScale }] },
              ]}
            >
              <View style={styles.speechBubbleCard}>
                <Text style={styles.speechBubbleText}>
                  {loading
                    ? (loadingStep || 'Summoning your character with Gemini 3.1... ✨')
                    : talkBubble}
                </Text>
                {characterName ? (
                  <Text style={styles.characterBadge}>— {characterName}</Text>
                ) : null}
              </View>
              {/* Pointer Tail towards character */}
              <View style={styles.speechBubbleTail} />
            </Animated.View>

            {/* Character Render: Dynamic AI Generated or Inviting Magic Summoning Aura */}
            {characterImageUri ? (
              <View style={styles.characterContainer}>
                {/* Luminous Soft Backlight Aura (Separates character from background) */}
                <View style={styles.characterBackdropAura} />

                {/* 3D Character Cutout Image */}
                <Image
                  source={{ uri: characterImageUri }}
                  style={[
                    styles.characterImage,
                    {
                      width: characterSize,
                      height: characterSize,
                    },
                  ]}
                />

                {/* Ground Shadow on Rocks (Anchors feet) */}
                <View style={styles.groundShadow} />
              </View>
            ) : (
              <Animated.View
                style={[
                  styles.summoningPlaceholder,
                  {
                    width: characterSize,
                    height: characterSize,
                    opacity: pulseAnim,
                  },
                ]}
              >
                <View style={styles.auraRingOuter}>
                  <View style={styles.auraRingInner}>
                    <DualSparkles color="#4A90E2" secondaryColor="#DE9E36" />
                    <Text style={styles.summoningText}>
                      Describe your character below{'\n'}to generate them with Gemini!
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Bottom AI Input Section (Refined UI) */}
          <Animated.View style={[styles.inputSection, { opacity: fadeAnim }]}>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                placeholder="A playful fox with crystal wings..."
                placeholderTextColor="#8C9CAE"
                value={prompt}
                onChangeText={setPrompt}
                returnKeyType="send"
                onSubmitEditing={handleGenerate}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.aiButton}
                onPress={handleGenerate}
                disabled={loading}
                activeOpacity={0.75}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#4A90E2" />
                ) : (
                  <DualSparkles color="#4A90E2" secondaryColor="#DE9E36" />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Gemini API Key Modal */}
          <Modal
            visible={apiKeyModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setApiKeyModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderIcon}>
                  <Text style={{ fontSize: 28 }}>✨</Text>
                </View>
                <Text style={styles.modalTitle}>Connect Google Gemini</Text>
                <Text style={styles.modalSubtitle}>
                  Enter your Google Gemini API Key to enable real-time character image & voice generation.
                </Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Paste your Gemini API key (AIza...)"
                  placeholderTextColor="#94A3B8"
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={false}
                />

                <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveApiKey} activeOpacity={0.8}>
                  <Text style={styles.modalSaveButtonText}>Save & Connect Gemini</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setApiKeyModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  apiKeyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  apiKeyPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  apiKeyPillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  headerContainer: {
    position: 'absolute',
    top: '11%',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 20,
  },
  titleSparkleRow: {
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 28,
  },
  sparkleLeft: {
    position: 'absolute',
    left: 0,
    top: 10,
  },
  sparkleRight: {
    position: 'absolute',
    right: 4,
    top: 36,
  },
  titleText: {
    fontWeight: '700',
    color: INK,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  characterStage: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  speechBubbleWrapper: {
    position: 'absolute',
    top: -38,
    right: 18,
    maxWidth: 220,
    zIndex: 25,
  },
  speechBubbleCard: {
    backgroundColor: 'rgba(255, 252, 246, 0.98)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 195, 170, 0.6)',
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  speechBubbleText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#1B2A4A',
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  characterBadge: {
    fontSize: 11,
    color: '#8A9BB3',
    textAlign: 'right',
    marginTop: 4,
    fontStyle: 'italic',
  },
  speechBubbleTail: {
    position: 'absolute',
    bottom: -8,
    left: 36,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 252, 246, 0.98)',
  },
  summoningPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraRingOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  auraRingInner: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 253, 248, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  summoningText: {
    fontSize: 11.5,
    color: '#556882',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
    fontWeight: '500',
  },
  inputSection: {
    position: 'absolute',
    bottom: 32,
    left: 18,
    right: 18,
    zIndex: 30,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 254, 250, 0.96)',
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 195, 170, 0.45)',
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: INK,
    paddingVertical: 2,
    paddingRight: 8,
  },
  aiButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualSparklesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallSparkleOffset: {
    marginTop: -8,
    marginLeft: -4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 14,
  },
  modalSaveButton: {
    width: '100%',
    backgroundColor: '#4338CA',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
  modalCloseButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterBackdropAura: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#FFF8DC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 32,
    elevation: 8,
    zIndex: -1,
  },
  characterImage: {
    resizeMode: 'contain',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  groundShadow: {
    width: 190,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 28, 62, 0.42)',
    marginTop: -10,
    shadowColor: '#0A1C3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 5,
    transform: [{ scaleY: 0.65 }],
  },
});
