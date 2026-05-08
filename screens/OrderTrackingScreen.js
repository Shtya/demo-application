import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView,
  Dimensions, StyleSheet, Linking,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, interpolate, Extrapolation,
  useAnimatedScrollHandler, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Line, Circle, Path, Defs, Marker, Polygon } from 'react-native-svg';

// ─── BRAND CONSTANTS ─────────────────────────────────────────────────────────────
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────────
const { width: W, height: H } = Dimensions.get('window');
const MAP_H        = H * 0.58;
const SHEET_HEIGHT = H * 0.5;

// ─── FAKE DATA ────────────────────────────────────────────────────────────────────
const RIDER = {
  name:   'Ahmed Hassan',
  avatar: 'https://ui-avatars.com/api/?name=Ahmed+Hassan&background=3D2B00&color=FFF8E1&size=128',
  rating: 4.9,
  trips:  1243,
  phone:  '+20 10 1234 5678',
  bike:   'Honda PCX • CGV-8821',
};

const TIMELINE = [
  { icon: 'checkmark-circle', label: 'Order Confirmed',    time: '12:30 PM',       done: true  },
  { icon: 'restaurant',       label: 'Preparing Your Order', time: '12:33 PM',     done: true  },
  { icon: 'bicycle',          label: 'Out for Delivery',   time: '12:41 PM',       done: true, active: true },
  { icon: 'home',             label: 'Delivered',          time: 'Est. 12:55 PM',  done: false },
];

// Route waypoints as fractions of map [x%, y%]
const ROUTE = [
  [0.18, 0.72],
  [0.25, 0.60],
  [0.35, 0.50],
  [0.48, 0.42],
  [0.60, 0.38],
  [0.72, 0.30],
  [0.80, 0.22],
];

const STORE_PT = ROUTE[0];
const HOME_PT  = ROUTE[ROUTE.length - 1];
const PROGRESS = 0.55;

// ─── HELPERS ──────────────────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;

const getRiderPos = (progress) => {
  const total = ROUTE.length - 1;
  const seg   = Math.min(Math.floor(progress * total), total - 1);
  const t     = (progress * total) - seg;
  const [x1, y1] = ROUTE[seg];
  const [x2, y2] = ROUTE[seg + 1];
  return [lerp(x1, x2, t), lerp(y1, y2, t)];
};

const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// ─── MAP OVERLAY ──────────────────────────────────────────────────────────────────
const MapOverlay = ({ riderProgress }) => {
  const riderX = useSharedValue(getRiderPos(0)[0]);
  const riderY = useSharedValue(getRiderPos(0)[1]);
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 700 }),
        withTiming(0,  { duration: 700 }),
      ),
      -1, false,
    );
    const [px, py] = getRiderPos(riderProgress);
    riderX.value = withTiming(px, { duration: 2000 });
    riderY.value = withTiming(py, { duration: 2000 });
  }, []);

  const riderStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: riderX.value * W - 20,
    top:  riderY.value * MAP_H - 20,
    transform: [{ translateY: floatY.value }],
  }));

  const storePulse = useSharedValue(1);
  useEffect(() => {
    storePulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800 }),
        withTiming(1,   { duration: 800 }),
      ),
      -1, false,
    );
  }, []);
  const storePulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: storePulse.value }] }));

  return (
    <View style={{ width: W, height: MAP_H }}>
      {/* Warm map background */}
      <View style={map.bg}>
        {/* Grid lines */}
        {[...Array(10)].map((_, i) => (
          <View key={`h${i}`} style={[map.hLine, { top: `${i * 10 + 5}%` }]} />
        ))}
        {[...Array(8)].map((_, i) => (
          <View key={`v${i}`} style={[map.vLine, { left: `${i * 12.5 + 6}%` }]} />
        ))}
        {/* City blocks */}
        <View style={[map.block, { left: '5%',  top: '15%', width: '18%', height: '12%' }]} />
        <View style={[map.block, { left: '30%', top: '55%', width: '22%', height: '16%' }]} />
        <View style={[map.block, { left: '60%', top: '10%', width: '25%', height: '20%' }]} />
        <View style={[map.block, { left: '65%', top: '55%', width: '20%', height: '14%' }]} />
        <View style={[map.block, { left: '10%', top: '40%', width: '15%', height: '18%' }]} />
        {/* Roads */}
        <View style={[map.road, { left: '2%',  top: '50%', width: '96%', height: 6 }]} />
        <View style={[map.road, { left: '45%', top: '5%',  width: 6,     height: '90%' }]} />
        <View style={[map.road, { left: '25%', top: '30%', width: '50%', height: 4, transform: [{ rotate: '-18deg' }] }]} />
      </View>

      {/* SVG route */}
      <Svg style={StyleSheet.absoluteFill} width={W} height={MAP_H}>
        {/* Base route shadow */}
        <Path
          d={`M ${ROUTE.map(([x, y]) => `${x * W} ${y * MAP_H}`).join(' L ')}`}
          stroke="rgba(61,43,0,0.20)"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Completed segment — warm secondary */}
        <Path
          d={`M ${ROUTE.slice(0, Math.ceil(PROGRESS * (ROUTE.length - 1)) + 1).map(([x, y]) => `${x * W} ${y * MAP_H}`).join(' L ')}`}
          stroke={COLORS.secondary}
          strokeWidth={4}
          strokeDasharray="8,4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Remaining segment — muted */}
        <Path
          d={`M ${ROUTE.slice(Math.ceil(PROGRESS * (ROUTE.length - 1))).map(([x, y]) => `${x * W} ${y * MAP_H}`).join(' L ')}`}
          stroke={COLORS.border}
          strokeWidth={3}
          strokeDasharray="6,5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Store pin — surface + dark border */}
        <Circle cx={STORE_PT[0] * W} cy={STORE_PT[1] * MAP_H} r={13} fill={COLORS.dark} />
        <Circle cx={STORE_PT[0] * W} cy={STORE_PT[1] * MAP_H} r={7}  fill={COLORS.surface} />
        {/* Home pin — success */}
        <Circle cx={HOME_PT[0] * W} cy={HOME_PT[1] * MAP_H} r={13} fill={COLORS.success} />
        <Circle cx={HOME_PT[0] * W} cy={HOME_PT[1] * MAP_H} r={7}  fill={COLORS.surface} />
      </Svg>

      {/* Pin labels */}
      <View style={[map.pinLabel, { left: STORE_PT[0] * W - 30, top: STORE_PT[1] * MAP_H + 18 }]}>
        <Text style={map.pinLabelTxt}>Store</Text>
      </View>
      <View style={[map.pinLabel, { left: HOME_PT[0] * W - 24, top: HOME_PT[1] * MAP_H + 18 }]}>
        <Text style={map.pinLabelTxt}>Home</Text>
      </View>

      {/* Rider bubble */}
      <Animated.View style={[map.riderIcon, riderStyle]}>
        <LinearGradient
          colors={[COLORS.secondary, COLORS.dark]}
          style={map.riderBubble}
        >
          <Text style={{ fontSize: 18 }}>🛵</Text>
        </LinearGradient>
      </Animated.View>

      {/* ETA badge */}
      <View style={map.etaBadge}>
        <Ionicons name="time-outline" size={15} color={COLORS.textSub} />
        <Text style={map.etaMain}>12 min</Text>
        <Text style={map.etaSub}>Est. 12:55 PM</Text>
      </View>

      {/* Top gradient fade into page bg */}
      <LinearGradient
        colors={[COLORS.dark, 'transparent']}
        style={map.topFade}
        pointerEvents="none"
      />
      {/* Bottom fade into sheet */}
      <LinearGradient
        colors={['transparent', 'rgba(28,26,16,0.55)', 'rgba(28,26,16,0.92)']}
        style={map.bottomFade}
        pointerEvents="none"
      />
    </View>
  );
};

// ─── TIMELINE ITEM ────────────────────────────────────────────────────────────────
const TimelineItem = ({ item, isLast }) => {
  const pulseS = useSharedValue(1);
  useEffect(() => {
    if (item.active) {
      pulseS.value = withRepeat(
        withSequence(
          withTiming(1.22, { duration: 600 }),
          withTiming(1,    { duration: 600 }),
        ),
        -1, false,
      );
    }
  }, []);
  const pStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseS.value }] }));

  return (
    <View style={tl.row}>
      <View style={tl.left}>
        {item.active ? (
          <Animated.View style={[tl.dot, tl.dotActive, pStyle]}>
            <Ionicons name={item.icon} size={13} color={COLORS.dark} />
          </Animated.View>
        ) : (
          <View style={[tl.dot, item.done && tl.dotDone]}>
            {item.done
              ? <Ionicons name="checkmark" size={13} color={COLORS.surface} />
              : <Ionicons name={item.icon} size={11} color={COLORS.textMuted} />
            }
          </View>
        )}
        {!isLast && <View style={[tl.line, item.done && tl.lineDone]} />}
      </View>
      <View style={tl.info}>
        <Text style={[
          tl.label,
          item.done   && { color: COLORS.text },
          item.active && { color: COLORS.secondaryDark },
        ]}>
          {item.label}
        </Text>
        <Text style={tl.time}>{item.time}</Text>
      </View>
    </View>
  );
};

// ─── RIDER CARD ───────────────────────────────────────────────────────────────────
const RiderCard = () => {
  const pCall = usePress();
  const pChat = usePress();

  return (
    <View style={rc.card}>
      <Image source={{ uri: RIDER.avatar }} style={rc.avatar} />
      <View style={{ flex: 1, gap: SPACING.xs }}>
        <Text style={rc.name}>{RIDER.name}</Text>
        <View style={rc.meta}>
          <Ionicons name="star" size={12} color={COLORS.primary} />
          <Text style={rc.metaTxt}>{RIDER.rating} · {RIDER.trips.toLocaleString()} trips</Text>
        </View>
        <View style={rc.bikePill}>
          <Ionicons name="bicycle-outline" size={12} color={COLORS.textMuted} />
          <Text style={rc.bike}>{RIDER.bike}</Text>
        </View>
      </View>
      <View style={rc.actions}>
        {/* Call button — primary CTA yellow */}
        <Animated.View style={pCall.animStyle}>
          <TouchableOpacity
            onPressIn={pCall.onPressIn}
            onPressOut={pCall.onPressOut}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Linking.openURL(`tel:${RIDER.phone}`);
            }}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={rc.actionCircle}
            >
              <Ionicons name="call-outline" size={17} color={COLORS.text} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Chat button — outlined */}
        <Animated.View style={pChat.animStyle}>
          <TouchableOpacity
            onPressIn={pChat.onPressIn}
            onPressOut={pChat.onPressOut}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={rc.chatCircle}
            activeOpacity={1}
          >
            <Ionicons name="chatbubble-outline" size={17} color={COLORS.textSub} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────
export default function OrderTrackingScreen({ navigation, route }) {
  const order = route?.params?.order ?? {
    id: 'ORD-884521',
    store: 'Burger Express',
    eta: '10–15 min',
  };

  const sheetY = useSharedValue(0);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const snapSheet = () => {
    sheetY.value = withSpring(0, ANIM.spring);
  };

  return (
    <View style={styles.root}>
      {/* Map */}
      <MapOverlay riderProgress={PROGRESS} />

      {/* Back + order ID */}
      <SafeAreaView edges={['top']} style={styles.backWrap}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <BlurView intensity={50} tint="dark" style={styles.backBlur}>
            <Ionicons name="arrow-back" size={20} color={COLORS.bg} />
          </BlurView>
        </TouchableOpacity>

        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeTxt}>{order.id}</Text>
        </View>
      </SafeAreaView>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 90 }}
        >
          {/* Status header */}
          <View style={styles.statusHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>Out for Delivery</Text>
              <Text style={styles.statusSub}>
                On its way · Est. {order.eta}
              </Text>
            </View>
            <View style={styles.etaPill}>
              <Ionicons name="time-outline" size={13} color={COLORS.secondaryDark} />
              <Text style={styles.etaPillTxt}>~12 min</Text>
            </View>
          </View>

          {/* Rider card */}
          <RiderCard />

          {/* Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Timeline</Text>
            <View style={styles.timelineWrap}>
              {TIMELINE.map((item, i) => (
                <TimelineItem
                  key={item.label}
                  item={item}
                  isLast={i === TIMELINE.length - 1}
                />
              ))}
            </View>
          </View>

          {/* Live update chip */}
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>Live updates every 30 seconds</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.dark },

  // Back / header overlay
  backWrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm,
  },
  backBtn: { borderRadius: RADIUS.full, overflow: 'hidden' },
  backBlur: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  orderBadge: {
    backgroundColor: 'rgba(28,26,16,0.80)',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: 'rgba(250,247,242,0.14)',
  },
  orderBadgeTxt: {
    color: 'rgba(250,247,242,0.90)',
    fontSize: 13, fontWeight: '700',
  },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    left: 0, right: 0,
    top: H - SHEET_HEIGHT,
    height: SHEET_HEIGHT + SPACING.xl, // extra for overscroll
    backgroundColor: COLORS.surface,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOW.card,
  },
  handle: {
    width: 40, height: 4, borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: SPACING.md,
  },

  // Status header
  statusHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: SPACING.md,
  },
  statusTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  statusSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  etaPill: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
  },
  etaPillTxt: { color: COLORS.secondaryDark, fontSize: 14, fontWeight: '800' },

  // Section
  section: { marginTop: SPACING.md },
  sectionTitle: {
    color: COLORS.text, fontSize: 15, fontWeight: '800',
    marginBottom: SPACING.md,
  },
  timelineWrap: { gap: 0 },

  // Live chip
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    alignSelf: 'center', marginTop: SPACING.md,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
  },
  liveDot: {
    width: SPACING.sm, height: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: COLORS.success,
  },
  liveTxt: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
});

// ─── MAP STYLES ───────────────────────────────────────────────────────────────────
const map = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EDE8DF', // warm parchment map tone
  },
  hLine: {
    position: 'absolute', left: 0, right: 0,
    height: 1, backgroundColor: 'rgba(184,151,90,0.18)',
  },
  vLine: {
    position: 'absolute', top: 0, bottom: 0,
    width: 1, backgroundColor: 'rgba(184,151,90,0.18)',
  },
  block: {
    position: 'absolute',
    backgroundColor: 'rgba(184,151,90,0.22)',
    borderRadius: RADIUS.sm,
  },
  road: {
    position: 'absolute',
    backgroundColor: 'rgba(250,247,242,0.65)',
    borderRadius: RADIUS.sm,
  },
  pinLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(61,43,0,0.80)',
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  pinLabelTxt: { color: COLORS.bg, fontSize: 10, fontWeight: '700' },
  riderIcon: { zIndex: 20 },
  riderBubble: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
    ...{ shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 8 },
  },
  etaBadge: {
    position: 'absolute', top: SPACING.md, right: SPACING.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + SPACING.xs,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    ...SHADOW.card,
  },
  etaMain: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  etaSub:  { color: COLORS.textMuted, fontSize: 11 },
  topFade: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 80,
  },
  bottomFade: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
  },
});

// ─── TIMELINE STYLES ──────────────────────────────────────────────────────────────
const tl = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACING.md },
  left: { alignItems: 'center', width: 32 },
  dot: {
    width: 32, height: 32, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
    ...{ shadowColor: '#FFC107', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 5 },
  },
  dotDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  line: {
    flex: 1, width: 2,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  lineDone: { backgroundColor: COLORS.success },
  info: { flex: 1, paddingBottom: SPACING.lg, paddingTop: SPACING.xs },
  label: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700' },
  time:  { color: COLORS.border,    fontSize: 12, marginTop: 2 },
});

// ─── RIDER CARD STYLES ────────────────────────────────────────────────────────────
const rc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOW.card,
  },
  avatar: {
    width: 52, height: 52, borderRadius: RADIUS.md,
    borderWidth: 2, borderColor: COLORS.border,
  },
  name: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  metaTxt: { color: COLORS.textMuted, fontSize: 12 },
  bikePill: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    alignSelf: 'flex-start',
  },
  bike: { color: COLORS.textMuted, fontSize: 11 },
  actions: { flexDirection: 'row', gap: SPACING.sm },
  actionCircle: {
    width: 42, height: 42, borderRadius: RADIUS.full,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOW.float,
  },
  chatCircle: {
    width: 42, height: 42, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.borderStrong,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
});