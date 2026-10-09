import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { useFonts, Inter_500Medium, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import BrandLogo from './components/BrandLogo';
import WelcomeBack from './components/WelcomeBack';
import UserNameScreen from './components/UserNameScreen';
import CharacterScreen from './components/CharacterScreen';
import StoryAdventureScreen from './components/StoryAdventureScreen';
import { getActiveCharacter } from './services/characterStorage';

// Complete auth session if redirected back to web browser
WebBrowser.maybeCompleteAuthSession();

// Google OAuth 2.0 Client IDs
const GOOGLE_WEB_CLIENT_ID = '584201357489-9ne3ab41e64o7tqbrh6cvjir832brcin.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '584201357489-fsirf57kfgegdr6l06p9011ecjfv7al6.apps.googleusercontent.com';

// Brand block position (fractions of screen size)
const BRAND_TOP = 0.06; // 6% of screen height from the top
const BRAND_CENTER = false; // Left Wall alignment
const BRAND_LEFT_PX = 15; // base offset from the left edge
const BRAND_LEFT_EXTRA = 0.04; // + 4% of screen width (moved 1% right)

function GoogleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <Path fill="none" d="M0 0h48v48H0z" />
    </Svg>
  );
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [step, setStep] = useState(1); // 1 = Login, 2 = UserName, 3 = Character, 4 = Story Adventure
  const [storyName, setStoryName] = useState('');
  const [activeCharacter, setActiveCharacter] = useState(null);
  const { width, height } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Inter_500Medium, Inter_800ExtraBold });

  // Hook into Google OAuth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken || response.params?.access_token;
      if (token) {
        fetchGoogleUser(token);
      }
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    } else if (response?.type === 'error') {
      setLoading(false);
      Alert.alert('Sign In Error', response.error?.message || 'Authentication failed');
    }
  }, [response]);

  const fetchGoogleUser = async (token) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();
      setUserInfo(user);
      setStep(2);
      setLoading(false);
      Alert.alert('Signed In', `Welcome back, ${user.name || user.email}!`);
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Failed to fetch user profile from Google.');
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result?.type !== 'success') {
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Unable to open Google sign-in window.');
    }
  };

  const handleSignOut = () => {
    setUserInfo(null);
    setStep(1);
  };

  // Lifted upwards (+17% of screen height) into the sunlit stone courtyard
  const baseBottom = Platform.OS === 'ios' ? 36 : 48;
  const buttonBottom = baseBottom + height * 0.17;

  // Page Four: Story Adventure & Merchandise Hub
  if (step === 4) {
    return (
      <StoryAdventureScreen
        character={activeCharacter || getActiveCharacter(userInfo, storyName)}
        userInfo={userInfo}
        storyName={storyName}
        onBack={() => setStep(3)}
        onNavigateStory={(questTitle) => {
          Alert.alert(
            'Story Chapter Unlocked! 📖',
            `Embarking on "${questTitle}" with ${activeCharacter?.name || 'your companion'}!\n\nTheir visual DNA is locked for seamless story illustrations.`
          );
        }}
        onNavigateMerch={() => {
          Alert.alert(
            'Merchandise Studio 👕',
            `Custom stickers, apparel, and storybooks for ${activeCharacter?.name || 'your companion'} are ready!`
          );
        }}
      />
    );
  }

  // Page Three: Character Generation Page
  if (step === 3) {
    return (
      <CharacterScreen
        userInfo={userInfo}
        storyName={storyName}
        onBack={() => setStep(2)}
        onComplete={(characterData) => {
          setActiveCharacter(characterData);
          setStep(4);
        }}
      />
    );
  }

  // Page Two: User Name Screen
  if (step === 2) {
    return (
      <UserNameScreen
        initialName={userInfo?.name || storyName || ''}
        onBack={() => {
          if (userInfo) handleSignOut();
          else setStep(1);
        }}
        onContinue={(chosenName) => {
          setStoryName(chosenName || userInfo?.name || 'Explorer');
          setStep(3);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent />
      <ImageBackground
        source={require('./assets/background.webp')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {fontsLoaded && (
          <View
            style={[
              styles.brand,
              {
                top: height * BRAND_TOP,
                ...(BRAND_CENTER
                  ? { left: 0, right: 0, alignItems: 'center' }
                  : { left: BRAND_LEFT_PX + width * BRAND_LEFT_EXTRA }),
              },
            ]}
          >
            <BrandLogo />
          </View>
        )}

        <View style={[styles.buttonContainer, { bottom: buttonBottom }]}>
          {fontsLoaded && <WelcomeBack />}
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.88}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1F2937" size="small" />
            ) : (
              <>
                <GoogleIcon />
                <Text style={styles.buttonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  brand: {
    position: 'absolute',
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    gap: 12,
  },
  buttonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  signedInContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  userAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signOutButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});
