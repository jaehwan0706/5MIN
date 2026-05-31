import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SYMPTOMS } from '../constants/hospitals';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function GoldenScreen() {
  const { theme: t } = useTheme();
  const [selectedSym, setSelectedSym] = useState(null);

  const handleSelect = symptom => {
    setSelectedSym(symptom.id === selectedSym?.id ? null : symptom);
  };

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: t.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 안내 배너 */}
      <View style={s.banner}>
        <Text style={s.bannerTxt}>증상을 선택하면 즉시 실천 가능한 응급처치 가이드를 확인합니다.</Text>
      </View>

      {/* 증상 버튼 2열 */}
      <View style={s.grid}>
        {SYMPTOMS.map(sym => {
          const active = selectedSym?.id === sym.id;
          return (
            <TouchableOpacity
              key={sym.id}
              style={[
                s.symBtn,
                {
                  backgroundColor: active ? '#FCEBEB' : t.bgSecondary,
                  borderColor:     active ? '#E24B4A' : t.border,
                },
              ]}
              onPress={() => handleSelect(sym)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons 
                name={sym.icon} 
                size={32} 
                color={active ? '#E24B4A' : t.text} 
              />
              <Text style={[s.symLabel, { color: t.text }]}>{sym.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 응급처치 가이드 카드 */}
      {selectedSym && (
        <View style={[s.guideCard, { backgroundColor: t.bgCard, borderColor: t.border }]}>
          <View style={s.guideHeader}>
            <View style={s.guideHeaderRow}>
              <Ionicons name="medical" size={16} color="#791F1F" />
              <Text style={s.guideHeaderTxt}>{selectedSym.label} 응급처치 가이드</Text>
            </View>
          </View>
          <View style={s.guideBody}>
            <Text style={[s.guideTxt, { color: t.text }]}>{selectedSym.guide}</Text>
          </View>
          <View style={s.warnFooter}>
            <Ionicons name="alert-circle" size={14} color="#791F1F" />
            <Text style={s.warnFooterTxt}>이 가이드는 참고용이며, 반드시 119 신고가 우선입니다.</Text>
          </View>
        </View>
      )}

      {/* 메디컬 ID 바코드 */}
      <View style={[s.barcodeCard, { backgroundColor: t.bgSecondary, borderColor: t.border }]}>
        <View style={s.barcodeHeader}>
          <Ionicons name="id-card-outline" size={18} color={t.text} />
          <Text style={[s.barcodeTitle, { color: t.text }]}>메디컬 ID 바코드</Text>
        </View>
        <View style={s.barcodeStripes}>
          {Array.from({ length: 36 }, (_, i) => (
            <View
              key={i}
              style={[
                s.stripe,
                { height: [3,5,2,4,3,6,2,4,3,5,2,3,4,5,2,3,6,2,4,3,5,2,4,3,2,5,3,4,2,6,3,2,5,4,3,2][i] * 6 },
                { backgroundColor: t.text },
              ]}
            />
          ))}
        </View>
        <Text style={[s.barcodeDesc, { color: t.textSub }]}>
          응급대원에게 스캔 — 혈액형·알레르기·지병 즉시 확인
        </Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:       { flex: 1 },
  content:      { padding: 12, gap: 12 },
  banner:       { backgroundColor: '#FCEBEB', borderRadius: 10, padding: 10 },
  bannerTxt:    { fontSize: 12, color: '#791F1F' },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symBtn:       {
    width: '48.5%', borderRadius: 10, borderWidth: 1,
    padding: 14, alignItems: 'center', gap: 8,
  },
  symLabel:     { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  guideCard:    { borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  guideHeader:  { backgroundColor: '#FCEBEB', padding: 10 },
  guideHeaderRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  guideHeaderTxt:{ fontSize: 12, fontWeight: '700', color: '#791F1F' },
  guideBody:    { padding: 14 },
  guideTxt:     { fontSize: 14, lineHeight: 22 },
  warnFooter:   { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 10, borderTopWidth: 0.5, borderTopColor: '#eee', backgroundColor: '#fffafb' },
  warnFooterTxt:{ fontSize: 11, color: '#791F1F', fontWeight: '500' },
  barcodeCard:  { borderRadius: 12, borderWidth: 0.5, padding: 14 },
  barcodeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  barcodeTitle: { fontSize: 13, fontWeight: '600' },
  barcodeStripes:{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  stripe:       { width: 5, borderRadius: 1 },
  barcodeDesc:  { fontSize: 11, textAlign: 'center' },
});