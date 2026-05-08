import React, { useEffect } from 'react';
import { View, Text, Image, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, withSequence, withRepeat, Easing, runOnJS,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W, height: H } = Dimensions.get('window');

// ─── PALETTE ─────────────────────────────────────────────────────────────────────
const BG       = '#050403';
const BG_MID   = '#0F0C07';
const BG_TOP   = '#1A1610';
const GOLD     = '#FFC107';
const AMBER    = '#E8A020';
const DARK     = '#CC7A00';
const CREAM    = '#FAF7F2';
const BLUE     = '#29ABE2';        // Cloudilic blue from logo
const MUTED    = 'rgba(250,247,242,0.40)';
const DIM      = 'rgba(250,247,242,0.10)';

// ─── ANIMATED RING ────────────────────────────────────────────────────────────────
const PulseRing = ({ delay, size, color, duration }) => {
  const scale = useSharedValue(0.6);
  const op    = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(2.2, { duration, easing: Easing.out(Easing.quad) })
        ), -1, false
      )
    );
    op.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 0 }),
          withTiming(0, { duration, easing: Easing.out(Easing.quad) })
        ), -1, false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity:   op.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[
      {
        position:     'absolute',
        width:        size,
        height:       size,
        borderRadius: size / 2,
        borderWidth:  1.5,
        borderColor:  color,
      },
      style,
    ]} />
  );
};

// ─── SPINNING ARC LOADER ─────────────────────────────────────────────────────────
const SpinArc = ({ size, color, duration, clockwise = true }) => {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(clockwise ? 360 : -360, {
        duration,
        easing: Easing.linear,
      }), -1, false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={[
      {
        position:    'absolute',
        width:       size,
        height:      size,
        borderRadius: size / 2,
        borderWidth:  2,
        borderTopColor:    color,
        borderRightColor:  'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor:   'transparent',
      },
      style,
    ]} />
  );
};

// ─── PARTICLE DOT ────────────────────────────────────────────────────────────────
const Particle = ({ angle, radius, color, delay }) => {
  const op    = useSharedValue(0);
  const dist  = useSharedValue(0);

  const rad = (angle * Math.PI) / 180;
  const tx  = Math.cos(rad) * radius;
  const ty  = Math.sin(rad) * radius;

  useEffect(() => {
    op.value   = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1,   { duration: 400 }),
        withTiming(0.4, { duration: 800 }),
        withTiming(1,   { duration: 400 }),
      ), -1, false
    ));
    dist.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1,   { duration: 600, easing: Easing.out(Easing.quad) }),
        withTiming(0.85,{ duration: 600, easing: Easing.in(Easing.quad) }),
      ), -1, false
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity:   op.value,
    transform: [
      { translateX: tx * dist.value },
      { translateY: ty * dist.value },
    ],
  }));

  return (
    <Animated.View style={[
      {
        position:        'absolute',
        width:           5,
        height:          5,
        borderRadius:    3,
        backgroundColor: color,
      },
      style,
    ]} />
  );
};

// ─── LOADING BAR ─────────────────────────────────────────────────────────────────
const LoadingBar = ({ totalDuration, onComplete }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: totalDuration - 500,
      easing:   Easing.bezier(0.1, 0.4, 0.6, 1.0),
    });
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.6, 1, 0.7], Extrapolation.CLAMP),
  }));

  return (
    <View style={bar.track}>
      <Animated.View style={[bar.fill, barStyle]}>
        <LinearGradient
          colors={[BLUE, GOLD, AMBER]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Glow tip */}
        <Animated.View style={[bar.tip, glowStyle]} />
      </Animated.View>
    </View>
  );
};

const bar = StyleSheet.create({
  track: {
    width:           220,
    height:          3,
    backgroundColor: DIM,
    borderRadius:    2,
    overflow:        'hidden',
  },
  fill: {
    height:       '100%',
    borderRadius: 2,
    overflow:     'visible',
    position:     'relative',
  },
  tip: {
    position:        'absolute',
    right:           -6,
    top:             -4,
    width:           12,
    height:          12,
    borderRadius:    6,
    backgroundColor: GOLD,
    shadowColor:     GOLD,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   1,
    shadowRadius:    8,
    elevation:       0,
  },
});

// ─── MAIN ────────────────────────────────────────────────────────────────────────
export default function SplashScreen({ navigation }) {
  const glowOp       = useSharedValue(0);
  const glowScale    = useSharedValue(0.3);
  const logoOp       = useSharedValue(0);
  const logoScale    = useSharedValue(0.5);
  const logoY        = useSharedValue(20);
  const shimmerX     = useSharedValue(-160);
  const nameOp       = useSharedValue(0);
  const nameY        = useSharedValue(28);
  const lineW        = useSharedValue(0);
  const tagOp        = useSharedValue(0);
  const tagY         = useSharedValue(14);
  const creditOp     = useSharedValue(0);
  const creditY      = useSharedValue(14);
  const loaderOp     = useSharedValue(0);
  const madeByOp     = useSharedValue(0);
  const madeByY      = useSharedValue(12);
  const screenOp     = useSharedValue(1);
  const screenY      = useSharedValue(0);
  const bgBlurOp     = useSharedValue(0);

  const TOTAL = 4000; // 4 seconds

  const goNext = async () => {
    try {
      const seen = await AsyncStorage.getItem('@onboarded');
      navigation.replace(seen ? 'MainTabs' : 'Onboarding');
    } catch {
      navigation.replace('Onboarding');
    }
  };

  const exit = () => {
    screenOp.value = withTiming(0, { duration: 450, easing: Easing.in(Easing.cubic) },
      (fin) => { if (fin) runOnJS(goNext)(); }
    );
    screenY.value  = withTiming(-24, { duration: 450 });
    bgBlurOp.value = withTiming(1,   { duration: 400 });
  };

  useEffect(() => {
    // ① bg warm glow bloom
    glowOp.value    = withTiming(1, { duration: 900 });
    glowScale.value = withSpring(1, { damping: 12, stiffness: 60 });

    // ② Logo pop in
    logoOp.value    = withDelay(200, withTiming(1, { duration: 400 }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 11, stiffness: 160 }));
    logoY.value     = withDelay(200, withSpring(0, { damping: 14 }));

    // ③ Shimmer sweep over logo
    shimmerX.value  = withDelay(620,
      withTiming(320, { duration: 700, easing: Easing.out(Easing.quad) })
    );

    // ④ Brand name rises in
    nameOp.value = withDelay(800,  withTiming(1, { duration: 400 }));
    nameY.value  = withDelay(800,  withSpring(0, { damping: 16, stiffness: 150 }));

    // ⑤ Underline expands
    lineW.value  = withDelay(1080, withSpring(80, { damping: 14, stiffness: 100 }));

    // ⑥ Tagline
    tagOp.value  = withDelay(1150, withTiming(1, { duration: 380 }));
    tagY.value   = withDelay(1150, withSpring(0, { damping: 16 }));

    // ⑦ Copyright
    creditOp.value = withDelay(1450, withTiming(1, { duration: 360 }));
    creditY.value  = withDelay(1450, withSpring(0, { damping: 16 }));

    // ⑧ Loader bar + arcs
    loaderOp.value = withDelay(1700, withTiming(1, { duration: 300 }));

    // ⑨ "Made by" credit
    madeByOp.value = withDelay(2100, withTiming(1, { duration: 360 }));
    madeByY.value  = withDelay(2100, withSpring(0, { damping: 16 }));

    // ⑩ Exit at 4 s
    const t = setTimeout(() => runOnJS(exit)(), TOTAL);
    return () => clearTimeout(t);
  }, []);

  const glowStyle   = useAnimatedStyle(() => ({ opacity: glowOp.value,   transform: [{ scale: glowScale.value }] }));
  const logoStyle   = useAnimatedStyle(() => ({ opacity: logoOp.value,   transform: [{ scale: logoScale.value }, { translateY: logoY.value }] }));
  const shimStyle   = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));
  const nameStyle   = useAnimatedStyle(() => ({ opacity: nameOp.value,   transform: [{ translateY: nameY.value  }] }));
  const lineStyle   = useAnimatedStyle(() => ({ width: lineW.value }));
  const tagStyle    = useAnimatedStyle(() => ({ opacity: tagOp.value,    transform: [{ translateY: tagY.value   }] }));
  const creditStyle = useAnimatedStyle(() => ({ opacity: creditOp.value, transform: [{ translateY: creditY.value }] }));
  const loaderStyle = useAnimatedStyle(() => ({ opacity: loaderOp.value }));
  const madeByStyle = useAnimatedStyle(() => ({ opacity: madeByOp.value, transform: [{ translateY: madeByY.value }] }));
  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOp.value, transform: [{ translateY: screenY.value }] }));

  // Particle config
  const PARTICLES = [
    { angle: 0,   radius: 130, color: GOLD,  delay: 400  },
    { angle: 45,  radius: 115, color: BLUE,  delay: 600  },
    { angle: 90,  radius: 140, color: AMBER, delay: 200  },
    { angle: 135, radius: 120, color: BLUE,  delay: 800  },
    { angle: 180, radius: 130, color: GOLD,  delay: 500  },
    { angle: 225, radius: 110, color: AMBER, delay: 350  },
    { angle: 270, radius: 135, color: BLUE,  delay: 700  },
    { angle: 315, radius: 118, color: GOLD,  delay: 450  },
  ];

  return (
    <Animated.View style={[s.root, screenStyle]}>
      {/* ── Background gradient ── */}
      <LinearGradient
        colors={[BG_TOP, BG_MID, BG]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Corner grain accents ── */}
      <LinearGradient
        colors={[GOLD + '14', 'transparent']}
        style={s.cornerTopLeft}
      />
      <LinearGradient
        colors={[BLUE + '10', 'transparent']}
        style={s.cornerBottomRight}
      />

      {/* ── Ambient glow ── */}
      <Animated.View style={[s.glow, glowStyle]} pointerEvents="none" />

      {/* ── Orbital pulse rings ── */}
      <PulseRing delay={0}    size={200} color={`rgba(255,193,7,0.25)`} duration={2200} />
      <PulseRing delay={700}  size={200} color={`rgba(41,171,226,0.20)`} duration={2200} />
      <PulseRing delay={1400} size={200} color={`rgba(255,193,7,0.15)`} duration={2200} />

      {/* ── Orbiting particles ── */}
      <View style={s.particleWrap} pointerEvents="none">
        {PARTICLES.map((p, i) => (
          <Particle key={i} {...p} />
        ))}
      </View>

      {/* ── Spinning arc loaders (decorative) ── */}
      <SpinArc size={220} color={`rgba(255,193,7,0.20)`} duration={5000}  clockwise={true}  />
      <SpinArc size={196} color={`rgba(41,171,226,0.18)`} duration={3800} clockwise={false} />
      <SpinArc size={172} color={`rgba(255,193,7,0.14)`} duration={2800}  clockwise={true}  />

      {/* ── Logo block ── */}
      <Animated.View style={[s.logoWrap, logoStyle]}>
        {/* Gradient border ring */}
        <LinearGradient
          colors={[GOLD, BLUE, AMBER, BLUE, GOLD]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.logoBorderGrad}
        />
        {/* Inner dark circle */}
        <View style={s.logoInner}>
          {/* Shimmer sweep */}
          <Animated.View style={[s.shimWrap, shimStyle]} pointerEvents="none">
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.16)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.shimGrad}
            />
          </Animated.View>
          {/* Cloudilic logo image */}
          <Image
            source={require('../assets/Cloudilic Dragify Logo.png')}
            style={s.logoImg}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* ── Brand name ── */}
      <Animated.View style={[s.nameWrap, nameStyle]}>
        <Text style={s.name}>CLOUDILIC</Text>
        <Animated.View style={[s.nameLine, lineStyle]} />
      </Animated.View>

      {/* ── Tagline ── */}
      <Animated.Text style={[s.tag, tagStyle]}>
        Everything, Delivered Fast
      </Animated.Text>

      {/* ── Copyright Arabic + English ── */}
      <Animated.View style={[s.creditBlock, creditStyle]}> 
        <Text style={s.creditEn}>© {new Date().getFullYear()} Cloudilic. All rights reserved.</Text>
      </Animated.View>

      {/* ── Loading bar + spinning arc ── */}
      <Animated.View style={[s.loaderWrap, loaderStyle]}>
        <LoadingBar totalDuration={TOTAL - 800} />
        <Text style={s.loadingTxt}>Loading…</Text>
      </Animated.View>

      {/* ── "Made by" footer ── */}
      <Animated.View style={[s.madeByWrap, madeByStyle]}>
        <View style={s.madeByLine} />
        <Text style={s.madeByTxt}>Demo crafted by</Text>
        <LinearGradient
          colors={[BLUE, GOLD]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.madeByBadge}
        >
          <Ionicons name="code-slash-outline" size={12} color={BG} style={{ marginRight: 5 }} />
          <Text style={s.madeByName}>Cloudilic Dev Team</Text>
        </LinearGradient>
        <View style={s.madeByLine} />
      </Animated.View>
    </Animated.View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────────
const LOGO_SIZE  = 152;
const BORDER_W   = 3;
const INNER_SIZE = LOGO_SIZE - BORDER_W * 2 - 10;

const s = StyleSheet.create({
  root: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: BG,
  },

  // Corner accents
  cornerTopLeft: {
    position:     'absolute',
    top:          0,
    left:         0,
    width:        200,
    height:       200,
    borderRadius: 0,
    transform:    [{ rotate: '45deg' }, { translateX: -100 }, { translateY: -100 }],
  },
  cornerBottomRight: {
    position:     'absolute',
    bottom:       0,
    right:        0,
    width:        180,
    height:       180,
    borderRadius: 0,
    transform:    [{ rotate: '45deg' }, { translateX: 90 }, { translateY: 90 }],
  },

  // Ambient glow
  glow: {
    position:        'absolute',
    width:           360,
    height:          360,
    borderRadius:    180,
    backgroundColor: 'transparent',
    shadowColor:     GOLD,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.22,
    shadowRadius:    90,
    elevation:       0,
  },

  // Particles center point
  particleWrap: {
    position: 'absolute',
    width:    0,
    height:   0,
    top:      H * 0.5 - 76,   // center of logo area
    left:     W * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logo outer
  logoWrap: {
    width:        LOGO_SIZE,
    height:       LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    padding:      BORDER_W + 5,
    marginBottom: 32,
    alignItems:   'center',
    justifyContent: 'center',
    shadowColor:  GOLD,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation:    14,
  },
  logoBorderGrad: {
    position:     'absolute',
    width:        LOGO_SIZE,
    height:       LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    inset:        0,
  },
  logoInner: {
    width:          INNER_SIZE,
    height:         INNER_SIZE,
    borderRadius:   INNER_SIZE / 2,
    backgroundColor: BG_MID,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
    borderWidth:    1,
    borderColor:    'rgba(255,193,7,0.10)',
  },
  logoImg: {
    width:  INNER_SIZE * 0.75,
    height: INNER_SIZE * 0.75,
  },
  shimWrap: {
    position: 'absolute',
    top:      0,
    left:    -160,
    height:  '100%',
    width:    160,
  },
  shimGrad: {
    flex:  1,
    width: 160,
  },

  // Brand name
  nameWrap: {
    alignItems:   'center',
    marginBottom: 10,
    gap:          10,
  },
  name: {
    fontSize:      30,
    fontWeight:    '900',
    color:         CREAM,
    letterSpacing: 7,
  },
  nameLine: {
    height:          2.5,
    borderRadius:    2,
    backgroundColor: GOLD,
    // starts at 0 width via animation
  },

  // Tagline
  tag: {
    fontSize:      13,
    color:         MUTED,
    fontWeight:    '500',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom:  6,
  },

  // Copyright block
  creditBlock: {
    alignItems:   'center',
    marginTop:    18,
    marginBottom: 0,
    gap:          4,
  },
  creditAr: {
    fontSize:      13,
    color:         MUTED,
    fontWeight:    '600',
    letterSpacing: 0.6,
    textAlign:     'center',
    writingDirection: 'rtl',
  },
  creditEn: {
    fontSize:      11,
    color:         `rgba(250,247,242,0.22)`,
    fontWeight:    '400',
    letterSpacing: 0.4,
    textAlign:     'center',
  },

  // Loader bar
  loaderWrap: {
    position:   'absolute',
    bottom:     H * 0.14,
    alignItems: 'center',
    gap:        12,
  },
  loadingTxt: {
    fontSize:      11,
    color:         `rgba(250,247,242,0.28)`,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight:    '500',
  },

  // "Made by" footer
  madeByWrap: {
    position:      'absolute',
    bottom:        H * 0.05,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  madeByLine: {
    width:           24,
    height:          1,
    backgroundColor: DIM,
  },
  madeByTxt: {
    fontSize:      11,
    color:         `rgba(250,247,242,0.22)`,
    fontWeight:    '400',
    letterSpacing: 0.4,
  },
  madeByBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      20,
  },
  madeByName: {
    fontSize:      11,
    fontWeight:    '700',
    color:         BG,
    letterSpacing: 0.3,
  },
});