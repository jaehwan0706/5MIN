import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function SplashScreen({ onFinish }) {
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    // 각 점: delay → 밝아짐(300ms) → 어두워짐(300ms) → 나머지 대기 → 반복
    const makeDot = (value, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1,    duration: 300, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.25, duration: 300, useNativeDriver: true }),
          Animated.delay(1200 - 600 - delay),
        ])
      );

    const a1 = makeDot(dot1, 0);
    const a2 = makeDot(dot2, 300);
    const a3 = makeDot(dot3, 600);

    a1.start();
    a2.start();
    a3.start();

    const timer = setTimeout(onFinish, 2500);

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={s.container}>
      <View style={s.logoCircle}>
        <MaterialIcons name="local-hospital" size={52} color="#E24B4A" />
      </View>
      <Text style={s.title}>응급실 안내</Text>
      <Text style={s.subtitle}>가장 가까운 응급실을 빠르게</Text>

      <View style={s.dotsRow}>
        {[dot1, dot2, dot3].map((anim, i) => (
          <Animated.View key={i} style={[s.dot, { opacity: anim }]} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  title:    { fontSize: 22, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  dotsRow:  { flexDirection: 'row', gap: 8, marginTop: 32 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
