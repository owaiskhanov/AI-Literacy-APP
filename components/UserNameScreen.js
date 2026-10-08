import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';

const INK = '#1B2A4A';
const TITLE_INK = '#0A1C3E';
const SUBTITLE_COLOR = '#556882';

function SparkleIcon({ size = 18, color = '#DE9E36' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 7.52 16.48 12 22 12C16.48 12 12 16.48 12 22C12 16.48 7.52 12 2 12C7.52 12 12 7.52 12 2Z"
        fill={color}
      />
    </Svg>
  );
}

export default function UserNameScreen({
  initialName = '',
  placeholder = 'Your story name',
  onContinue,
  onBack,
}) {
  const [userName, setUserName] = useState(initialName);
  const { width, height } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (onContinue) {
      onContinue(userName);
    }
  };

  // Position where the little fox is pointing (center-right cream area)
  const inputTop = height * 0.505;
  const inputLeft = width * 0.40;
  const inputRight = 24;

  // Header text block positioned in upper cream expanse
  const headerTop = height * 0.28;
  const titleFontSize = Math.min(width * 0.096, 38);
  const subtitleFontSize = Math.min(width * 0.04, 15.5);

  const serifFont = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia, "Playfair Display", "Times New Roman", serif',
    default: 'serif',
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <ImageBackground
        source={require('../assets/userNameBackground.webp')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {/* Optional Back / Logout Button at top-left */}
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

          {/* Heading and Subtitle in the cream scroll area */}
          <Animated.View
            style={[
              styles.headerWrapper,
              {
                top: headerTop,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text
              style={[
                styles.titleText,
                {
                  fontSize: titleFontSize,
                  fontFamily: serifFont,
                  lineHeight: titleFontSize * 1.14,
                },
              ]}
            >
              {'What should\nwe call you?'}
            </Text>
            <Text style={[styles.subtitleText, { fontSize: subtitleFontSize }]}>
              Pick a story name. Keep your real name private.
            </Text>
          </Animated.View>

          {/* Input field in the center-right where the fox is pointing */}
          <Animated.View
            style={[
              styles.inputWrapper,
              {
                top: inputTop,
                left: inputLeft,
                right: inputRight,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
              {userName.trim().length > 0 ? (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              ) : (
                <View style={styles.sparkleContainer}>
                  <SparkleIcon size={18} color="#DE9E36" />
                </View>
              )}
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
    backgroundColor: '#0A1224',
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
    zIndex: 30,
  },
  headerWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  titleText: {
    fontWeight: '700',
    color: TITLE_INK,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontFamily: 'Inter_500Medium',
    color: SUBTITLE_COLOR,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    letterSpacing: -0.15,
  },
  inputWrapper: {
    position: 'absolute',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(27, 42, 74, 0.12)',
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: INK,
    paddingVertical: 4,
    paddingRight: 6,
  },
  submitButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sparkleContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
