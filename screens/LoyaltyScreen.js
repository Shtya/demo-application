import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, FlatList,
  Dimensions, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, interpolate, Extrapolation, withDelay,
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

const { width: W } = Dimensions.get('window');

// ─── FAKE DATA ────────────────────────────────────────────────────────────────────
const POINTS = 4850;
const MAX_POINTS = 6000;

const TIERS = [
  { name: 'Bronze',   min: 0,    max: 1000,  icon: '🥉', colors: ['#CD7F32', '#A0522D'] },
  { name: 'Silver',   min: 1000, max: 2500,  icon: '🥈', colors: ['#C0C0C0', '#909090'] },
  { name: 'Gold',     min: 2500, max: 6000,  icon: '🥇', colors: ['#B8975A', '#7A5C2E'] },
  { name: 'Platinum', min: 6000, max: 99999, icon: '💎', colors: ['#5C3D00', '#3D2B00'] },
];

const CURRENT_TIER   = TIERS.find((t) => POINTS >= t.min && POINTS < t.max) ?? TIERS[2];
const NEXT_TIER      = TIERS[TIERS.indexOf(CURRENT_TIER) + 1] ?? TIERS[3];
const PROGRESS_PCT   = Math.min(1, (POINTS - CURRENT_TIER.min) / (NEXT_TIER.min - CURRENT_TIER.min));

const EARN_LIST = [
  { icon: 'bag-handle-outline', label: 'Every Order',      pts: '+10 pts per QAR 100 spent',  accent: COLORS.success      },
  { icon: 'person-add-outline', label: 'Refer a Friend',   pts: '+500 pts per referral',      accent: COLORS.info         },
  { icon: 'star-outline',       label: 'Write a Review',   pts: '+50 pts per review',         accent: COLORS.secondary    },
  { icon: 'gift-outline',       label: 'Birthday Bonus',   pts: '+200 pts on your birthday',  accent: COLORS.error        },
  { icon: 'flash-outline',      label: 'Flash Challenges', pts: 'Up to +1000 pts',            accent: COLORS.secondaryDark },
];

const REWARDS = [
  { id: 'R1', label: 'Free Delivery',          pts: 200,  icon: 'bicycle-outline',   accent: COLORS.success      },
  { id: 'R2', label: 'QAR 50 Off Next Order',  pts: 500,  icon: 'pricetag-outline',  accent: COLORS.warning      },
  { id: 'R3', label: 'QAR 150 Gift Card',      pts: 1500, icon: 'gift-outline',      accent: COLORS.info         },
  { id: 'R4', label: 'Premium Month Free',     pts: 2500, icon: 'star-outline',      accent: COLORS.secondary    },
  { id: 'R5', label: 'Exclusive Merch',        pts: 5000, icon: 'shirt-outline',     accent: COLORS.secondaryDark },
];

const HISTORY = [
  { id: 'H1', label: 'Order ORD-884521',      pts: +35,   date: 'Today',  type: 'earn'   },
  { id: 'H2', label: 'Referral Bonus',         pts: +500,  date: 'May 5',  type: 'earn'   },
  { id: 'H3', label: 'Free Delivery',          pts: -200,  date: 'May 3',  type: 'redeem' },
  { id: 'H4', label: 'Order ORD-661230',       pts: +22,   date: 'May 2',  type: 'earn'   },
  { id: 'H5', label: 'QAR 50 Off Redeemed',   pts: -500,  date: 'Apr 30', type: 'redeem' },
];

// ─── usePress HOOK ────────────────────────────────────────────────────────────────
const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// ─── ANIMATED PROGRESS BAR ────────────────────────────────────────────────────────
const ProgressBar = ({ progress }) => {
  const barW = useSharedValue(0);
  useEffect(() => {
    barW.value = withTiming(progress, { duration: 1300 });
  }, []);
  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.min(barW.value * 100, 100)}%`,
  }));

  return (
    <View style={pb.bg}>
      <Animated.View style={[pb.fill, barStyle]}>
        <LinearGradient
          colors={[COLORS.secondary, COLORS.secondaryDark]}
          style={{ flex: 1, borderRadius: RADIUS.full }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </View>
  );
};

// ─── POINTS CARD ─────────────────────────────────────────────────────────────────
const PointsCard = () => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = POINTS / 50;
    const interval = setInterval(() => {
      cur += step;
      if (cur >= POINTS) { setDisplay(POINTS); clearInterval(interval); }
      else setDisplay(Math.floor(cur));
    }, 28);
    return () => clearInterval(interval);
  }, []);

  const shimX = useSharedValue(-W);
  useEffect(() => {
    shimX.value = withRepeat(withTiming(W, { duration: 2600 }), -1, false);
  }, []);
  const shimStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimX.value }] }));

  const iconPulse = useSharedValue(1);
  useEffect(() => {
    iconPulse.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1, false,
    );
  }, []);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconPulse.value }] }));

  const cardScale = useSharedValue(0.92);
  const cardOp    = useSharedValue(0);
  useEffect(() => {
    cardScale.value = withSpring(1, ANIM.springSlow);
    cardOp.value    = withTiming(1, { duration: ANIM.duration.slow });
  }, []);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOp.value,
  }));

  const ptsLeft = NEXT_TIER.min - POINTS;

  return (
    <Animated.View style={cardStyle}>
      <LinearGradient
        colors={['#1C1A10', '#2A2418', '#33291C']}
        style={pc.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Shimmer */}
        <Animated.View style={[pc.shim, shimStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(250,247,242,0.06)', 'transparent']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>

        {/* Deco rings */}
        <View style={pc.ring1} />
        <View style={pc.ring2} />

        {/* Header row */}
        <View style={pc.headerRow}>
          <View style={pc.tierPill}>
            <Ionicons name="trophy" size={11} color={COLORS.primary} />
            <Text style={pc.tierPillTxt}>{CURRENT_TIER.name} Member</Text>
          </View>
          <Animated.View style={iconStyle}>
            <Text style={pc.tierEmoji}>{CURRENT_TIER.icon}</Text>
          </Animated.View>
        </View>

        {/* Points */}
        <Text style={pc.ptsLabel}>Quick Points</Text>
        <View style={pc.ptsRow}>
          <Text style={pc.ptsTxt}>{display.toLocaleString()}</Text>
          <Text style={pc.ptsUnit}>pts</Text>
        </View>

        {/* Progress */}
        <View style={pc.progressSection}>
          <ProgressBar progress={PROGRESS_PCT} />
          <View style={pc.progressLabels}>
            <Text style={pc.progressLeft}>{POINTS.toLocaleString()} / {NEXT_TIER.min.toLocaleString()}</Text>
            <Text style={pc.progressRight}>{ptsLeft.toLocaleString()} to {NEXT_TIER.name}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ─── TIER TRACK ──────────────────────────────────────────────────────────────────
const TierTrack = () => {
  const currentIdx = TIERS.indexOf(CURRENT_TIER);
  return (
    <View style={tt.wrap}>
      {TIERS.map((tier, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={tier.name}>
            <View style={tt.item}>
              <View style={[
                tt.badge,
                done   && tt.badgeDone,
                active && tt.badgeActive,
                !done && !active && tt.badgeFuture,
              ]}>
                <Text style={tt.badgeEmoji}>{tier.icon}</Text>
              </View>
              <Text style={[
                tt.name,
                active && tt.nameActive,
                done   && tt.nameDone,
              ]}>
                {tier.name}
              </Text>
              {active && <View style={tt.activeDot} />}
            </View>
            {i < TIERS.length - 1 && (
              <View style={[tt.line, done && tt.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─── REWARD CARD ─────────────────────────────────────────────────────────────────
const RewardCard = ({ reward, onRedeem, index = 0 }) => {
  const canRedeem = POINTS >= reward.pts;
  const p = usePress();

  const slideY = useSharedValue(16);
  const opVal  = useSharedValue(0);
  useEffect(() => {
    slideY.value = withDelay(index * 70, withSpring(0,    ANIM.spring));
    opVal.value  = withDelay(index * 70, withTiming(1, { duration: ANIM.duration.normal }));
  }, []);
  const entranceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: opVal.value,
  }));

  return (
    <Animated.View style={[entranceStyle, p.animStyle, rw.card, !canRedeem && rw.cardLocked]}>
      <TouchableOpacity
        onPress={canRedeem ? () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onRedeem(); } : undefined}
        onPressIn={canRedeem ? p.onPressIn : undefined}
        onPressOut={canRedeem ? p.onPressOut : undefined}
        activeOpacity={canRedeem ? 1 : 1}
        style={{ alignItems: 'center', gap: SPACING.sm }}
      >
        <View style={[rw.iconBox, { backgroundColor: reward.accent + '18' }]}>
          <Ionicons name={reward.icon} size={26} color={canRedeem ? reward.accent : COLORS.border} />
        </View>
        <Text style={[rw.label, !canRedeem && rw.labelLocked]}>{reward.label}</Text>
        <View style={rw.ptsRow}>
          <Ionicons name="star" size={11} color={canRedeem ? COLORS.secondary : COLORS.border} />
          <Text style={[rw.ptsTxt, !canRedeem && rw.ptsLocked]}>{reward.pts.toLocaleString()} pts</Text>
        </View>
        <View style={[rw.btn, canRedeem ? rw.btnActive : rw.btnLocked]}>
          <Text style={[rw.btnTxt, !canRedeem && rw.btnTxtLocked]}>
            {canRedeem ? 'Redeem' : 'Locked'}
          </Text>
          {!canRedeem && <Ionicons name="lock-closed" size={11} color={COLORS.textMuted} style={{ marginLeft: SPACING.xs }} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── EARN ROW ─────────────────────────────────────────────────────────────────────
const EarnRow = ({ item, isLast, index = 0 }) => {
  const p = usePress();
  const slideX = useSharedValue(-14);
  const opVal  = useSharedValue(0);
  useEffect(() => {
    slideX.value = withDelay(index * 55, withSpring(0,    ANIM.spring));
    opVal.value  = withDelay(index * 55, withTiming(1, { duration: ANIM.duration.normal }));
  }, []);
  const entranceStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    opacity: opVal.value,
  }));

  return (
    <Animated.View style={[entranceStyle, p.animStyle]}>
      <TouchableOpacity
        style={[er.row, !isLast && er.rowBorder]}
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        activeOpacity={1}
      >
        <View style={[er.iconBox, { backgroundColor: item.accent + '16' }]}>
          <Ionicons name={item.icon} size={19} color={item.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={er.label}>{item.label}</Text>
          <Text style={er.pts}>{item.pts}</Text>
        </View>
        <Ionicons name="chevron-forward" size={15} color={COLORS.border} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── HISTORY ROW ──────────────────────────────────────────────────────────────────
const HistoryRow = ({ item, isLast, index = 0 }) => {
  const isEarn = item.type === 'earn';
  const slideX = useSharedValue(-14);
  const opVal  = useSharedValue(0);
  useEffect(() => {
    slideX.value = withDelay(index * 55, withSpring(0,    ANIM.spring));
    opVal.value  = withDelay(index * 55, withTiming(1, { duration: ANIM.duration.normal }));
  }, []);
  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    opacity: opVal.value,
  }));

  return (
    <Animated.View style={[hr.row, !isLast && hr.border, rowStyle]}>
      <View style={[hr.dot, isEarn ? hr.dotEarn : hr.dotRedeem]}>
        <Ionicons
          name={isEarn ? 'arrow-up-outline' : 'arrow-down-outline'}
          size={14}
          color={isEarn ? COLORS.success : COLORS.warning}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={hr.label}>{item.label}</Text>
        <Text style={hr.date}>{item.date}</Text>
      </View>
      <View style={[hr.badge, isEarn ? hr.badgeEarn : hr.badgeRedeem]}>
        <Text style={[hr.pts, isEarn ? hr.ptsEarn : hr.ptsRedeem]}>
          {isEarn ? '+' : ''}{item.pts.toLocaleString()} pts
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────────
export default function LoyaltyScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('earn');

  // Tab indicator — 3 equal segments
  const tabW  = (W - SPACING.md * 2 - SPACING.xs * 2) / 3;
  const tabX  = useSharedValue(0);
  const indicStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tabX.value }] }));

  const switchTab = (t) => {
    setActiveTab(t);
    const idx = ['earn', 'redeem', 'history'].indexOf(t);
    tabX.value = withSpring(idx * tabW, ANIM.spring);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const headerOp = useSharedValue(0);
  useEffect(() => { headerOp.value = withTiming(1, { duration: ANIM.duration.slow }); }, []);
  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOp.value }));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, headerStyle]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Loyalty Rewards</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xxl }}
      >
        {/* Points card */}
        <View style={styles.cardWrap}>
          <PointsCard />
        </View>

        {/* Tier track */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Journey</Text>
          <View style={styles.sectionCard}>
            <TierTrack />
            <View style={styles.tierNoteRow}>
              <Ionicons name="trending-up-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.tierNote}>
                {(NEXT_TIER.min - POINTS).toLocaleString()} pts to reach {NEXT_TIER.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab toggle */}
        <View style={styles.section}>
          <View style={styles.tabTrack}>
            {/* Sliding pill */}
            <Animated.View style={[styles.tabPill, { width: tabW }, indicStyle]} />
            {[['earn', 'Earn'], ['redeem', 'Redeem'], ['history', 'History']].map(([t, label]) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, { width: tabW }]}
                onPress={() => switchTab(t)}
                activeOpacity={1}
              >
                <Text style={[styles.tabTxt, activeTab === t && styles.tabTxtActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Earn tab ─────────────────────────── */}
        {activeTab === 'earn' && (
          <View style={styles.section}>
            <View style={styles.sectionCard}>
              {EARN_LIST.map((item, i) => (
                <EarnRow
                  key={item.label}
                  item={item}
                  isLast={i === EARN_LIST.length - 1}
                  index={i}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Redeem tab ───────────────────────── */}
        {activeTab === 'redeem' && (
          <View style={styles.rewardsGrid}>
            {REWARDS.map((r, i) => (
              <RewardCard key={r.id} reward={r} index={i} onRedeem={() => {}} />
            ))}
          </View>
        )}

        {/* ── History tab ──────────────────────── */}
        {activeTab === 'history' && (
          <View style={styles.section}>
            <View style={styles.sectionCard}>
              {HISTORY.map((item, i) => (
                <HistoryRow
                  key={item.id}
                  item={item}
                  isLast={i === HISTORY.length - 1}
                  index={i}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },

  header:      {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn:     {
    width: 38, height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    ...SHADOW.card,
  },
  title:       {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerSpacer: { width: 38 },

  cardWrap:    { paddingHorizontal: SPACING.md, marginTop: SPACING.sm },

  section:     { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  sectionTitle:{ color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    padding: SPACING.md,
    ...SHADOW.card,
  },

  tierNoteRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, justifyContent: 'center', marginTop: SPACING.md },
  tierNote:    { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },

  // Tabs — light track, white pill
  tabTrack:    {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.xs,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabPill:     {
    position: 'absolute',
    top: SPACING.xs,
    bottom: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  tabBtn:      { paddingVertical: SPACING.sm + 2, alignItems: 'center', zIndex: 1 },
  tabTxt:      { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  tabTxtActive:{ color: COLORS.text },

  // Rewards grid
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
});

// Points card
const pc = StyleSheet.create({
  card:           {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    overflow: 'hidden',
    minHeight: 196,
    borderWidth: 1,
    borderColor: 'rgba(250,247,242,0.06)',
  },
  shim:           { position: 'absolute', top: 0, bottom: 0, width: 90 },
  ring1:          { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: 'rgba(250,247,242,0.05)', backgroundColor: 'transparent' },
  ring2:          { position: 'absolute', right: 30, bottom: -60, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: 'rgba(250,247,242,0.04)', backgroundColor: 'transparent' },
  headerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  tierPill:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: 'rgba(255,193,7,0.12)', paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,193,7,0.22)' },
  tierPillTxt:    { color: COLORS.primary, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  tierEmoji:      { fontSize: 36 },
  ptsLabel:       { color: COLORS.bg, fontSize: 12, fontWeight: '500', opacity: 0.55, marginBottom: SPACING.xs },
  ptsRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginBottom: SPACING.md },
  ptsTxt:         { color: COLORS.bg, fontSize: 44, fontWeight: '900', letterSpacing: -1.5, lineHeight: 50 },
  ptsUnit:        { color: COLORS.bg, fontSize: 16, fontWeight: '700', opacity: 0.65, marginBottom: SPACING.sm },
  progressSection:{ gap: SPACING.sm },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLeft:   { color: COLORS.bg, fontSize: 11, fontWeight: '600', opacity: 0.65 },
  progressRight:  { color: COLORS.bg, fontSize: 11, fontWeight: '600', opacity: 0.55 },
});

// Progress bar
const pb = StyleSheet.create({
  bg:   { height: 7, backgroundColor: 'rgba(250,247,242,0.12)', borderRadius: RADIUS.full, overflow: 'hidden' },
  fill: { height: 7, borderRadius: RADIUS.full, overflow: 'hidden' },
});

// Tier track
const tt = StyleSheet.create({
  wrap:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  item:         { alignItems: 'center', gap: SPACING.xs, width: 64 },
  badge:        { width: 48, height: 48, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  badgeDone:    { backgroundColor: COLORS.successLight, borderWidth: 1, borderColor: COLORS.success + '40' },
  badgeActive:  { backgroundColor: COLORS.primaryLight, borderWidth: 2, borderColor: COLORS.secondary, ...SHADOW.card },
  badgeFuture:  { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border },
  badgeEmoji:   { fontSize: 20 },
  name:         { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3 },
  nameActive:   { color: COLORS.secondaryDark },
  nameDone:     { color: COLORS.success },
  activeDot:    { width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: COLORS.secondary },
  line:         { flex: 1, height: 2, backgroundColor: COLORS.border, marginBottom: SPACING.lg },
  lineDone:     { backgroundColor: COLORS.success },
});

// Reward cards
const rw = StyleSheet.create({
  card:         {
    width: (W - SPACING.md * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOW.card,
  },
  cardLocked:   { backgroundColor: COLORS.bg, borderColor: COLORS.border },
  iconBox:      { width: 56, height: 56, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs },
  label:        { color: COLORS.text, fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
  labelLocked:  { color: COLORS.textMuted },
  ptsRow:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  ptsTxt:       { color: COLORS.textSub, fontSize: 12, fontWeight: '700' },
  ptsLocked:    { color: COLORS.border },
  btn:          { width: '100%' , paddingHorizontal : 15 , paddingVertical: SPACING.sm, borderRadius: RADIUS.full, alignItems: 'center',  flexDirection: 'row', marginTop: SPACING.xs },
  btnActive:    { backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.secondary },
  btnLocked:    { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border },
  btnTxt:       { color: COLORS.secondaryDark, fontSize: 12, fontWeight: '800' },
  btnTxtLocked: { color: COLORS.textMuted },
});

// Earn rows
const er = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBox:   { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  label:     { color: COLORS.text, fontSize: 14, fontWeight: '700', letterSpacing: -0.1 },
  pts:       { color: COLORS.textMuted, fontSize: 12, marginTop: 2, fontWeight: '500' },
});

// History rows
const hr = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  border:      { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dot:         { width: 36, height: 36, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  dotEarn:     { backgroundColor: COLORS.successLight },
  dotRedeem:   { backgroundColor: COLORS.warningLight },
  label:       { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  date:        { color: COLORS.textMuted, fontSize: 11, marginTop: 2, fontWeight: '500' },
  badge:       { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  badgeEarn:   { backgroundColor: COLORS.successLight },
  badgeRedeem: { backgroundColor: COLORS.warningLight },
  pts:         { fontSize: 13, fontWeight: '800' },
  ptsEarn:     { color: COLORS.success },
  ptsRedeem:   { color: COLORS.warning },
});