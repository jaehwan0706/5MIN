import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const TABS = [
  { id: 'list',   icon: '📋', label: '목록' },
  { id: 'peds',   icon: '👶', label: '소아/야간' },
  { id: 'map',    icon: '📍', label: '지도' },
  { id: 'golden', icon: '🚨', label: '골든타임' },
  { id: 'profile',icon: '👤', label: '내정보' },
];

export default function BottomNav({ active, onPress }) {
  const { theme: t } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      s.nav,
      {
        backgroundColor: t.navBg,
        borderTopColor: t.navBorder,
        paddingBottom: insets.bottom || 16,
      }
    ]}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            style={s.item}
            onPress={() => onPress(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[s.icon, tab.id === 'map' && s.iconLarge]}>
              {tab.icon}
            </Text>
            <Text style={[s.label, { color: isActive ? t.primary : t.textSub }]}>
              {tab.label}
            </Text>
            {isActive && (
              <View style={[s.dot, { backgroundColor: t.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  nav:       {
    flexDirection: 'row',
    borderTopWidth: 0.5,
  },
  item:      {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
    gap: 2,
  },
  icon:      { fontSize: 20 },
  iconLarge: { fontSize: 24 },
  label:     { fontSize: 10, fontWeight: '500' },
  dot:       {
    width: 4, height: 4, borderRadius: 2, marginTop: 2,
  },
});