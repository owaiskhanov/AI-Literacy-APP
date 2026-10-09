import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { formatStoryScenePrompt, formatMerchandiseSpecs } from '../services/characterStorage';

export default function StoryAdventureScreen({
  character,
  userInfo,
  storyName,
  onBack,
  onNavigateStory,
  onNavigateMerch,
}) {
  const { width, height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState('story'); // 'story' | 'merch'

  const ownerName = userInfo?.name || storyName || character?.accountOwner?.name || 'Explorer';
  const charName = character?.name || 'Enchanted Companion';
  const avatarUri = character?.avatarUri;

  const stickerSpec = formatMerchandiseSpecs(character, 'sticker');
  const tshirtSpec = formatMerchandiseSpecs(character, 'tshirt');
  const bookSpec = formatMerchandiseSpecs(character, 'storybook');

  const serifFont = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: '"Playfair Display", Georgia, serif',
    default: 'serif',
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <ImageBackground
        source={require('../assets/characterStageRockBg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
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

          <View style={styles.accountBadge}>
            <Text style={styles.accountBadgeText}>🎒 {ownerName}'s Account</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title */}
          <View style={styles.headerTitleBox}>
            <Text style={[styles.mainTitle, { fontFamily: serifFont }]}>
              Screen 4: Adventure Hub
            </Text>
            <Text style={styles.subTitle}>
              Your finalized character is safely stored in your account!
            </Text>
          </View>

          {/* Hero Character Showcase Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.heroAvatar} />
            ) : (
              <View style={[styles.heroAvatar, styles.placeholderAvatar]}>
                <Text style={{ fontSize: 40 }}>✨</Text>
              </View>
            )}

            <View style={styles.heroDetails}>
              <View style={styles.savedPill}>
                <Text style={styles.savedPillText}>🔒 Saved to Account</Text>
              </View>
              <Text style={styles.heroName}>{charName}</Text>
              <Text style={styles.heroQuote}>"{character?.talkBubble || 'Ready for adventure!'}"</Text>

              {character?.signatureItem ? (
                <Text style={styles.signatureText}>
                  ✨ Signature Item: <Text style={{ fontWeight: '700' }}>{character.signatureItem}</Text>
                </Text>
              ) : null}

              {/* Trait Tags */}
              <View style={styles.traitsRow}>
                {(character?.traits || ['Mythical', 'Brave', 'Kind']).map((trait, i) => (
                  <View key={i} style={styles.traitChip}>
                    <Text style={styles.traitChipText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Tabs: Story Mode vs Merchandise Studio */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'story' && styles.tabButtonActive]}
              onPress={() => setActiveTab('story')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'story' && styles.tabButtonTextActive]}>
                📖 Story Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'merch' && styles.tabButtonActive]}
              onPress={() => setActiveTab('merch')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabButtonText, activeTab === 'merch' && styles.tabButtonTextActive]}>
                👕 Merchandise Studio
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: STORY MODE */}
          {activeTab === 'story' && (
            <View style={styles.sectionContainer}>
              <View style={styles.featureCallout}>
                <Text style={styles.featureCalloutTitle}>🎯 100% Visual Consistency Locked</Text>
                <Text style={styles.featureCalloutText}>
                  The AI stores {charName}'s exact visual description so they will look identical throughout every chapter of your adventure!
                </Text>
              </View>

              <Text style={styles.sectionHeading}>Pick Your Next Story Quest:</Text>

              <TouchableOpacity
                style={styles.questCard}
                onPress={() => onNavigateStory && onNavigateStory('The Enchanted Crystal Caverns')}
                activeOpacity={0.85}
              >
                <Text style={styles.questIcon}>💎</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.questTitle}>The Crystal Caverns</Text>
                  <Text style={styles.questDesc}>
                    {charName} explores an underground realm of singing crystals.
                  </Text>
                </View>
                <Text style={styles.questArrow}>➜</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.questCard}
                onPress={() => onNavigateStory && onNavigateStory('Island of the Whispering Wind')}
                activeOpacity={0.85}
              >
                <Text style={styles.questIcon}>🌊</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.questTitle}>Whispering Ocean Isle</Text>
                  <Text style={styles.questDesc}>
                    {charName} sets sail to uncover ancient star secrets across the sea.
                  </Text>
                </View>
                <Text style={styles.questArrow}>➜</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.questCard}
                onPress={() => onNavigateStory && onNavigateStory('Castle in the Starlight Clouds')}
                activeOpacity={0.85}
              >
                <Text style={styles.questIcon}>☁️</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.questTitle}>Cloud Castle in the Stars</Text>
                  <Text style={styles.questDesc}>
                    A celestial journey into the clouds to restore moonlight to the kingdom.
                  </Text>
                </View>
                <Text style={styles.questArrow}>➜</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 2: MERCHANDISE STUDIO */}
          {activeTab === 'merch' && (
            <View style={styles.sectionContainer}>
              <View style={styles.featureCallout}>
                <Text style={styles.featureCalloutTitle}>✨ High-Res Transparent PNG Ready</Text>
                <Text style={styles.featureCalloutText}>
                  Because {charName} was generated without a background, their cutout is ready for high-quality printing!
                </Text>
              </View>

              <Text style={styles.sectionHeading}>Merchandise Mockups:</Text>

              {/* Sticker Item */}
              <View style={styles.merchCard}>
                <View style={styles.merchThumbBox}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.merchThumb} />
                  ) : null}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.merchTitle}>🏷️ Die-Cut Holographic Sticker</Text>
                  <Text style={styles.merchSub}>
                    Transparent outline with rainbow foil rim and protective gloss.
                  </Text>
                  <Text style={styles.merchTag}>Ready to Print • High-Res RGBA</Text>
                </View>
              </View>

              {/* T-Shirt Item */}
              <View style={styles.merchCard}>
                <View style={[styles.merchThumbBox, { backgroundColor: '#1E293B' }]}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={[styles.merchThumb, { width: 44, height: 44 }]} />
                  ) : null}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.merchTitle}>👕 Custom Adventure T-Shirt</Text>
                  <Text style={styles.merchSub}>
                    Direct-to-garment print with "{charName}" signature badge.
                  </Text>
                  <Text style={styles.merchTag}>Front Graphic • Organic Cotton</Text>
                </View>
              </View>

              {/* Storybook Cover Item */}
              <View style={styles.merchCard}>
                <View style={[styles.merchThumbBox, { backgroundColor: '#FDF6E2' }]}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={[styles.merchThumb, { width: 46, height: 46 }]} />
                  ) : null}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.merchTitle}>📕 Hardcover Storybook Cover</Text>
                  <Text style={styles.merchSub}>
                    Personalized bedtime storybook starring {charName} & {ownerName}.
                  </Text>
                  <Text style={styles.merchTag}>Gold Foil Embossed • Illustrated</Text>
                </View>
              </View>
            </View>
          )}

          {/* Edit Character Option */}
          <TouchableOpacity style={styles.editCharacterBtn} onPress={onBack} activeOpacity={0.75}>
            <Text style={styles.editCharacterBtnText}>✏️ Edit or Summon a New Character</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1C3E',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 28, 62, 0.72)',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  accountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
    marginTop: 100,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTitleBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    maxWidth: 320,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#D7C3AA',
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  heroAvatar: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  placeholderAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDetails: {
    flex: 1,
    marginLeft: 14,
  },
  savedPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  savedPillText: {
    color: '#15803D',
    fontSize: 10.5,
    fontWeight: '700',
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A1C3E',
    marginBottom: 2,
  },
  heroQuote: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#556882',
    marginBottom: 6,
    lineHeight: 15,
  },
  signatureText: {
    fontSize: 11,
    color: '#2563EB',
    marginBottom: 6,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  traitChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  traitChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4338CA',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabButtonTextActive: {
    color: '#0A1C3E',
    fontWeight: '700',
  },
  sectionContainer: {
    gap: 12,
  },
  featureCallout: {
    backgroundColor: 'rgba(30, 58, 138, 0.65)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#60A5FA',
    marginBottom: 6,
  },
  featureCalloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#93C5FD',
    marginBottom: 4,
  },
  featureCalloutText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FDE68A',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  questCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  questIcon: {
    fontSize: 26,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A1C3E',
    marginBottom: 2,
  },
  questDesc: {
    fontSize: 11.5,
    color: '#556882',
    lineHeight: 15,
  },
  questArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
    marginLeft: 8,
  },
  merchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  merchThumbBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  merchThumb: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  merchTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0A1C3E',
    marginBottom: 2,
  },
  merchSub: {
    fontSize: 11,
    color: '#556882',
    lineHeight: 14,
    marginBottom: 4,
  },
  merchTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  editCharacterBtn: {
    alignSelf: 'center',
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  editCharacterBtnText: {
    color: '#FDE68A',
    fontSize: 12.5,
    fontWeight: '600',
  },
});
