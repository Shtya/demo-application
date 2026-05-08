import React, { useState, useCallback } from 'react';
import { FONTS } from '../constants/fonts';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
  Dimensions, ScrollView, ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, Easing, runOnJS, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ─── BRAND CONSTANTS ──────────────────────────────────────────────────────────────
const { width: W } = Dimensions.get('window');

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
  success:        '#2E7D32',
  successLight:   '#E8F5E9',
  successBorder:  '#B8DDB8',
  error:          '#C62828',
  errorLight:     '#FDECEA',
  warning:        '#E65100',
};

const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const RADIUS  = { sm: 8, md: 12, lg: 16, xl: 24, xxl: 28, full: 999 };
const SHADOW  = {
  card: {
    shadowColor: '#3D2B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 5,
  },
  cardStrong: {
    shadowColor: '#1A0F00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.11,
    shadowRadius: 24,
    elevation: 10,
  },
  float: {
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 8,
  },
  input: {
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 8,
    elevation: 0,
  },
  inputFocused: {
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 0,
  },
};
const ANIM = {
  spring:     { damping: 16, stiffness: 160 },
  springFast: { damping: 12, stiffness: 200 },
  springSlow: { damping: 20, stiffness: 120 },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────────
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => v.replace(/\D/g, '').length >= 8;

// ─── usePress HOOK ────────────────────────────────────────────────────────────────
const usePress = () => {
  const scale    = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring);     };
  return { animStyle, onPressIn, onPressOut };
};

// ─── TRUST PILL ───────────────────────────────────────────────────────────────────
const TrustPill = ({ icon, label, dot }) => (
  <View style={s.trustPill}>
    {dot && <View style={s.trustDot} />}
    {icon && <Text style={s.trustIcon}>{icon}</Text>}
    <Text style={s.trustTxt}>{label}</Text>
  </View>
);

// ─── FIELD COMPONENT ──────────────────────────────────────────────────────────────
const Field = ({
  label, value, onChangeText, secureText,
  placeholder, validate, keyboardType, prefix, icon, dimmed,
}) => {
  const [shown,   setShown]   = useState(false);
  const [focused, setFocused] = useState(false);

  const isValid   = value.length > 0 && (validate ? validate(value) : value.length >= 2);
  const isInvalid = value.length > 0 && !(validate ? validate(value) : value.length >= 2);

  const focusVal  = useSharedValue(0);
  const shakeVal  = useSharedValue(0);

  const handleFocus = () => {
    setFocused(true);
    focusVal.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setFocused(false);
    focusVal.value = withTiming(0, { duration: 200 });
    if (isInvalid) {
      shakeVal.value = withSequence(
        withTiming(-5, { duration: 55 }),
        withTiming( 5, { duration: 55 }),
        withTiming(-4, { duration: 55 }),
        withTiming( 4, { duration: 55 }),
        withTiming( 0, { duration: 55 }),
      );
    }
  };

  const wrapAnim = useAnimatedStyle(() => {
    const borderColor = isValid
      ? "#11111110"
      : isInvalid
      ? COLORS.error
      : focusVal.value > 0.5
      ? COLORS.borderStrong
      : COLORS.border;

    const backgroundColor = isValid
      ? '#eee'
      : isInvalid
      ? COLORS.errorLight
      : focusVal.value > 0.5
      ? COLORS.surface
      : COLORS.surfaceAlt;

    const shadowOpacity = focusVal.value * 0.18;

    return {
      borderColor,
      backgroundColor,
      transform: [{ translateX: shakeVal.value }],
      shadowOpacity,
    };
  });

  const labelAnim = useAnimatedStyle(() => ({
    color: isValid
      ? "#11111180"
      : isInvalid
      ? COLORS.error
      : focusVal.value > 0.5
      ? COLORS.borderStrong
      : COLORS.textSub,
  }));

  return (
    <View style={f.wrap}>
      <View style={f.labelRow}>
        <Animated.Text style={[f.label, labelAnim]}>{label}</Animated.Text>
        {isInvalid && (
          <View style={[f.badge, { backgroundColor: COLORS.errorLight }]}>
            <Ionicons name="alert-circle" size={10} color={COLORS.error} />
            <Text style={[f.badgeTxt, { color: COLORS.error }]}>Check</Text>
          </View>
        )} 
      </View>

      <Animated.View style={[f.inputWrap, wrapAnim, SHADOW.input]}>
        {icon && (
          <View style={f.iconWrap}>
            <Ionicons
              name={icon}
              size={16}
              color={focused ? COLORS.secondary : COLORS.textMuted}
            />
          </View>
        )}

        {prefix && (
          <View style={f.prefixWrap}>
            <Text style={f.prefix}>{prefix}</Text>
            <View style={f.prefixDivider} />
          </View>
        )}

        <TextInput
          style={[f.input, dimmed && { color: COLORS.textMuted }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted + '88'}
          secureTextEntry={secureText && !shown}
          keyboardType={keyboardType || 'default'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {secureText && (
          <TouchableOpacity onPress={() => setShown(p => !p)} style={f.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={shown ? 'eye-off-outline' : 'eye-outline'}
              size={17}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

// ─── LOGO MARK ────────────────────────────────────────────────────────────────────
const LogoMark = () => (
  <View style={s.logoMarkWrap}>
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.logoGrad}
    >
      <Text style={s.logoLetter}>Q</Text>
    </LinearGradient>
  </View>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────
export default function AuthScreen({ navigation }) {
  const insets      = useSafeAreaInsets();
  const [tab, setTab]         = useState('login');
  const [loading, setLoading] = useState(false);

  // Login fields
  const [phone,       setPhone]       = useState('55123456');
  const [pass,        setPass]        = useState('Demo@1234');
  const [phoneDimmed, setPhoneDimmed] = useState(true);
  const [passDimmed,  setPassDimmed]  = useState(true);

  // Register fields
  const [name,   setName]   = useState('');
  const [email,  setEmail]  = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rPass,  setRPass]  = useState('');
  const [rConf,  setRConf]  = useState('');

  // Animations
  const tabX     = useSharedValue(0);
  const trackW   = useSharedValue(0);
  const formOp   = useSharedValue(1);
  const formX    = useSharedValue(0);
  const screenOp = useSharedValue(1);
  const screenSc = useSharedValue(1);
  const heroOp   = useSharedValue(1);
  const btnPress = usePress();

  const switchTab = useCallback((t) => {
    if (t === tab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Fade hero text
    heroOp.value = withTiming(0, { duration: 110 }, () => {
      runOnJS(setTab)(t);
      heroOp.value = withTiming(1, { duration: 220 });
    });

    // Slide form
    formOp.value = withTiming(0, { duration: 120 }, () => {
      formX.value  = t === 'register' ? 30 : -30;
      formOp.value = withTiming(1, { duration: 260 });
      formX.value  = withSpring(0, ANIM.spring);
    });

    tabX.value = withSpring(t === 'login' ? 0 : 1, ANIM.spring);
  }, [tab]);

  // Tab indicator slide
  const indicatorStyle = useAnimatedStyle(() => {
    const p    = SPACING.xs;
    const btnW = trackW.value > 0
      ? (trackW.value - 2 * p) / 2
      : (W - 2 * SPACING.md - 2 * SPACING.lg - 2 * p) / 2;
    return {
      width:     btnW,
      transform: [{ translateX: tabX.value * btnW }],
    };
  });

  const formStyle = useAnimatedStyle(() => ({
    opacity:   formOp.value,
    transform: [{ translateX: formX.value }],
  }));

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOp.value,
  }));

  const wrapStyle = useAnimatedStyle(() => ({
    opacity:   screenOp.value,
    transform: [{ scale: screenSc.value }],
  }));

  const goToMain = useCallback(() => {
    navigation.replace('MainTabs');
  }, [navigation]);

  const handleAuth = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    screenSc.value = withTiming(1.06, { duration: 360, easing: Easing.out(Easing.quad) });
    screenOp.value = withTiming(0, { duration: 360, easing: Easing.in(Easing.quad) }, (fin) => {
      if (fin) runOnJS(goToMain)();
    });
  };

  const isLogin = tab === 'login';

  return (
    <Animated.View style={[s.root, wrapStyle]}>

      {/* ── Background gradient ── */}
      <LinearGradient
        colors={[COLORS.bg, '#F5EFE4', COLORS.bg]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Decorative blobs ── */}
      <View style={s.blobTR} pointerEvents="none">
        <LinearGradient
          colors={[COLORS.primary + '22', COLORS.primary + '00']}
          style={{ flex: 1, borderRadius: RADIUS.full }}
        />
      </View>
      <View style={s.blobBL} pointerEvents="none">
        <LinearGradient
          colors={[COLORS.secondary + '18', COLORS.secondary + '00']}
          style={{ flex: 1, borderRadius: RADIUS.full }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + SPACING.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Brand header ── */}
          <View style={s.brandRow}>
            <LogoMark />
            <View>
              <Text style={s.brandName}>Quick</Text>
              <Text style={s.brandSub}>Fresh Grocery Delivery</Text>
            </View>
          </View>

          {/* ── Welcome hero ── */}
          <Animated.View style={[s.hero, heroStyle]}>
            <Text style={s.eyebrow}>
              {isLogin ? 'WELCOME BACK' : 'GET STARTED'}
            </Text>
            <Text style={s.headline}>
              {isLogin ? 'Sign in to your ' : 'Create your '}
              <Text style={s.headlineItalic}> {isLogin ? 'account' : 'account'} </Text>
            </Text>
            <Text style={s.subhead}>
              {isLogin
                ? 'Continue to your favourite fresh orders'
                : 'Join thousands of happy customers'}
            </Text>
 
          </Animated.View>

          {/* ── Card ── */}
          <View style={s.card}>

            {/* Card top drag handle */}
            <View style={s.cardHandle} />

            {/* ── Tab toggle ── */}
            <View
              style={s.tabTrack}
              onLayout={e => { trackW.value = e.nativeEvent.layout.width; }}
            >
              <Animated.View style={[s.tabIndicator, indicatorStyle]} />

              {(['login', 'register']).map(t => (
                <TouchableOpacity
                  key={t}
                  style={s.tabBtn}
                  onPress={() => switchTab(t)}
                  activeOpacity={0.75}
                >
                  <View style={s.tabInner}>
                    <Ionicons
                      name={t === 'login' ? 'log-in-outline' : 'person-add-outline'}
                      size={14}
                      color={tab === t ? COLORS.text : COLORS.textMuted}
                    />
                    <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
                      {t === 'login' ? 'Sign In' : 'Register'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Form fields ── */}
            <Animated.View style={[s.form, formStyle]}>
              {isLogin ? (
                <>
                  <Field
                    label="Phone Number"
                    value={phone}
                    onChangeText={v => { setPhone(v); setPhoneDimmed(false); }}
                    placeholder="5xxxxxxx"
                    validate={isValidPhone}
                    keyboardType="phone-pad"
                    prefix="🇶🇦 +974"
                    icon="call-outline"
                    dimmed={phoneDimmed}
                  />
                  <Field
                    label="Password"
                    value={pass}
                    onChangeText={v => { setPass(v); setPassDimmed(false); }}
                    placeholder="Enter your password"
                    secureText
                    icon="lock-closed-outline"
                    dimmed={passDimmed}
                  />
                  <TouchableOpacity style={s.forgotRow} activeOpacity={0.7}>
                    <Text style={s.forgotTxt}>Forgot Password?</Text>
                    <Ionicons name="chevron-forward" size={13} color={COLORS.secondary} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Field
                    label="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholder="Ahmed Mohamed"
                    icon="person-outline"
                  />
                  <Field
                    label="Phone Number"
                    value={rPhone}
                    onChangeText={setRPhone}
                    placeholder="5xxxxxxx"
                    validate={isValidPhone}
                    keyboardType="phone-pad"
                    prefix="🇶🇦 +974"
                    icon="call-outline"
                  />
                  <Field
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@email.com"
                    validate={isValidEmail}
                    keyboardType="email-address"
                    icon="mail-outline"
                  />
                  <Field
                    label="Password"
                    value={rPass}
                    onChangeText={setRPass}
                    placeholder="Create a password"
                    secureText
                    icon="lock-closed-outline"
                  />
                  <Field
                    label="Confirm Password"
                    value={rConf}
                    onChangeText={setRConf}
                    placeholder="Repeat your password"
                    secureText
                    validate={v => v === rPass && v.length >= 6}
                    icon="shield-checkmark-outline"
                  />
                </>
              )}
            </Animated.View>

            {/* ── CTA Button ── */}
            <Animated.View style={[s.ctaWrap, btnPress.animStyle]}>
              <TouchableOpacity
                onPress={handleAuth}
                onPressIn={btnPress.onPressIn}
                onPressOut={btnPress.onPressOut}
                activeOpacity={1}
                disabled={loading}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[s.ctaBtn, SHADOW.float]}
                >
                  {loading ? (
                    <View style={s.ctaRow}>
                      <ActivityIndicator color={COLORS.dark} size="small" />
                      <Text style={s.ctaTxt}>
                        {isLogin ? 'Signing in…' : 'Creating account…'}
                      </Text>
                    </View>
                  ) : (
                    <View style={s.ctaRow}>
                      <Text style={s.ctaTxt}>
                        {isLogin ? 'Sign In' : 'Create Account'}
                      </Text>
                      <View style={s.ctaArrow}>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.dark} />
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* ── OR divider ── */}
            <View style={s.divRow}>
              <View style={s.divLine} />
              <Text style={s.divTxt}>or continue with</Text>
              <View style={s.divLine} />
            </View>

            {/* ── Social buttons ── */}
            <View style={s.socialRow}>
              {[
                { label: 'Google', icon: 'logo-google' },
                { label: 'Apple',  icon: 'logo-apple'  },
              ].map(btn => (
                <SocialButton key={btn.label} label={btn.label} icon={btn.icon} />
              ))}
            </View>

          </View>

          {/* ── Terms ── */}
          <Text style={s.terms}>
            By continuing, you agree to our{' '}
            <Text style={s.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={s.termsLink}>Privacy Policy</Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// ─── SOCIAL BUTTON (separate so usePress hook is valid) ───────────────────────────
const SocialButton = ({ label, icon }) => {
  const press = usePress();
  return (
    <Animated.View style={[s.socialBtnWrap, press.animStyle]}>
      <TouchableOpacity
        style={s.socialBtn}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        activeOpacity={1}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <Ionicons name={icon} size={18} color={COLORS.textSub} />
        <Text style={s.socialTxt}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── MAIN STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Blobs
  blobTR: {
    position: 'absolute', top: -100, right: -100,
    width: 300, height: 300, borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  blobBL: {
    position: 'absolute', bottom: -80, left: -80,
    width: 240, height: 240, borderRadius: RADIUS.full,
    overflow: 'hidden',
  },

  // Scroll
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },

  // Brand row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + SPACING.xs,
    marginBottom: SPACING.lg + SPACING.sm,
  },
  logoMarkWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  logoGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 22,
    fontFamily: FONTS.black,
    color: COLORS.dark,
    lineHeight: 26,
  },
  brandName: {
    fontSize: 18,
    fontFamily: FONTS.extrabold,
    color: COLORS.text,
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  brandSub: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // Hero
  hero: {
    marginBottom: SPACING.lg,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  headline: {
    fontSize: 30,
    fontFamily: FONTS.extrabold,
    color: COLORS.text,
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: SPACING.xs,
  },
  headlineItalic: {
    fontFamily: FONTS.extraboldItalic ?? FONTS.extrabold,
    color: COLORS.secondaryDark,
    fontStyle: 'italic',
  },
  subhead: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },

  // Trust pills
  trustRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  trustDot: {
    width: 6, height: 6, borderRadius: RADIUS.full,
    backgroundColor: COLORS.success,
  },
  trustIcon: { fontSize: 12 },
  trustTxt: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    color: COLORS.textSub,
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    ...SHADOW.cardStrong,
    marginBottom: SPACING.md,
  },
  cardHandle: {
    alignSelf: 'center',
    width: 36,
    height: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },

  // Tab
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabIndicator: {
    position: 'absolute',
    left: SPACING.xs,
    top: SPACING.xs,
    bottom: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    zIndex: 1,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  tabTxt: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.textMuted,
  },
  tabTxtActive: {
    color: COLORS.text,
  },

  // Form
  form: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: -SPACING.xs,
  },
  forgotTxt: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    color: COLORS.secondaryDark,
  },

  // CTA
  ctaWrap: {
    marginBottom: SPACING.sm,
  },
  ctaBtn: {
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ctaTxt: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.dark,
    letterSpacing: -0.2,
  },
  ctaArrow: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(26,15,0,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // OR Divider
  divRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  divTxt: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  socialBtnWrap: { flex: 1 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialTxt: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.textSub,
  },

  // Terms
  terms: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
  termsLink: {
    fontFamily: FONTS.semibold,
    color: COLORS.secondaryDark,
  },
});

// ─── FIELD STYLES ─────────────────────────────────────────────────────────────────
const f = StyleSheet.create({
  wrap: {
    gap: SPACING.xs,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    color: COLORS.textSub,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeTxt: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.sm,
    overflow: 'hidden',
    // shadow applied via animated style
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 0,
  },
  iconWrap: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  prefix: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    marginRight: SPACING.sm,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    paddingHorizontal: SPACING.sm,
    height: '100%',
  },
  eyeBtn: {
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.xs,
  },
});