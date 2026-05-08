import React, { useState, useRef, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────────
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
const SHADOW  = {
  card: {
    shadowColor: '#3D2B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardStrong: {
    shadowColor: '#1A0F00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  float: {
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  input: {
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 0,
  },
};
const ANIM = {
  spring:     { damping: 16, stiffness: 160 },
  springFast: { damping: 12, stiffness: 200 },
  springSlow: { damping: 20, stiffness: 120 },
  duration:   { fast: 150, normal: 280, slow: 450 },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────────
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => v.replace(/\D/g, '').length >= 8;

// ─── usePress HOOK ────────────────────────────────────────────────────────────────
const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// ─── FIELD COMPONENT ──────────────────────────────────────────────────────────────
const Field = ({
  label, value, onChangeText, secureText,
  placeholder, validate, keyboardType, prefix, icon, dimmed,
}) => {
  const [shown, setShown]     = useState(false);
  const [focused, setFocused] = useState(false);

  const isValid   = value.length > 0 && (validate ? validate(value) : value.length >= 2);
  const isInvalid = value.length > 0 && !(validate ? validate(value) : value.length >= 2);

  const focusAnim = useSharedValue(0);
  const shakeAnim = useSharedValue(0);

  const handleFocus = () => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
  };
  const handleBlur = () => {
    setFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
    if (isInvalid) {
      shakeAnim.value = withSequence(
        withTiming(-4, { duration: 60 }),
        withTiming( 4, { duration: 60 }),
        withTiming(-3, { duration: 60 }),
        withTiming( 3, { duration: 60 }),
        withTiming( 0, { duration: 60 }),
      );
    }
  };

  const wrapAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
    borderColor: isValid
      ? COLORS.success
      : isInvalid
      ? COLORS.error
      : focused
      ? COLORS.borderStrong
      : COLORS.border,
    backgroundColor: isValid
      ? COLORS.successLight
      : isInvalid
      ? COLORS.errorLight
      : focused
      ? COLORS.surface
      : COLORS.surfaceAlt,
    shadowOpacity: focused ? 0.14 : 0,
  }));

  const labelAnim = useAnimatedStyle(() => ({
    color: isValid
      ? COLORS.success
      : isInvalid
      ? COLORS.error
      : interpolate(focusAnim.value, [0, 1], [0, 1]) === 1
      ? COLORS.borderStrong
      : COLORS.textSub,
  }));

  return (
    <View style={f.wrap}>
      {/* Label row */}
      <View style={f.labelRow}>
        <Animated.Text style={[f.label, labelAnim]}>{label}</Animated.Text>
        {/* Validity micro-badge */}
        {isValid && (
          <View style={[f.statusBadge, { backgroundColor: COLORS.successLight }]}>
            <Ionicons name="checkmark-circle" size={10} color={COLORS.success} />
            <Text style={[f.statusTxt, { color: COLORS.success }]}>OK</Text>
          </View>
        )}
        {isInvalid && (
          <View style={[f.statusBadge, { backgroundColor: COLORS.errorLight }]}>
            <Ionicons name="alert-circle" size={10} color={COLORS.error} />
            <Text style={[f.statusTxt, { color: COLORS.error }]}>Check</Text>
          </View>
        )}
      </View>

      {/* Input row */}
      <Animated.View style={[f.inputWrap, wrapAnim, SHADOW.input]}>
        {/* Left icon */}
        {icon && (
          <View style={f.iconWrap}>
            <Ionicons
              name={icon}
              size={16}
              color={focused ? COLORS.secondary : COLORS.textMuted}
            />
          </View>
        )}

        {/* Country prefix */}
        {prefix ? (
          <View style={f.prefixWrap}>
            <Text style={f.prefix}>{prefix}</Text>
            <View style={f.prefixDivider} />
          </View>
        ) : null}

        <TextInput
          style={[f.input, dimmed && { color: COLORS.textMuted }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted + '99'}
          secureTextEntry={secureText && !shown}
          keyboardType={keyboardType || 'default'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
        />

        {secureText && (
          <TouchableOpacity onPress={() => setShown((p) => !p)} style={f.eye}>
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────
export default function AuthScreen({ navigation }) {
  const [tab, setTab]         = useState('login');
  const [loading, setLoading] = useState(false);

  // Login fields — pre-filled demo credentials
  const [phone, setPhone]               = useState('55123456');
  const [pass,  setPass]                = useState('Demo@1234');
  const [phoneDimmed, setPhoneDimmed]   = useState(true);
  const [passDimmed,  setPassDimmed]    = useState(true);

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
  const btnPress = usePress();

  const switchTab = (t) => {
    if (t === tab) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    formOp.value = withTiming(0, { duration: 130 }, () => {
      runOnJS(setTab)(t);
      formX.value  = t === 'register' ? 28 : -28;
      formOp.value = withTiming(1, { duration: ANIM.duration.normal });
      formX.value  = withSpring(0, ANIM.spring);
    });
    tabX.value = withSpring(t === 'login' ? 0 : 1, ANIM.spring);
  };

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
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    screenSc.value = withTiming(1.06, { duration: 380, easing: Easing.out(Easing.quad) });
    screenOp.value = withTiming(0,    { duration: 380, easing: Easing.in(Easing.quad) }, (fin) => {
      if (fin) runOnJS(goToMain)();
    });
  };

  return (
    <Animated.View style={[styles.root, wrapStyle]}>
      {/* ── Warm parchment background gradient ── */}
      <LinearGradient
        colors={[COLORS.bg, '#F5EFE4', COLORS.bg]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Decorative arc — top right, very subtle amber blush ── */}
      <View style={styles.arcTopRight} pointerEvents="none">
        <LinearGradient
          colors={[COLORS.primary + '1A', COLORS.primary + '00']}
          style={{ flex: 1, borderRadius: RADIUS.full }}
        />
      </View>

      {/* ── Decorative circle — bottom left, warm sepia ── */}
      <View style={styles.arcBottomLeft} pointerEvents="none">
        <LinearGradient
          colors={[COLORS.secondary + '14', COLORS.secondary + '00']}
          style={{ flex: 1, borderRadius: RADIUS.full }}
        />
      </View>
 

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Welcome block ── */}
          <View style={styles.welcomeBlock}>
            <Text style={styles.welcomeEyebrow}>
              {tab === 'login' ? 'WELCOME BACK' : 'GET STARTED'}
            </Text>
            <Text style={styles.welcomeHead}>
              {tab === 'login' ? 'Sign in to\nyour account' : 'Create your\naccount'}
            </Text>
            <Text style={styles.welcomeSub}>
              {tab === 'login'
                ? 'Continue to your favourite orders'
                : 'Join thousands of happy customers'}
            </Text>
 
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>

            {/* ─ Decorative card inner top rule ─ */}
            <View style={styles.cardRule} />

            {/* ─ Tab toggle ─ */}
            <View
              style={styles.tabTrack}
              onLayout={(e) => { trackW.value = e.nativeEvent.layout.width; }}
            >
              <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
              {['login', 'register'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.tabBtn}
                  onPress={() => switchTab(t)}
                  activeOpacity={0.7}
                >
                  <View style={styles.tabInner}>
                    <Ionicons
                      name={t === 'login' ? 'log-in-outline' : 'person-add-outline'}
                      size={14}
                      color={tab === t ? COLORS.text : COLORS.textMuted}
                    />
                    <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
                      {t === 'login' ? 'Sign In' : 'Register'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* ─ Form ─ */}
            <Animated.View style={[styles.form, formStyle]}>
              {tab === 'login' ? (
                <>
                  <Field
                    label="Phone Number"
                    value={phone}
                    onChangeText={(v) => { setPhone(v); setPhoneDimmed(false); }}
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
                    onChangeText={(v) => { setPass(v); setPassDimmed(false); }}
                    placeholder="Enter your password"
                    secureText
                    icon="lock-closed-outline"
                    dimmed={passDimmed}
                  />
                  <TouchableOpacity style={styles.forgotWrap} activeOpacity={0.7}>
                    <Text style={styles.forgotTxt}>Forgot Password?</Text>
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
                    validate={(v) => v === rPass && v.length >= 6}
                    icon="shield-checkmark-outline"
                  />
                </>
              )}
            </Animated.View>

            {/* ─ CTA button ─ */}
            <Animated.View style={[styles.ctaBtnWrap, btnPress.animStyle]}>
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
                  style={[styles.ctaBtn, SHADOW.float]}
                >
                  {loading ? (
                    <View style={styles.ctaLoadingRow}>
                      <ActivityIndicator color={COLORS.text} size="small" />
                      <Text style={styles.ctaTxt}>
                        {tab === 'login' ? 'Signing in…' : 'Creating account…'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.ctaInner}>
                      <Text style={styles.ctaTxt}>
                        {tab === 'login' ? 'Sign In' : 'Create Account'}
                      </Text>
                      <View style={styles.ctaIconBubble}>
                        <Ionicons name="arrow-forward" size={15} color={COLORS.text} />
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* ─ Divider ─ */}
            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divTxt}>or continue with</Text>
              <View style={styles.divLine} />
            </View>

            {/* ─ Social buttons ─ */}
            <View style={styles.socialRow}>
              {[
                { label: 'Google', icon: 'logo-google' },
                { label: 'Apple',  icon: 'logo-apple'  },
              ].map((s) => {
                const sp = usePress();
                return (
                  <Animated.View key={s.label} style={[styles.socialBtnWrap, sp.animStyle]}>
                    <TouchableOpacity
                      style={styles.socialBtn}
                      onPressIn={sp.onPressIn}
                      onPressOut={sp.onPressOut}
                      activeOpacity={1}
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    >
                      <Ionicons name={s.icon} size={18} color={COLORS.textSub} />
                      <Text style={styles.socialTxt}>{s.label}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* ── Terms ── */}
          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Decorative bg elements ──
  arcTopRight: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: RADIUS.full,
  },
  arcBottomLeft: {
    position: 'absolute',
    bottom: -70,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: RADIUS.full,
  },

  // ── Top accent bar (dark brand band) ──
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    zIndex: 10,
    justifyContent: 'flex-end',
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  topBarLogoMark: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  topBarLogoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarLogoLetter: {
    fontSize: 15,
    fontFamily: FONTS.black,
    color: COLORS.text,
    lineHeight: 18,
  },
  topBarWordmark: {
    fontSize: 17,
    fontFamily: FONTS.extrabold,
    color: COLORS.bg,
    letterSpacing: -0.3,
  },

  // ── Scroll container ──
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 56 + SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },

  // ── Welcome block ──
  welcomeBlock: {
    alignSelf: 'stretch',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  welcomeEyebrow: {
    fontSize: 10,
    fontFamily: FONTS.semibold,
    color: COLORS.textMuted,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  welcomeHead: {
    fontSize: 28,
    fontFamily: FONTS.extrabold,
    color: COLORS.text,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: SPACING.xs,
  },
  welcomeSub: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  trustRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trustTxt: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
  },

  // ── Card ──
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    ...SHADOW.cardStrong,
  },
  cardRule: {
    alignSelf: 'center',
    width: 40,
    height: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },

  // ── Tab toggle ──
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
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
    borderRadius: RADIUS.sm,
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
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.semibold,
  },
  tabTxtActive: {
    color: COLORS.text,
  },

  // ── Form ──
  form: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: -SPACING.xs,
  },
  forgotTxt: {
    color: COLORS.secondary,
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },

  // ── CTA ──
  ctaBtnWrap: {
    marginBottom: SPACING.sm,
  },
  ctaBtn: {
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ctaLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ctaTxt: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: -0.1,
  },
  ctaIconBubble: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(26,15,0,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Divider ──
  divider: {
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
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ── Social ──
  socialRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  socialBtnWrap: {
    flex: 1,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialTxt: {
    color: COLORS.textSub,
    fontSize: 14,
    fontFamily: FONTS.semibold,
  },

  // ── Terms ──
  terms: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.lg,
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
  termsLink: {
    color: COLORS.secondary,
    fontFamily: FONTS.semibold,
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
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: COLORS.textSub,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusTxt: {
    fontSize: 10,
    fontFamily: FONTS.semibold,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.sm,
    height: 52,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  prefix: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginRight: SPACING.sm,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontFamily: FONTS.medium,
    paddingHorizontal: SPACING.sm,
  },
  eye: {
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.xs,
  },
});