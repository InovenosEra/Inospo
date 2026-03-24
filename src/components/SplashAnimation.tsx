import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import InospoLogo from './InospoLogo';

interface Props {
  onFinish: () => void;
}

const LOGO_SIZE = 162;

export default function SplashAnimation({ onFinish }: Props) {
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.3)).current;
  const ringScale    = useRef(new Animated.Value(0.65)).current;
  const ringOpacity  = useRef(new Animated.Value(0.85)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(14)).current;
  const containerOp  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Badge springs in + ripple ring expands outward simultaneously
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 52,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(ringScale, {
          toValue: 2.6,
          duration: 950,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 950,
          useNativeDriver: true,
        }),
      ]),
      // 2. Tagline slides up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
      // 3. Hold
      Animated.delay(800),
      // 4. Fade out to reveal app
      Animated.timing(containerOp, {
        toValue: 0,
        duration: 460,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOp }]}>

      {/* Ripple ring — expands outward from the badge */}
      <Animated.View
        style={[
          styles.ring,
          { transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />

      {/* Badge logo */}
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <InospoLogo size={LOGO_SIZE} />
      </Animated.View>

      {/* Tagline below the badge */}
      <Animated.Text
        style={[
          styles.tagline,
          { opacity: textOpacity, transform: [{ translateY: textTranslate }] },
        ]}
      >
        WORLD CUP 2026
      </Animated.Text>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  ring: {
    position: 'absolute',
    width: LOGO_SIZE + 8,
    height: LOGO_SIZE + 8,
    borderRadius: (LOGO_SIZE + 8) / 2,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  tagline: {
    marginTop: 28,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 5,
    color: 'rgba(212, 175, 55, 0.45)',
  },
});
