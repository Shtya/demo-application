import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image, FlatList,
  Dimensions, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
const { width: W } = Dimensions.get('window');

// ─── FAKE DATA ────────────────────────────────────────────────────────────────────
const ACTIVE_ORDERS = [
  {
    id: 'ORD-884521',
    store: 'Burger Express',
    storeLogo: 'https://ui-avatars.com/api/?name=Burger+Express&background=3D2B00&color=FFF8E1&size=128',
    items: ['Gourmet Beef Burger x1', 'Loaded Fries x1', 'Chocolate Shake x1'],
    total: 350,
    status: 2,
    time: '12:35 PM',
    eta: '10–15 min',
  },
  {
    id: 'ORD-772310',
    store: 'Green Market',
    storeLogo: 'https://ui-avatars.com/api/?name=Green+Market&background=2E7D32&color=E8F5E9&size=128',
    items: ['Organic Avocados x2', 'Fresh Strawberries x1'],
    total: 195,
    status: 1,
    time: '01:10 PM',
    eta: '20–30 min',
  },
];

const PAST_ORDERS = [
  {
    id: 'ORD-661230',
    store: 'Organic Shop',
    storeLogo: 'https://ui-avatars.com/api/?name=Organic+Shop&background=3D2B00&color=FFF8E1&size=128',
    items: ['Greek Salad x1', 'Blueberry Smoothie x2'],
    total: 225,
    status: 3,
    date: 'May 5, 2026',
    rating: 5,
  },
  {
    id: 'ORD-550119',
    store: 'PharmaCare',
    storeLogo: 'https://ui-avatars.com/api/?name=PharmaCare&background=1565C0&color=E3F2FD&size=128',
    items: ['Vitamin C 1000mg x2', 'Hand Sanitizer x1'],
    total: 165,
    status: 3,
    date: 'May 3, 2026',
    rating: 4,
  },
  {
    id: 'ORD-441008',
    store: 'TechZone',
    storeLogo: 'https://ui-avatars.com/api/?name=TechZone&background=5C3D00&color=FFF8E1&size=128',
    items: ['iPhone 15 Case x1'],
    total: 75,
    status: 3,
    date: 'Apr 28, 2026',
    rating: 5,
  },
];

const STATUS_STEPS = ['Confirmed', 'Preparing', 'On the Way', 'Delivered'];
const STATUS_ICONS = ['checkmark-circle', 'restaurant', 'bicycle', 'home'];

const fmt = (p) => `QAR ${p.toLocaleString()}`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────────
const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────────

const StatusSteps = ({ currentStep }) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 600 }),
        withTiming(1,    { duration: 600 }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  return (
    <View style={stepS.wrap}>
      {STATUS_STEPS.map((label, i) => {
        const isDone   = i < currentStep;
        const isActive = i === currentStep;
        return (
          <React.Fragment key={label}>
            <View style={stepS.step}>
              {isActive ? (
                <Animated.View style={[stepS.circle, stepS.circleActive, pulseStyle]}>
                  <Ionicons name={STATUS_ICONS[i]} size={13} color={COLORS.dark} />
                </Animated.View>
              ) : (
                <View style={[stepS.circle, isDone && stepS.circleDone]}>
                  {isDone
                    ? <Ionicons name="checkmark" size={13} color={COLORS.surface} />
                    : <Ionicons name={STATUS_ICONS[i]} size={12} color={COLORS.textMuted} />
                  }
                </View>
              )}
              <Text style={[
                stepS.label,
                isDone   && { color: COLORS.success },
                isActive && { color: COLORS.secondaryDark, fontWeight: '700' },
              ]}>
                {label}
              </Text>
            </View>
            {i < STATUS_STEPS.length - 1 && (
              <View style={[stepS.line, i < currentStep && stepS.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const ActiveOrderCard = ({ order, onTrack, index }) => {
  const p = usePress();

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: withDelay(index * 80, withTiming(1, { duration: ANIM.duration.normal })),
    transform: [{ translateY: withDelay(index * 80, withSpring(0, ANIM.springSlow)) }],
  }));

  return (
    <Animated.View style={[{ opacity: 0, transform: [{ translateY: 20 }] }, entranceStyle]}>
      <Animated.View style={[styles.activeCard, p.animStyle]}>
        {/* Card top accent strip */}
        <LinearGradient
          colors={[COLORS.secondary, COLORS.secondaryLight]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.cardAccentStrip}
        />

        {/* Header */}
        <View style={styles.activeCardHeader}>
          <Image source={{ uri: order.storeLogo }} style={styles.orderLogo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.storeName}>{order.store}</Text>
            <Text style={styles.orderId}>{order.id} · {order.time}</Text>
          </View>
          <View style={styles.etaBadge}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSub} />
            <Text style={styles.etaTxt}>{order.eta}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsList}>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemDot} />
              <Text style={styles.orderItem}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Status stepper */}
        <StatusSteps currentStep={order.status} />

        {/* Footer */}
        <View style={styles.divider} />
        <View style={styles.activeCardFooter}>
          <View>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.orderTotal}>{fmt(order.total)}</Text>
          </View>
          <Animated.View style={p.animStyle}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onTrack();
              }}
              onPressIn={p.onPressIn}
              onPressOut={p.onPressOut}
              activeOpacity={1}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.trackBtn}
              >
                <Ionicons name="navigate-outline" size={15} color={COLORS.text} />
                <Text style={styles.trackBtnTxt}>Track Order</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const StarRow = ({ count }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons key={i} name={i <= count ? 'star' : 'star-outline'} size={12} color={COLORS.primary} />
    ))}
  </View>
);

const PastOrderCard = ({ order, onReorder, index }) => {
  const p = usePress();

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: withDelay(index * 60, withTiming(1, { duration: ANIM.duration.normal })),
    transform: [{ translateY: withDelay(index * 60, withSpring(0, ANIM.springSlow)) }],
  }));

  return (
    <Animated.View style={[{ opacity: 0, transform: [{ translateY: 20 }] }, entranceStyle]}>
      <Animated.View style={[styles.pastCard, p.animStyle]}>
        {/* Header */}
        <View style={styles.pastHeader}>
          <Image source={{ uri: order.storeLogo }} style={styles.pastLogo} />
          <View style={{ flex: 1, gap: SPACING.xs }}>
            <Text style={styles.pastStore}>{order.store}</Text>
            <Text style={styles.pastMeta}>{order.id} · {order.date}</Text>
            <StarRow count={order.rating} />
          </View>
          <View style={styles.delivBadge}>
            <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
            <Text style={styles.delivTxt}>Delivered</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Items */}
        <View style={styles.pastItemsList}>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={[styles.itemDot, { backgroundColor: COLORS.border }]} />
              <Text style={styles.pastItem}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.pastFooter}>
          <View>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.pastTotal}>{fmt(order.total)}</Text>
          </View>
          <Animated.View style={p.animStyle}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onReorder();
              }}
              onPressIn={p.onPressIn}
              onPressOut={p.onPressOut}
              style={styles.reorderBtn}
              activeOpacity={1}
            >
              <Ionicons name="refresh-outline" size={15} color={COLORS.secondaryDark} />
              <Text style={styles.reorderTxt}>Reorder</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const EmptyState = ({ message }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIconWrap}>
      <Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />
    </View>
    <Text style={styles.emptyTitle}>Nothing here yet</Text>
    <Text style={styles.emptyTxt}>{message}</Text>
  </View>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────
export default function OrdersScreen({ navigation }) {
  const [tab, setTab] = useState('active');
  const tabX = useSharedValue(0);
  const indicStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tabX.value }] }));

  const TAB_W = (W - SPACING.md * 2 - SPACING.xs * 2) / 2;

  const switchTab = (t) => {
    setTab(t);
    tabX.value = withSpring(t === 'active' ? 0 : TAB_W, ANIM.spring);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeTxt}>
              {ACTIVE_ORDERS.length} active
            </Text>
          </View>
        </View>

        {/* Tab toggle */}
        <View style={styles.tabWrap}>
          <Animated.View style={[styles.tabIndicator, { width: TAB_W }, indicStyle]} />
          {['active', 'past'].map((t) => (
            <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => switchTab(t)}>
              <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
                {t === 'active'
                  ? `Active  ${ACTIVE_ORDERS.length}`
                  : `History  ${PAST_ORDERS.length}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      {tab === 'active' ? (
        <FlatList
          data={ACTIVE_ORDERS}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState message="Your active orders will appear here." />
          }
          renderItem={({ item, index }) => (
            <ActiveOrderCard
              order={item}
              index={index}
              onTrack={() => navigation.navigate('OrderTracking', { order: item })}
            />
          )}
        />
      ) : (
        <FlatList
          data={PAST_ORDERS}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState message="Completed orders will appear here." />
          }
          renderItem={({ item, index }) => (
            <PastOrderCard
              order={item}
              index={index}
              onReorder={() => navigation.navigate('HomeTab')}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  root: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm, gap: SPACING.sm,
  },
  headerTitle: { color: COLORS.text, fontSize: 26, fontWeight: '900', flex: 1 },
  headerBadge: {
    backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.sm + SPACING.xs,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
  },
  headerBadgeTxt: { color: COLORS.secondaryDark, fontSize: 12, fontWeight: '700' },

  // Tabs
  tabWrap: {
    flexDirection: 'row', marginHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg,
    padding: SPACING.xs, position: 'relative', marginBottom: SPACING.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tabIndicator: {
    position: 'absolute', left: SPACING.xs, top: SPACING.xs, bottom: SPACING.xs,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    ...{ shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  },
  tabBtn: { flex: 1, paddingVertical: SPACING.sm + SPACING.xs, alignItems: 'center', zIndex: 1 },
  tabTxt: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  tabTxtActive: { color: COLORS.text, fontWeight: '700' },

  listContent: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xxl },

  // Active card
  activeCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden', gap: SPACING.md, padding: SPACING.md,
    ...{ shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  },
  cardAccentStrip: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
  },
  activeCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, marginTop: SPACING.xs,
  },
  orderLogo: {
    width: 46, height: 46, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  storeName: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
  orderId: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  etaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.surfaceAlt, paddingHorizontal: SPACING.sm + SPACING.xs,
    paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
  },
  etaTxt: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' },

  itemsList: { gap: SPACING.xs },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  itemDot: {
    width: 5, height: 5, borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
  },
  orderItem: { color: COLORS.textMuted, fontSize: 13 },

  divider: { height: 1, backgroundColor: COLORS.border },

  activeCardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '500', marginBottom: 2 },
  orderTotal: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md + SPACING.xs, paddingVertical: SPACING.sm + SPACING.xs,
    borderRadius: RADIUS.full,
    ...{ shadowColor: '#FFC107', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 },
  },
  trackBtnTxt: { color: COLORS.text, fontSize: 14, fontWeight: '700' },

  // Star row
  starRow: { flexDirection: 'row', gap: 2 },

  // Past card
  pastCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    gap: SPACING.sm, padding: SPACING.md,
    ...{ shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  },
  pastHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pastLogo: {
    width: 42, height: 42, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pastStore: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  pastMeta: { color: COLORS.textMuted, fontSize: 11 },
  delivBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.successLight, paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  delivTxt: { color: COLORS.success, fontSize: 11, fontWeight: '700' },

  pastItemsList: { gap: SPACING.xs },
  pastItem: { color: COLORS.textMuted, fontSize: 12 },

  pastFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastTotal: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1.5, borderColor: COLORS.borderStrong,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: COLORS.secondaryLight,
  },
  reorderTxt: { color: COLORS.secondaryDark, fontSize: 13, fontWeight: '700' },

  // Empty state
  empty: {
    alignItems: 'center', paddingTop: SPACING.xxl + SPACING.xl,
    gap: SPACING.sm,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  emptyTxt: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', maxWidth: 220 },
});

// ─── STATUS STEP STYLES ────────────────────────────────────────────────────────────
const stepS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center' },
  step: { alignItems: 'center', gap: SPACING.xs },
  circle: {
    width: 32, height: 32, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
    ...{ shadowColor: '#FFC107', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 },
  },
  circleDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  label: {
    color: COLORS.textMuted, fontSize: 9, fontWeight: '600',
    textAlign: 'center', maxWidth: 54,
  },
  line: {
    flex: 1, height: 2,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md + SPACING.xs,
  },
  lineDone: { backgroundColor: COLORS.success },
});