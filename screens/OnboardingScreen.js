import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Dimensions, StyleSheet,
} from 'react-native';
import { FONTS } from '../constants/fonts';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, withDelay, Easing, interpolate,
  useAnimatedScrollHandler, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────────
const { width: W, height: H } = Dimensions.get('window');

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

const SHADOW = {
  card: {
    shadowColor: '#3D2B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  cardStrong: {
    shadowColor: '#1A0F00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 14,
  },
  float: {
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
};

const ANIM = {
  spring:     { damping: 16, stiffness: 160 },
  springFast: { damping: 12, stiffness: 200 },
  springSlow: { damping: 20, stiffness: 120 },
  duration:   { fast: 150, normal: 280, slow: 450 },
};

// ─── FAKE DATA ────────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: '1',
    headline: 'Everything You Need,\nDelivered Fast',
    sub: 'Groceries, food, medicine, gadgets — all in one app. Order in seconds.',
    gradient: ['#2A1F0E', '#332614', '#3D2B1A'],
    accentColor: COLORS.primary,
    emoji: ['🛒', '🍔', '💊', '📱'],
    illustration: 'cards',
    label: 'SHOP SMARTER',
  },
  {
    id: '2',
    headline: 'Shop from 100+\nLocal Stores',
    sub: 'Support local businesses while getting the best prices in your city.',
    gradient: ['#1E1A12', '#2A2418', '#33291C'],
    accentColor: COLORS.primary,
    emoji: ['🏪', '🏬', '🏦', '🏢'],
    illustration: 'map',
    label: 'GO LOCAL',
  },
  {
    id: '3',
    headline: 'Real-Time\nOrder Tracking',
    sub: 'Know exactly where your order is, every second of the way.',
    gradient: ['#1C1A10', '#26220E', '#302A12'],
    accentColor: COLORS.primary,
    emoji: ['📍', '🏍', '⏱', '✅'],
    illustration: 'track',
    label: 'STAY UPDATED',
  },
];

// ─── usePress HOOK ────────────────────────────────────────────────────────────────
const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const onPressIn  = () => { scale.value = withSpring(0.94, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1, ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────────

/**
 * Slide 1 — Stacked product cards illustration
 * Improvements: cards are fanned at distinct angles, each fully readable,
 * stronger white backgrounds, clear price chips, animated glow on top card.
 */
const CardsIllustration = () => {
  // Independent float animations per card
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const glow   = useSharedValue(0.6);

  useEffect(() => {
    float1.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,  { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ), -1, false
    );
    float2.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(-5, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,  { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ), -1, false
    ));
    float3.value = withDelay(1200, withRepeat(
      withSequence(
        withTiming(-4, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,  { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ), -1, false
    ));
    glow.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 1600 }),
        withTiming(0.5, { duration: 1600 }),
      ), -1, false
    );
  }, []);

  const s1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: float1.value },
      { rotate: '-18deg' },
      { translateX: -38 },
    ],
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: float2.value },
      { rotate: '-6deg' },
      { translateX: -12 },
    ],
  }));
  const s3 = useAnimatedStyle(() => ({
    transform: [
      { translateY: float3.value },
      { rotate: '6deg' },
      { translateX: 14 },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const CARDS = [
    {
      label: 'Burger Express',
      icon: '🍔',
      price: 'QAR 190',
      tag: 'Food',
      tagColor: COLORS.warning,
      tagBg: COLORS.warningLight,
      s: s1,
      zIndex: 1,
    },
    {
      label: 'Fresh Market',
      icon: '🛒',
      price: 'QAR 85',
      tag: 'Grocery',
      tagColor: COLORS.success,
      tagBg: COLORS.successLight,
      s: s2,
      zIndex: 2,
    },
    {
      label: 'PharmaCare',
      icon: '💊',
      price: 'QAR 45',
      tag: 'Medicine',
      tagColor: COLORS.info,
      tagBg: COLORS.infoLight,
      s: s3,
      zIndex: 3,
    },
  ];

  return (
    <View style={[ill.wrap , {marginBottom : 150}]}>
      {/* Ambient glow beneath cards */}
      <Animated.View style={[ill.ambientGlow, glowStyle]} />

      {CARDS.map((c, i) => (
        <Animated.View
          key={i}
          style={[
            ill.card,
            { zIndex: c.zIndex },
            SHADOW.cardStrong,
            c.s,
          ]}
        >
          {/* Full white background for crisp readability */}
          <View style={ill.cardInner}>
            {/* Top row: icon + name + tag */}
            <View style={ill.cardTopRow}>
              <View style={ill.cardIconWrap}>
                <Text style={{ fontSize: 20 }}>{c.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={ill.cardLabel} numberOfLines={1}>{c.label}</Text>
                <View style={[ill.cardTag, { backgroundColor: c.tagBg }]}>
                  <Text style={[ill.cardTagTxt, { color: c.tagColor }]}>{c.tag}</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={ill.cardDivider} />

            {/* Bottom row: price + add button */}
            <View style={ill.cardBottomRow}>
              <View>
                <Text style={ill.cardPriceLabel}>Total</Text>
                <Text style={ill.cardPrice}>{c.price}</Text>
              </View>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={ill.cardBtn}
              >
                <Ionicons name="add" size={20} color={COLORS.text} />
              </LinearGradient>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// Slide 2 — Radar map dots (refined)
const MapIllustration = ({ accentColor }) => {
  const rings  = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  const dotPop = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];

  useEffect(() => {
    rings.forEach((r, i) => {
      r.value = withDelay(
        i * 700,
        withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), -1, false)
      );
    });
    dotPop.forEach((d, i) => {
      d.value = withDelay(
        300 + i * 200,
        withSpring(1, { damping: 14, stiffness: 180 })
      );
    });
  }, []);

  const ringStyles = rings.map((r) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: r.value * 3.2 + 1 }],
      opacity: interpolate(r.value, [0, 0.4, 1], [0.7, 0.4, 0]),
    }))
  );

  const DOTS = [
    { x: W * 0.16, y: 20,  emoji: '🏪' },
    { x: W * 0.58, y: 5,   emoji: '🏬' },
    { x: W * 0.28, y: 100, emoji: '🏦' },
    { x: W * 0.62, y: 90,  emoji: '🏢' },
  ];

  return (
    <View style={ill.wrap}>
      {ringStyles.map((rs, i) => (
        <Animated.View
          key={i}
          style={[
            ill.ring,
            { borderColor: COLORS.primary + '70', borderWidth: 1.5 },
            rs,
          ]}
        />
      ))}

      {/* Center pin with glow */}
      <View style={ill.centerDot}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={ill.centerDotGrad}
        >
          <Text style={{ fontSize: 22 }}>📍</Text>
        </LinearGradient>
      </View>

      {DOTS.map((d, i) => {
        const ps = useAnimatedStyle(() => ({
          transform: [{ scale: dotPop[i].value }],
          opacity: dotPop[i].value,
        }));
        return (
          <Animated.View key={i} style={[ill.mapDot, { left: d.x - 20, top: d.y }, ps]}>
            <Text style={{ fontSize: 22 }}>{d.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

// Slide 3 — Rider tracking (refined)
const TrackIllustration = () => {
  const riderX     = useSharedValue(0);
  const etaPulse   = useSharedValue(1);
  const progress   = useSharedValue(0);

  useEffect(() => {
    riderX.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 800 })
      ),
      -1, true
    );
    etaPulse.value = withRepeat(
      withSequence(withTiming(1.07, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1, false
    );
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 800 })
      ),
      -1, true
    );
  }, []);

  const riderStyle = useAnimatedStyle(() => ({
    left: `${riderX.value * 58 + 14}%`,
  }));

  const etaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: etaPulse.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 58}%`,
  }));

  return (
    <View style={ill.wrap}>
      {/* Route track background */}
      <View style={ill.routeTrack} />
      {/* Animated filled progress */}
      <Animated.View style={[ill.routeProgress, progressStyle]} />

      {/* Store pin */}
      <View style={[ill.trackPin, { left: '12%' }]}>
        <View style={ill.trackPinInner}>
          <Text style={{ fontSize: 26 }}>🏪</Text>
        </View>
      </View>

      {/* Home pin */}
      <View style={[ill.trackPin, { right: '12%' }]}>
        <View style={ill.trackPinInner}>
          <Text style={{ fontSize: 26 }}>🏠</Text>
        </View>
      </View>

      {/* Rider */}
      <Animated.View style={[ill.rider, riderStyle]}>
        <View style={ill.riderWrap}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={ill.riderGrad}
          >
            <Text style={{ fontSize: 22 }}>🏍</Text>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* ETA badge */}
      <Animated.View style={[ill.etaWrap, etaStyle]}>
        <LinearGradient
          colors={[COLORS.surface, COLORS.surfaceAlt]}
          style={ill.eta}
        >
          <Ionicons name="time-outline" size={13} color={COLORS.primary} style={{ marginRight: 5 }} />
          <Text style={ill.etaTxt}>ETA </Text>
          <Text style={ill.etaHighlight}>12 min</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// Dot indicator
const Dots = ({ count, active }) => (
  <View style={dot.row}>
    {Array.from({ length: count }).map((_, i) => {
      const w  = useSharedValue(i === active ? 28 : 8);
      const op = useSharedValue(i === active ? 1 : 0.3);
      useEffect(() => {
        w.value  = withSpring(i === active ? 28 : 8, { damping: 14 });
        op.value = withTiming(i === active ? 1 : 0.3, { duration: 250 });
      }, [active]);
      const s = useAnimatedStyle(() => ({ width: w.value, opacity: op.value }));
      return <Animated.View key={i} style={[dot.dot, s]} />;
    })}
  </View>
);

// Step counter chip
const StepChip = ({ active, total }) => (
  <View style={styles.stepChip}>
    <Text style={styles.stepCurrent}>{String(active + 1).padStart(2, '0')}</Text>
    <Text style={styles.stepSep}> / </Text>
    <Text style={styles.stepTotal}>{String(total).padStart(2, '0')}</Text>
  </View>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const flatRef   = useRef(null);
  const skipOp    = useSharedValue(1);
  const btnPress  = usePress();

  // Slide-level entrance
  const slideOpacity = useSharedValue(0);
  const slideTransY  = useSharedValue(30);
  const headlineX    = useSharedValue(-20);
  const subOp        = useSharedValue(0);

  const triggerSlideEntrance = () => {
    slideOpacity.value = 0;
    slideTransY.value  = 30;
    headlineX.value    = -20;
    subOp.value        = 0;

    slideOpacity.value = withTiming(1, { duration: ANIM.duration.normal });
    slideTransY.value  = withSpring(0, ANIM.spring);
    headlineX.value    = withDelay(80, withSpring(0, ANIM.spring));
    subOp.value        = withDelay(160, withTiming(1, { duration: 320 }));
  };

  useEffect(() => {
    triggerSlideEntrance();
  }, [activeIdx]);

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity:   slideOpacity.value,
    transform: [{ translateY: slideTransY.value }],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: headlineX.value }],
  }));
  const subStyle = useAnimatedStyle(() => ({
    opacity: subOp.value,
  }));

  const goNext = () => {
    const next = activeIdx + 1;
    if (next < SLIDES.length) {
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIdx(next);
      skipOp.value = withTiming(next === SLIDES.length - 1 ? 0 : 1, { duration: 200 });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.replace('Auth');
    }
  };

  const onScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    if (idx !== activeIdx) {
      setActiveIdx(idx);
      skipOp.value = withTiming(idx === SLIDES.length - 1 ? 0 : 1, { duration: 200 });
    }
  };

  const skipStyle = useAnimatedStyle(() => ({ opacity: skipOp.value }));
  const slide = SLIDES[activeIdx];

  const renderSlide = ({ item }) => (
    <View style={{ width: W, height: H }}>
      <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFill} />
      {/* Subtle warm grain */}
      <View style={styles.grainOverlay} />
      {/* Subtle vignette at edges */}
      <LinearGradient
        colors={['rgba(26,15,0,0.4)', 'transparent', 'transparent', 'rgba(26,15,0,0.2)']}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Illustration area */}
      <View style={styles.illContainer}>
        {item.illustration === 'cards' && <CardsIllustration />}
        {item.illustration === 'map'   && <MapIllustration accentColor={item.accentColor} />}
        {item.illustration === 'track' && <TrackIllustration accentColor={item.accentColor} />}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* App wordmark */}
      {/* <View style={[styles.topBar , {marginTop : 20}]}>
        <View style={styles.wordmarkRow}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.wordmarkDot}
          />
          <Text style={styles.wordmark}>Quick</Text>
        </View>
 
      </View> */}


      <View style={[styles.logoBlock , {position : 'absolute' , top : 70 , left : SPACING.lg , zIndex : 99}]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.logoCircle}
            >
              <Text style={styles.logoLetter}>Q</Text>
            </LinearGradient>
            <View>
              <Text style={styles.logoName}>Quick</Text>
              <Text style={styles.logoTagline}>Deliver everything, fast.</Text>
            </View>
          </View>

      {/* Skip */}
      <Animated.View style={[styles.skipWrap, skipStyle , {marginTop : 20}]}>
        <TouchableOpacity onPress={() => navigation.replace('Auth')} activeOpacity={0.7}>
          <View style={styles.skipPill}>
            <Text style={styles.skipTxt}>Skip</Text>
            <Ionicons name="arrow-forward" size={12} color={COLORS.textMuted} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(i) => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1  }}
      />

      {/* Bottom overlay content */}
      <View style={styles.bottom}>
        <LinearGradient
          colors={['transparent', 'rgba(26,20,8,0.72)', 'rgba(26,20,8,0.97)']}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View style={[styles.bottomInner, contentAnimStyle]}>
          {/* Label pill */}
          <View style={styles.labelPill}>
            <View style={styles.labelDot} />
            <Text style={styles.labelTxt}>{slide.label}</Text>
          </View>

          {/* Headline + sub */}
          <View style={styles.textBlock}>
            <Animated.Text style={[styles.headline, headlineStyle]}>
              {slide.headline}
            </Animated.Text>
            <Animated.Text style={[styles.sub, subStyle]}>
              {slide.sub}
            </Animated.Text>
          </View>

          {/* Dots + CTA row */}
          <View style={styles.actionRow}>
            <Dots count={SLIDES.length} active={activeIdx} />

            <Animated.View style={btnPress.animStyle}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  goNext();
                }}
                onPressIn={btnPress.onPressIn}
                onPressOut={btnPress.onPressOut}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.nextBtn, SHADOW.float]}
                >
                  <Text style={styles.nextBtnTxt}>
                    {activeIdx === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                  <View style={styles.nextBtnIcon}>
                    <Ionicons
                      name={activeIdx === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
                      size={16}
                      color={COLORS.text}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2e2200',
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,193,7,0.025)',
  },


  // ── Logo ──
  logoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.float,
  },
  logoLetter: {
    fontSize: 26,
    fontFamily: FONTS.black,
    color: COLORS.text,
    marginTop: 1,
  },
  logoName: {
    fontSize: 26,
    fontFamily: FONTS.black,
    color: COLORS.primaryLight,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  logoTagline: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },


  topBar: {
    position: 'absolute',
    top: 56,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  wordmarkDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  wordmark: {
    color: COLORS.bg,
    fontSize: 20,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.5,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250,247,242,0.09)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(250,247,242,0.13)',
  },
  stepCurrent: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONTS.extrabold,
  },
  stepSep: {
    color: 'rgba(250,247,242,0.25)',
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  stepTotal: {
    color: 'rgba(250,247,242,0.4)',
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  skipWrap: {
    position: 'absolute',
    top: 52,
    right: SPACING.lg,
    zIndex: 99,
  },
  skipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(250,247,242,0.08)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(250,247,242,0.12)',
  },
  skipTxt: {
    color: 'rgba(250,247,242,0.5)',
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  illContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 110,
    paddingBottom: 40,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  bottomInner: {
    gap: SPACING.lg,
  },
  labelPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,193,7,0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.22)',
  },
  labelDot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  labelTxt: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    letterSpacing: 1.2,
    color: COLORS.primary,
    opacity: 0.85,
  },
  textBlock: {
    gap: SPACING.sm,
  },
  headline: {
    fontSize: 34,
    fontFamily: FONTS.extrabold,
    lineHeight: 42,
    color: COLORS.bg,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    color: 'rgba(250,247,242,0.55)',
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    height: 54,
    borderRadius: RADIUS.full,
    minWidth: 140,
  },
  nextBtnTxt: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.bold,
    flex: 1,
    textAlign: 'center',
  },
  nextBtnIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(26,15,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── ILLUSTRATION STYLES ──────────────────────────────────────────────────────────
const ill = StyleSheet.create({
  wrap: {
    width: W * 0.88,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // ── Cards ──
  ambientGlow: {
    position: 'absolute',
    width: W * 0.72,
    height: 180,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    opacity: 0.12,
    // blur simulation via shadow
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 0,
  },
  card: {
    position: 'absolute',
    width: W * 0.70,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(232,220,200,0.9)',
  },
  cardInner: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 3,
  },
  cardTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  cardTagTxt: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    letterSpacing: 0.3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPriceLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginBottom: 1,
  },
  cardPrice: {
    color: COLORS.text,
    fontSize: 18,
    fontFamily: FONTS.extrabold,
    letterSpacing: -0.3,
  },
  cardBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.float,
  },

  // ── Map ──
  ring: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
  },
  centerDot: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,193,7,0.3)',
    ...SHADOW.card,
  },
  centerDotGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapDot: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },

  // ── Track ──
  routeTrack: {
    position: 'absolute',
    top: '50%',
    left: '14%',
    right: '14%',
    height: 4,
    backgroundColor: 'rgba(232,220,200,0.25)',
    borderRadius: 2,
  },
  routeProgress: {
    position: 'absolute',
    top: '50%',
    left: '14%',
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  trackPin: {
    position: 'absolute',
    top: '30%',
    alignItems: 'center',
  },
  trackPinInner: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  rider: {
    position: 'absolute',
    top: '18%',
  },
  riderWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,193,7,0.5)',
    ...SHADOW.float,
  },
  riderGrad: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaWrap: {
    position: 'absolute',
    top: -10,
    right: 0,
  },
  eta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  etaTxt: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  etaHighlight: {
    color: COLORS.text,
    fontSize: 12,
    fontFamily: FONTS.extrabold,
  },
});

// ─── DOT STYLES ───────────────────────────────────────────────────────────────────
const dot = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.secondary,
  },
});