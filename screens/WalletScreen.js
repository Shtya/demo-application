import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SectionList,
  Dimensions, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, interpolate, Extrapolation, withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ─── BRAND CONSTANTS ────────────────────────────────────────────────────────────
const COLORS = {
  primary:        '#FFC107',
  primaryDark:    '#FF8F00',
  primaryLight:   '#FFF8E1',
  secondary:      '#B8975A',
  secondaryDark:  '#7A5C2E',
  secondaryLight: '#F3EDE0',
  bg:             '#FAF7F2',
  surface:        '#FFFFFF',
  surfaceAlt:     '#F3EDE0',
  text:           '#1A0F00',
  textSub:        '#7A5C2E',
  textMuted:      '#B8975A',
  border:         '#E8DCC8',
  borderStrong:   '#B8975A',
  dark:           '#3D2B00',
  darkMid:        '#5C3D00',
  success:        '#2E7D32',
  successLight:   '#E8F5E9',
  error:          '#C62828',
  errorLight:     '#FDECEA',
  info:           '#1565C0',
  infoLight:      '#E3F2FD',
  warning:        '#E65100',
  warningLight:   '#FBE9E7',
};

const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const RADIUS  = { sm: 8, md: 12, lg: 20, xl: 28, full: 999 };
const SHADOW  = {
  card:  { shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  float: { shadowColor: '#FFC107', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 },
};
const ANIM = {
  spring:     { damping: 16, stiffness: 160 },
  springFast: { damping: 12, stiffness: 200 },
  springSlow: { damping: 20, stiffness: 120 },
  duration:   { fast: 150, normal: 280, slow: 450 },
};

const { width: W } = Dimensions.get('window');

// ─── FAKE DATA ───────────────────────────────────────────────────────────────────
const BALANCE = 1250;

const TRANSACTIONS = [
  {
    title: 'Today',
    data: [
      { id: 'T1', type: 'debit',  icon: 'bag-handle-outline',      label: 'Burger Express', sub: 'Order ORD-884521', amount: 350,  time: '12:35 PM' },
      { id: 'T2', type: 'credit', icon: 'cash-outline',             label: 'Top Up',         sub: 'Via Visa •• 4321', amount: 500,  time: '10:00 AM' },
    ],
  },
  {
    title: 'Yesterday',
    data: [
      { id: 'T3', type: 'debit',  icon: 'bag-handle-outline',      label: 'PharmaCare',     sub: 'Order ORD-550119', amount: 165,  time: '03:20 PM' },
      { id: 'T4', type: 'credit', icon: 'gift-outline',             label: 'Cashback',       sub: 'Loyalty Reward',  amount: 25,   time: '03:21 PM' },
      { id: 'T5', type: 'debit',  icon: 'bag-handle-outline',      label: 'Green Market',   sub: 'Order ORD-772310', amount: 195,  time: '01:15 PM' },
    ],
  },
  {
    title: 'May 5',
    data: [
      { id: 'T6', type: 'debit',  icon: 'bag-handle-outline',      label: 'Organic Shop',   sub: 'Order ORD-661230', amount: 225,  time: '11:40 AM' },
      { id: 'T7', type: 'credit', icon: 'cash-outline',             label: 'Top Up',         sub: 'Via InstaPay',    amount: 1000, time: '09:00 AM' },
    ],
  },
  {
    title: 'Apr 28',
    data: [
      { id: 'T8', type: 'debit',  icon: 'bag-handle-outline',      label: 'TechZone',       sub: 'Order ORD-441008', amount: 75,   time: '06:00 PM' },
      { id: 'T9', type: 'credit', icon: 'swap-horizontal-outline', label: 'Refund',         sub: 'Order ORD-330777', amount: 140,  time: '04:10 PM' },
    ],
  },
];

const TOP_UP_AMOUNTS = [100, 200, 500, 1000];

const fmt = (n) => `QAR ${n.toLocaleString()}`;

// ─── usePress HOOK ───────────────────────────────────────────────────────────────
const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// ─── BALANCE CARD ─────────────────────────────────────────────────────────────────
const BalanceCard = ({ balance }) => {
  const shimX = useSharedValue(-W);
  useEffect(() => {
    shimX.value = withRepeat(withTiming(W, { duration: 2400 }), -1, false);
  }, []);
  const shimStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimX.value }] }));

  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = balance / 50;
    const interval = setInterval(() => {
      cur += step;
      if (cur >= balance) { setDisplay(balance); clearInterval(interval); }
      else setDisplay(Math.floor(cur));
    }, 28);
    return () => clearInterval(interval);
  }, []);

  const cardScale = useSharedValue(0.94);
  const cardOp    = useSharedValue(0);
  useEffect(() => {
    cardScale.value = withSpring(1, ANIM.springSlow);
    cardOp.value    = withTiming(1, { duration: ANIM.duration.slow });
  }, []);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOp.value,
  }));

  const intPart = Math.floor(display).toLocaleString();
  const parts   = intPart.split(',');

  return (
    <Animated.View style={[bc.wrap, cardStyle]}>
      <LinearGradient
        colors={['#1C1A10', '#2A2418', '#33291C']}
        style={bc.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Shimmer */}
        <Animated.View style={[bc.shim, shimStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(250,247,242,0.06)', 'transparent']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>

        {/* Decorative rings */}
        <View style={bc.ring1} />
        <View style={bc.ring2} />

        {/* Header row */}
        <View style={bc.headerRow}>
          <View style={bc.brandPill}>
            <Ionicons name="flash" size={12} color={COLORS.primary} />
            <Text style={bc.brandTxt}>Quick Wallet</Text>
          </View>
          <View style={bc.securedPill}>
            <Ionicons name="shield-checkmark-outline" size={11} color={COLORS.bg} style={{ opacity: 0.55 }} />
            <Text style={bc.securedTxt}>Secured</Text>
          </View>
        </View>

        {/* Balance */}
        <Text style={bc.availableLabel}>Available Balance</Text>
        <View style={bc.balanceRow}>
          <Text style={bc.currency}>QAR</Text>
          <Text style={bc.balance}>{parts.join(',')}</Text>
        </View>

        {/* Divider */}
        <View style={bc.divider} />

        {/* Footer chips */}
        <View style={bc.footerRow}>
          <View style={bc.footerItem}>
            <Text style={bc.footerLabel}>Account</Text>
            <Text style={bc.footerValue}>SWF-4829</Text>
          </View>
          <View style={bc.footerDot} />
          <View style={bc.footerItem}>
            <Text style={bc.footerLabel}>Status</Text>
            <Text style={[bc.footerValue, { color: COLORS.primary }]}>Active</Text>
          </View>
          <View style={bc.footerDot} />
          <View style={bc.footerItem}>
            <Text style={bc.footerLabel}>Tier</Text>
            <Text style={bc.footerValue}>Gold</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ─── ACTION BUTTON ───────────────────────────────────────────────────────────────
const ActionBtn = ({ icon, label, onPress, index = 0 }) => {
  const p = usePress();
  const slideY = useSharedValue(16);
  const opVal  = useSharedValue(0);
  useEffect(() => {
    slideY.value = withDelay(index * 60, withSpring(0,    ANIM.spring));
    opVal.value  = withDelay(index * 60, withTiming(1, { duration: ANIM.duration.normal }));
  }, []);
  const entranceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: opVal.value,
  }));

  return (
    <Animated.View style={[entranceStyle, p.animStyle]}>
      <TouchableOpacity
        style={ab.wrap}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress && onPress();
        }}
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        activeOpacity={1}
      >
        <View style={ab.circle}>
          <Ionicons name={icon} size={22} color={COLORS.text} />
        </View>
        <Text style={ab.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── TOP-UP SHEET ────────────────────────────────────────────────────────────────
const TopUpSheet = ({ visible, onClose }) => {
  const [selected, setSelected] = useState(null);
  const translateY = useSharedValue(420);
  const backdropOp = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0,   ANIM.springSlow);
      backdropOp.value = withTiming(1, { duration: ANIM.duration.normal });
    } else {
      translateY.value = withTiming(420, { duration: ANIM.duration.normal });
      backdropOp.value = withTiming(0,   { duration: ANIM.duration.normal });
    }
  }, [visible]);

  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));

  if (!visible && translateY.value === 420) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(28,26,16,0.55)' }, backdropStyle]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[tus.sheet, sheetStyle]}>
        <View style={tus.handle} />

        <View style={tus.titleRow}>
          <View>
            <Text style={tus.title}>Top Up Wallet</Text>
            <Text style={tus.sub}>Select an amount to add</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={tus.closeBtn}>
            <Ionicons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={tus.grid}>
          {TOP_UP_AMOUNTS.map((amt) => {
            const isSelected = selected === amt;
            return (
              <TouchableOpacity
                key={amt}
                style={[tus.amtBtn, isSelected && tus.amtBtnSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelected(amt);
                }}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={tus.checkDot}>
                    <Ionicons name="checkmark" size={10} color={COLORS.text} />
                  </View>
                )}
                <Text style={[tus.amtTxt, isSelected && tus.amtTxtSelected]}>{fmt(amt)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={tus.confirmBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onClose();
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={tus.confirmGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.text} />
            <Text style={tus.confirmTxt}>Add {selected ? fmt(selected) : 'Amount'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── TRANSACTION ROW ─────────────────────────────────────────────────────────────
const TxRow = ({ item, isLast, index = 0 }) => {
  const isCredit = item.type === 'credit';

  const slideX = useSharedValue(-16);
  const opVal  = useSharedValue(0);
  useEffect(() => {
    slideX.value = withDelay(index * 55, withSpring(0,    ANIM.spring));
    opVal.value  = withDelay(index * 55, withTiming(1, { duration: ANIM.duration.normal }));
  }, []);
  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    opacity: opVal.value,
  }));

  const amtColor     = isCredit ? COLORS.success     : COLORS.textSub;
  const iconBg       = isCredit ? COLORS.successLight : COLORS.surfaceAlt;
  const iconColor    = isCredit ? COLORS.success      : COLORS.secondaryDark;

  return (
    <Animated.View style={[tx.row, !isLast && tx.border, rowStyle]}>
      <View style={[tx.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={item.icon} size={17} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={tx.label}>{item.label}</Text>
        <Text style={tx.sub}>{item.sub} · {item.time}</Text>
      </View>
      <View style={tx.amountCol}>
        <Text style={[tx.amount, { color: amtColor }]}>
          {isCredit ? '+' : '−'}{fmt(item.amount)}
        </Text>
        <View style={[tx.typePill, isCredit ? tx.pillCredit : tx.pillDebit]}>
          <Text style={[tx.pillTxt, isCredit ? tx.pillCreditTxt : tx.pillDebitTxt]}>
            {isCredit ? 'Credit' : 'Debit'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function WalletScreen({ navigation }) {
  const [showTopUp, setShowTopUp] = useState(false);
  const scrollY = useSharedValue(0);

  const headerBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolate(
      scrollY.value,
      [0, 80],
      [0, 1],
      Extrapolation.CLAMP,
    ) > 0.5
      ? `rgba(250,247,242,0.97)`
      : `rgba(250,247,242,0)`,
    borderBottomWidth: interpolate(scrollY.value, [60, 80], [0, 1], Extrapolation.CLAMP),
    borderBottomColor: COLORS.border,
  }));

  const headerTitleStyle = useAnimatedStyle(() => ({
    color: interpolate(scrollY.value, [40, 80], [0, 1], Extrapolation.CLAMP) > 0.5
      ? COLORS.text
      : COLORS.text,
  }));

  return (
    <View style={styles.root}>
      {/* Sticky header overlay */}
      <Animated.View style={[styles.headerOverlay, headerBgStyle]} pointerEvents="none" />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>My Wallet</Text>
          <TouchableOpacity style={styles.historyBtn}>
            <Ionicons name="time-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <SectionList
        sections={TRANSACTIONS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollY.value = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        ListHeaderComponent={() => (
          <>
            <BalanceCard balance={BALANCE} />

            {/* Actions row */}
            <View style={styles.actionsRow}>
              <ActionBtn index={0} icon="add-outline"              label="Top Up"   onPress={() => setShowTopUp(true)} />
              <ActionBtn index={1} icon="swap-horizontal-outline"  label="Transfer" onPress={() => {}} />
              <ActionBtn index={2} icon="qr-code-outline"          label="Pay QR"   onPress={() => {}} />
              <ActionBtn index={3} icon="download-outline"         label="Request"  onPress={() => {}} />
            </View>

            {/* Divider label */}
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>Transactions</Text>
               
            </View>
          </>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTxt}>{title}</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View style={styles.txCard}>
            <TxRow item={item} isLast={index === section.data.length - 1} index={index} />
          </View>
        )}
        SectionSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        contentContainerStyle={{ paddingBottom: SPACING.xxl, paddingHorizontal: SPACING.md }}
        stickySectionHeadersEnabled={false}
      />

      <TopUpSheet visible={showTopUp} onClose={() => setShowTopUp(false)} />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: COLORS.bg },
  safeTop:         { zIndex: 10 },
  headerOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, height: 100, zIndex: 9 },
  header:          {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn:         {
    width: 38, height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOW.card,
  },
  title:           {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  historyBtn:      {
    width: 38, height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOW.card,
  },
  actionsRow:      {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
    ...SHADOW.card,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionLabel:    { color: COLORS.text,    fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  seeAllTxt:       { color: COLORS.secondary, fontSize: 13, fontWeight: '600' },
  sectionHeader:   {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.xs,
  },
  sectionHeaderTxt: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  txCard:          {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden', 
    marginBottom: 6,
    ...SHADOW.card,
  },
   listContent: {
    gap: 12, 
    paddingHorizontal: 16,
    paddingVertical: 8,
  },  
});

// Balance card
const bc = StyleSheet.create({
  wrap:          { marginTop: SPACING.md, marginBottom: SPACING.xs },
  card:          {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    overflow: 'hidden',
    minHeight: 188,
    borderWidth: 1,
    borderColor: 'rgba(250,247,242,0.06)',
  },
  shim:          { position: 'absolute', top: 0, bottom: 0, width: 90 },
  ring1:         {
    position: 'absolute', right: -40, top: -40,
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(250,247,242,0.05)',
    backgroundColor: 'transparent',
  },
  ring2:         {
    position: 'absolute', right: 30, bottom: -60,
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(250,247,242,0.04)',
    backgroundColor: 'transparent',
  },
  headerRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  brandPill:     {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: 'rgba(255,193,7,0.12)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.22)',
  },
  brandTxt:      { color: COLORS.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  securedPill:   {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: 'rgba(250,247,242,0.08)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(250,247,242,0.14)',
  },
  securedTxt:    { color: COLORS.bg, fontSize: 10, fontWeight: '600', opacity: 0.55 },
  availableLabel: { color: COLORS.bg, fontSize: 12, fontWeight: '500', opacity: 0.55, marginBottom: SPACING.xs },
  balanceRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginBottom: SPACING.md },
  currency:      { color: COLORS.bg, fontSize: 16, fontWeight: '700', opacity: 0.7, marginBottom: 6 },
  balance:       { color: COLORS.bg, fontSize: 42, fontWeight: '900', letterSpacing: -1.5, lineHeight: 48 },
  divider:       { height: 1, backgroundColor: 'rgba(250,247,242,0.08)', marginBottom: SPACING.md },
  footerRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  footerItem:    { gap: 2 },
  footerLabel:   { color: COLORS.bg, fontSize: 10, fontWeight: '500', opacity: 0.45 },
  footerValue:   { color: COLORS.bg, fontSize: 12, fontWeight: '700', opacity: 0.85 },
  footerDot:     { width: 3, height: 3, borderRadius: RADIUS.full, backgroundColor: 'rgba(250,247,242,0.25)' },
});

// Action buttons
const ab = StyleSheet.create({
  wrap:   { alignItems: 'center', gap: SPACING.sm },
  circle: {
    width: 52, height: 52,
    borderRadius: RADIUS.md + 2,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  label:  { color: COLORS.textSub, fontSize: 11, fontWeight: '700', letterSpacing: 0.1 },
});

// Top-up sheet
const tus = StyleSheet.create({
  sheet:           {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  handle:          {
    width: 40, height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  titleRow:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.lg },
  title:           { color: COLORS.text,    fontSize: 20, fontWeight: '900', letterSpacing: -0.4, marginBottom: SPACING.xs },
  sub:             { color: COLORS.textMuted, fontSize: 13, fontWeight: '500' },
  closeBtn:        {
    width: 32, height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  amtBtn:          {
    width: (W - SPACING.md * 2 - SPACING.sm) / 2,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    position: 'relative',
    overflow: 'hidden',
  },
  amtBtnSelected:  { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  amtTxt:          { color: COLORS.textMuted, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  amtTxtSelected:  { color: COLORS.text },
  checkDot:        {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    width: 18, height: 18,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtn:      { borderRadius: RADIUS.lg, overflow: 'hidden' },
  confirmGrad:     {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  confirmTxt:      { color: COLORS.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
});

// Transactions
const tx = StyleSheet.create({
  row:          {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
  },
  border:       { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBox:      { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  label:        { color: COLORS.text,    fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },
  sub:          { color: COLORS.textMuted, fontSize: 11, marginTop: 2, fontWeight: '500' },
  amountCol:    { alignItems: 'flex-end', gap: SPACING.xs },
  amount:       { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  typePill:     {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  pillCredit:   { backgroundColor: COLORS.successLight },
  pillDebit:    { backgroundColor: COLORS.surfaceAlt },
  pillTxt:      { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  pillCreditTxt: { color: COLORS.success },
  pillDebitTxt: { color: COLORS.textMuted },
});