import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { id: 'list',   icon: 'list-outline', activeIcon: 'list', label: '목록' },
  { id: 'peds',   icon: 'medical-outline', activeIcon: 'medical', label: '소아/야간' },
  { id: 'map',    icon: 'map-outline', activeIcon: 'map', label: '지도' },
  { id: 'golden', icon: 'flash-outline', activeIcon: 'flash', label: '골든타임' },
  { id: 'profile',icon: 'person-outline', activeIcon: 'person', label: '내정보' },
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
            <Ionicons 
              name={isActive ? tab.activeIcon : tab.icon} 
              size={24} 
              color={isActive ? t.primary : t.textSub} 
            />
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
    paddingTop: 10,
    gap: 4,
  },
  label:     { fontSize: 10, fontWeight: '600' },
  dot:       {
    width: 4, height: 4, borderRadius: 2, marginTop: 2,
  },
});