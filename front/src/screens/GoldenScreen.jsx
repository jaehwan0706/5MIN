import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SYMPTOMS } from '../constants/hospitals';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const ANTHROPIC_KEY = 'YOUR_ANTHROPIC_API_KEY'; // 실제 키로 교체

export default function GoldenScreen() {
  const { theme: t } = useTheme();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [guide, setGuide]       = useState('');

  const askClaude = async symptom => {
    setSelected(symptom.id);
    setLoading(true);
    setGuide('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `응급상황: ${symptom.label}. 구급대원 도착 전까지 현장에서 할 수 있는 응급처치 가이드를 단계별로 간결하게 한국어로 알려주세요. 3~5단계, 각 단계는 1~2문장으로 짧게.`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(i => i.text || '').join('\n') || '응답을 받지 못했습니다.';
      setGuide(text);
    } catch {
      setGuide('네트워크 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={[s.scroll, { backgroundColor: t.bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 안내 배너 */}
      <View style={s.banner}>
        <Text style={s.bannerTxt}>증상을 선택하면 Claude가 응급처치 가이드를 안내합니다.</Text>
      </View>

      {/* 증상 버튼 2열 */}
      <View style={s.grid}>
        {SYMPTOMS.map(sym => {
          const active = selected === sym.id;
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
              onPress={() => askClaude(sym)}
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

      {/* Claude 가이드 */}
      {(loading || guide) && (
        <View style={[s.guideCard, { backgroundColor: t.bgCard, borderColor: t.border }]}>
          <View style={s.guideHeader}>
            <View style={s.guideHeaderRow}>
              <Ionicons name="sparkles" size={16} color="#791F1F" />
              <Text style={s.guideHeaderTxt}>Claude 응급처치 가이드</Text>
            </View>
          </View>
          {loading
            ? <ActivityIndicator color="#E24B4A" style={{ marginVertical: 16 }} />
            : <Text style={[s.guideTxt, { color: t.text }]}>{guide}</Text>
          }
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
    width: '48%', borderRadius: 10, borderWidth: 1,
    padding: 14, alignItems: 'center', gap: 8,
  },
  symLabel:     { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  guideCard:    { borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  guideHeader:  { backgroundColor: '#FCEBEB', padding: 10 },
  guideHeaderRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  guideHeaderTxt:{ fontSize: 12, fontWeight: '700', color: '#791F1F' },
  guideTxt:     { fontSize: 13, lineHeight: 21, padding: 12 },
  barcodeCard:  { borderRadius: 12, borderWidth: 0.5, padding: 14 },
  barcodeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  barcodeTitle: { fontSize: 13, fontWeight: '600' },
  barcodeStripes:{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  stripe:       { width: 5, borderRadius: 1 },
  barcodeDesc:  { fontSize: 11, textAlign: 'center' },
});