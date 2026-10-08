import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import HandwrittenWord from './HandwrittenWord';
import scriptPaths from './scriptPaths';

const INK = '#1B2A4A';
const WRITE_DURATION = 2400; // total time to "hand-write" Literacy
const SCALE = 0.95; // overall size of the brand block (0.95 = 5% smaller)
const LITERACY_HEIGHT = 30 * SCALE;

export default function BrandLogo() {
  const logo = useRef(new Animated.Value(0)).current;
  const ai = useRef(new Animated.Value(0)).current;
  const write = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logo, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.6)), useNativeDriver: false }),
      Animated.timing(ai, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(write, { toValue: 1, duration: WRITE_DURATION, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/logo.png')}
        style={[
          styles.logo,
          { opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] },
        ]}
        resizeMode="contain"
      />
      <View style={styles.brandRow}>
        <Animated.Text
          style={[
            styles.ai,
            { opacity: ai, transform: [{ translateY: ai.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] },
          ]}
        >
          AI
        </Animated.Text>
        <HandwrittenWord data={scriptPaths.Literacy} progress={write} height={LITERACY_HEIGHT} color={INK} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center', // centers the logo above AI Literacy
  },
  logo: {
    width: 36 * SCALE,
    height: 36 * SCALE,
    marginBottom: 4 * SCALE,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ai: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 17 * SCALE,
    color: INK,
    letterSpacing: 0.5,
    marginRight: 3 * SCALE,
  },
});
