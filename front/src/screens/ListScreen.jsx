import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import HospitalCard from '../components/HospitalCard';
import { HOSPITALS } from '../constants/hospitals';
import { Ionicons } from '@expo/vector-icons';

const FILTERS = [
  { value: 'all',   label: '전체', icon: null },
  { value: 'fav',   label: '즐겨찾기', icon: 'star' },
  { value: 'green', label: '여유', icon: 'ellipse' },
  { value: 'peds',  label: '소아', icon: 'medical' },
];

export default function ListScreen() {
  const { theme: t } = useTheme();
  const [filter, setFilter] = useState('all');

  const filtered = HOSPITALS.filter(h => {
    if (filter === 'fav')   return h.fav;
    if (filter === 'green') return h.level === 'green';
    if (filter === 'peds')  return h.peds;
    return true;
  });

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      {/* 칩 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
        style={[s.chipBar, { backgroundColor: t.bg, borderBottomColor: t.border }]}
      >
        {FILTERS.map(f => {
          const active = filter === f.value;
          const iconColor = f.value === 'green' ? '#2ECC71' : (active ? t.chipActiveTxt : t.textSub);
          
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[
                s.chip,
                {
                  backgroundColor: active ? t.chipActive  : t.bgSecondary,
                  borderColor:     active ? t.chipBorder  : t.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={s.chipContent}>
                {f.icon && (
                  <Ionicons 
                    name={f.icon} 
                    size={14} 
                    color={iconColor} 
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text style={[s.chipTxt, { color: active ? t.chipActiveTxt : t.textSub }]}>
                  {f.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 목록 */}
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={[s.empty, { color: t.textSub }]}>해당 조건의 병원이 없습니다.</Text>
        ) : (
          filtered.map(h => <HospitalCard key={h.id} hospital={h} />)
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  chipBar:   { borderBottomWidth: 0.5, maxHeight: 52 },
  chips:     { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  chipContent: { flexDirection: 'row', alignItems: 'center' },
  chipTxt:   { fontSize: 12, fontWeight: '500' },
  list:      { padding: 12 },
  empty:     { textAlign: 'center', marginTop: 40, fontSize: 14 },
});