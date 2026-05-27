import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LEVEL_COLOR, LEVEL_BG, LEVEL_LABEL } from '../constants/hospitals';

export default function HospitalCard({ hospital: h, compact = false }) {
  const { theme: t } = useTheme();

  const call = () => {
    const url = `tel:${h.tel}`;
    Linking.canOpenURL(url)
      .then(ok => ok ? Linking.openURL(url) : Alert.alert('오류', '전화 연결이 불가합니다.'))
      .catch(() => Alert.alert('오류', '전화 연결에 실패했습니다.'));
  };

  return (
    <View style={[s.card, { backgroundColor: t.bgCard, borderColor: t.border }]}>
      {h.warning && (
        <View style={s.warnBanner}>
          <Text style={s.warnText}>⚠️ {h.warning}</Text>
        </View>
      )}
      <View style={s.row}>
        <View style={s.info}>
          <View style={s.nameRow}>
            <Text style={[s.name, { color: t.text }]}>{h.name}</Text>
            {h.moonBadge && (
              <View style={s.moonBadge}>
                <Text style={s.moonBadgeTxt}>달빛어린이</Text>
              </View>
            )}
            {h.fav && <Text style={s.star}>⭐</Text>}
          </View>
          <View style={s.metaRow}>
            <Text style={[s.meta, { color: t.textSub }]}>📍 {h.dist}</Text>
            <Text style={[s.meta, { color: t.textSub }]}>⏱ {h.wait}분</Text>
            <Text style={[s.meta, { color: t.textSub }]}>🛏 {h.beds}병상</Text>
          </View>
        </View>
        <View style={s.right}>
          <View style={[s.levelBadge, { backgroundColor: LEVEL_BG[h.level] }]}>
            <Text style={[s.levelTxt, { color: LEVEL_COLOR[h.level] }]}>
              {LEVEL_LABEL[h.level]}
            </Text>
          </View>
          <TouchableOpacity
            style={[s.callBtn, { backgroundColor: LEVEL_COLOR.green }]}
            onPress={call}
            activeOpacity={0.8}
          >
            <Text style={s.callTxt}>📞 전화</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:       { borderRadius: 12, borderWidth: 0.5, padding: 12, marginBottom: 8 },
  warnBanner: { backgroundColor: '#FAEEDA', borderRadius: 6, padding: 6, marginBottom: 8 },
  warnText:   { fontSize: 11, color: '#633806' },
  row:        { flexDirection: 'row', alignItems: 'center' },
  info:       { flex: 1 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name:       { fontSize: 14, fontWeight: '600' },
  moonBadge:  { backgroundColor: '#E6F1FB', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 },
  moonBadgeTxt:{ fontSize: 10, color: '#0C447C', fontWeight: '500' },
  star:       { fontSize: 12 },
  metaRow:    { flexDirection: 'row', gap: 8 },
  meta:       { fontSize: 12 },
  right:      { alignItems: 'flex-end', gap: 6 },
  levelBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  levelTxt:   { fontSize: 11, fontWeight: '600' },
  callBtn:    { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  callTxt:    { color: '#fff', fontSize: 13, fontWeight: '600' },
});