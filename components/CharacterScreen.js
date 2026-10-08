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
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { generateCharacterWithGemini } from '../services/geminiService';

const INK = '#1B2A4A';
const TITLE_INK = '#0A1C3E';
const SUBTITLE_COLOR = '#475569';

const CHARACTER_ASSETS = {
  fox: require('../assets/characters/fox.png'),
  owl: require('../assets/characters/owl.png'),
  dragon: require('../assets/characters/dragon.png'),
};

function StarSparkle({ size = 16, color = '#E6A838' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z"
        fill={color}
      />
    </Svg>
  );
}

function DualSparkles({ color = '#4A90E2' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z"
          fill={color}
        />
      </Svg>
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" style={{ marginTop: -8, marginLeft: -4 }}>
        <Path
          d="M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z"
          fill="#E6A838"
        />
      </Svg>
    </View>
  );
}

export default function CharacterScreen({ onBack, onComplete }) {
  const { width, height } = useWindowDimensions();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [characterType, setCharacterType] = useState('fox');
  const [talkBubble, setTalkBubble] = useState(
    'Add what they look like\nand what makes them\nspecial!'
  );

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Screen entrance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Gentle character breathing / idle float
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
  }, []);

  const handleGenerate = async () => {
    const userText = prompt.trim() || 'A brave fox who loves the ocean';
    setLoading(true);

    // Pop bubble down slightly during thinking
    Animated.timing(bubbleScale, {
      toValue: 0.92,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      const result = await generateCharacterWithGemini(userText);
      setCharacterType(result.characterType);
      setTalkBubble(result.talkBubble || 'Adventure awaits! ✨');
    } catch (err) {
      setTalkBubble("The salty breeze is whispering! Let's explore the seas! 🌊");
    } finally {
      setLoading(false);
      // Pop bubble back in joyfully
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

  const titleFontSize = Math.min(width * 0.098, 38);
  const characterImageSource = CHARACTER_ASSETS[characterType] || CHARACTER_ASSETS.fox;

  // Viewport character size
  const characterSize = Math.min(width * 0.72, 340);
  const characterBottom = height * 0.16;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent />
      <ImageBackground
        source={require('../assets/generateCharacterBackground.webp')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Back Navigation Button */}
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 18l-6-6 6-6"
                  stroke="#FFFFFF"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          )}

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

          {/* Character Viewport (standing on rocks without background frame) */}
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
                  {loading ? 'Thinking up a magical response with Gemini 3.1... ✨' : talkBubble}
                </Text>
              </View>
              {/* Pointer Tail towards character */}
              <View style={styles.speechBubbleTail} />
            </Animated.View>

            {/* Transparent Character Cutout */}
            <Image
              source={characterImageSource}
              style={{
                width: characterSize,
                height: characterSize,
                resizeMode: 'contain',
              }}
            />
          </Animated.View>

          {/* Bottom AI Input Box */}
          <Animated.View style={[styles.inputSection, { opacity: fadeAnim }]}>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                placeholder="A brave fox who loves the ocean"
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
                  <DualSparkles color="#4A90E2" />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  headerContainer: {
    position: 'absolute',
    top: '8%',
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
    right: 6,
    top: 36,
  },
  titleText: {
    fontWeight: '700',
    color: TITLE_INK,
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
    top: -30,
    right: 18,
    maxWidth: 200,
    zIndex: 25,
  },
  speechBubbleCard: {
    backgroundColor: 'rgba(255, 252, 246, 0.97)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 195, 170, 0.6)',
    shadowColor: '#1B2A4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  speechBubbleText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
    color: '#1B2A4A',
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '600',
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
    borderTopColor: 'rgba(255, 252, 246, 0.97)',
  },
  inputSection: {
    position: 'absolute',
    bottom: 34,
    left: 18,
    right: 18,
    zIndex: 30,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 254, 250, 0.96)',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 195, 170, 0.35)',
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
});
