import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import HandwrittenWord from './HandwrittenWord';
import scriptPaths from './scriptPaths';

// Slightly transparent dark-slate ink with a crisp light bottom highlight for the engraved/debossed look
const INK = 'rgba(28, 40, 62, 0.62)';
const HIGHLIGHT = 'rgba(255, 255, 255, 0.72)';
const BACK_HEIGHT = 27;
const START_DELAY = 450; // starts shortly after screen renders
const WRITE_DURATION = 1400; // cursive draw-on duration for "Back"

export default function WelcomeBack() {
  const welcome = useRef(new Animated.Value(0)).current;
  const write = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(START_DELAY),
      Animated.timing(welcome, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(write, {
        toValue: 1,
        duration: WRITE_DURATION,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.welcome,
          {
            opacity: welcome,
            transform: [
              {
                translateY: welcome.interpolate({
                  inputRange: [0, 1],
                  outputRange: [5, 0],
                }),
              },
            ],
          },
        ]}
      >
        Welcome
      </Animated.Text>
      <View style={styles.scriptWrapper}>
        <HandwrittenWord
          data={scriptPaths.Back}
          progress={write}
          height={BACK_HEIGHT}
          color={INK}
          highlight={HIGHLIGHT}
          strokeWidth={2.4}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcome: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: INK,
    letterSpacing: 0.6,
    marginRight: 5,
    // Deboss effect: light highlight immediately below creates an engraved illusion
    textShadowColor: HIGHLIGHT,
    textShadowOffset: { width: 0, height: 1.2 },
    textShadowRadius: 0.8,
  },
  scriptWrapper: {
    // Slight vertical nudge to align baseline with block "Welcome"
    marginTop: -2,
  },
});
