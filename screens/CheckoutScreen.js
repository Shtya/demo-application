import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Dimensions, StyleSheet, ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, withDelay, Easing, runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Polyline, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCart } from '../context/CartContext';

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
  // Composite transparencies
  bgGlass:        'rgba(250,247,242,0.08)',
  bgBorder:       'rgba(250,247,242,0.15)',
  bgMuted:        'rgba(250,247,242,0.55)',
  bgStrong:       'rgba(250,247,242,0.92)',
  successAlpha:   'rgba(46,125,50,0.18)',
  primaryAlpha:   'rgba(255,193,7,0.14)',
};

const SPACING = { xxs:2, xs:4, sm:8, md:16, lg:24, xl:32, xxl:48 };
const RADIUS  = { sm:8, md:12, lg:20, xl:28, full:999 };
const SHADOW  = {
  card:  { shadowColor:'#3D2B00', shadowOffset:{ width:0, height:3 }, shadowOpacity:0.08, shadowRadius:12, elevation:4 },
  float: { shadowColor:'#FFC107', shadowOffset:{ width:0, height:4 }, shadowOpacity:0.18, shadowRadius:12, elevation:6 },
};
const ANIM = {
  spring:     { damping:16, stiffness:160 },
  springFast: { damping:12, stiffness:200 },
  springSlow: { damping:20, stiffness:120 },
  duration:   { fast:150, normal:280, slow:450 },
};

const { width: W } = Dimensions.get('window');

// ─── FAKE DATA ───────────────────────────────────────────────────────────────────
const ADDRESSES = [
  { id:'a1', label:'Home 🏠',    line1:'Apt 5B, Building 12',  line2:'Road 9, Maadi, Cairo',         isDefault: true  },
  { id:'a2', label:'Work 🏢',    line1:'3rd Floor, Tower One', line2:'Smart Village, Giza',          isDefault: false },
  { id:'a3', label:'Parents 👨‍👩‍👧', line1:'Villa 7, Block C',    line2:'New Cairo, 5th Settlement',    isDefault: false },
];

const PAYMENT_METHODS = [
  { id:'cash',   label:'Cash on Delivery',   icon:'cash-outline',   sub:'Pay when you receive'                  },
  { id:'wallet', label:'Quick Wallet',        icon:'wallet-outline', sub:'Balance: QAR 1,250.00', balance: 1250  },
  { id:'card',   label:'Credit / Debit Card', icon:'card-outline',   sub:'Visa ending in 4321'                  },
];

const fmt = (p) => `QAR ${Math.round(p).toLocaleString()}`;

// ─── HOOK ────────────────────────────────────────────────────────────────────────
const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring);     };
  return { animStyle, onPressIn, onPressOut };
};

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────────
const ProgressBar = ({ step }) => (
  <View style={progS.wrap}>
    {['Address', 'Payment', 'Review'].map((label, i) => (
      <React.Fragment key={label}>
        <View style={progS.item}>
          <View style={[
            progS.circle,
            step > i  && progS.circleDone,
            step === i && progS.circleCurrent,
          ]}>
            {step > i
              ? <Ionicons name="checkmark" size={13} color={COLORS.dark} />
              : <Text style={[progS.num, step === i && progS.numActive]}>{i + 1}</Text>
            }
          </View>
          <Text style={[progS.label, step >= i && progS.labelActive]}>{label}</Text>
        </View>
        {i < 2 && <View style={[progS.line, step > i && progS.lineDone]} />}
      </React.Fragment>
    ))}
  </View>
);

// ─── ADDRESS CARD ────────────────────────────────────────────────────────────────
const AddressCard = ({ address, isSelected, onPress, index }) => {
  const { animStyle, onPressIn, onPressOut } = usePress();
  const ty  = useSharedValue(SPACING.md + SPACING.xs);
  const op  = useSharedValue(0);

  useEffect(() => {
    const d = index * 60;
    ty.value = withDelay(d, withSpring(0, ANIM.spring));
    op.value = withDelay(d, withTiming(1, { duration: ANIM.duration.normal }));
  }, []);

  const entrance = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[entrance, animStyle]}>
      <TouchableOpacity
        style={[styles.addrCard, isSelected && styles.addrCardActive]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[styles.radio, isSelected && styles.radioActive]}>
          {isSelected && <View style={styles.radioDot} />}
        </View>

        <View style={styles.addrBody}>
          <View style={styles.addrTopRow}>
            <Text style={styles.addrLabel}>{address.label}</Text>
            {address.isDefault && (
              <View style={styles.defaultPill}>
                <Text style={styles.defaultPillTxt}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.addrLine1}>{address.line1}</Text>
          <Text style={styles.addrLine2}>{address.line2}</Text>
        </View>

        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── PAYMENT CARD ────────────────────────────────────────────────────────────────
const PaymentCard = ({ method, isSelected, onPress, index }) => {
  const { animStyle, onPressIn, onPressOut } = usePress();
  const ty = useSharedValue(SPACING.md + SPACING.xs);
  const op = useSharedValue(0);

  useEffect(() => {
    const d = index * 60;
    ty.value = withDelay(d, withSpring(0, ANIM.spring));
    op.value = withDelay(d, withTiming(1, { duration: ANIM.duration.normal }));
  }, []);

  const entrance = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[entrance, animStyle]}>
      <TouchableOpacity
        style={[styles.payCard, isSelected && styles.payCardActive]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={[styles.payIcon, isSelected && styles.payIconActive]}>
          <Ionicons
            name={method.icon}
            size={22}
            color={isSelected ? COLORS.primaryDark : COLORS.textMuted}
          />
        </View>

        <View style={styles.payBody}>
          <Text style={[styles.payLabel, isSelected && styles.payLabelActive]}>
            {method.label}
          </Text>
          <Text style={styles.paySub}>{method.sub}</Text>
          {method.balance != null && isSelected && (
            <Text style={styles.balanceTxt}>Available: {fmt(method.balance)}</Text>
          )}
        </View>

        <View style={[styles.radio, isSelected && styles.radioActive]}>
          {isSelected && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── REVIEW SECTION CARD ─────────────────────────────────────────────────────────
const ReviewCard = ({ icon, title, children, index }) => {
  const ty = useSharedValue(SPACING.md + SPACING.xs);
  const op = useSharedValue(0);

  useEffect(() => {
    const d = index * 70;
    ty.value = withDelay(d, withSpring(0, ANIM.spring));
    op.value = withDelay(d, withTiming(1, { duration: ANIM.duration.normal }));
  }, []);

  const entrance = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[styles.reviewCard, entrance]}>
      <View style={styles.reviewCardHeader}>
        <View style={styles.reviewIconBox}>
          <Ionicons name={icon} size={16} color={COLORS.textMuted} />
        </View>
        <Text style={styles.reviewCardTitle}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
};

// ─── ANIMATED CHECKMARK ──────────────────────────────────────────────────────────
const AnimatedCheckmark = ({ visible }) => {
  const scaleVal = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scaleVal.value = withSpring(1, { mass: 0.8, damping: 12 });
    }
  }, [visible]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  return (
    <Animated.View style={[checkS.wrap, wrapStyle]}>
      <View style={checkS.ring}>
        <Svg width={64} height={64} viewBox="0 0 100 100">
          <Circle
            cx={50} cy={50} r={42}
            stroke={COLORS.success}
            strokeWidth={4}
            fill={COLORS.successLight}
          />
          <Polyline
            points="28,52 44,68 72,34"
            stroke={COLORS.success}
            strokeWidth={6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Animated.View>
  );
};

// ─── SUCCESS OVERLAY ─────────────────────────────────────────────────────────────
const SuccessOverlay = ({ visible, orderNum, onTrack, onContinue }) => {
  const overlayOp = useSharedValue(0);
  const cardScale = useSharedValue(0.88);
  const cardY     = useSharedValue(SPACING.xxl);

  const { animStyle: trackAnim, onPressIn: trackIn, onPressOut: trackOut } = usePress();

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      overlayOp.value = withTiming(1,   { duration: ANIM.duration.normal });
      cardScale.value = withSpring(1,   { mass: 0.8, damping: 14 });
      cardY.value     = withSpring(0,   ANIM.spring);
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOp.value }));
  const cardStyle    = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }, { translateY: cardY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, sucS.overlay, overlayStyle]}>
      <LinearGradient
        colors={[COLORS.bg, COLORS.surfaceAlt]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[sucS.card, cardStyle]}>
        <AnimatedCheckmark visible={visible} />

        <Text style={sucS.title}>Order Confirmed!</Text>

        <View style={sucS.orderBadge}>
          <Ionicons name="receipt-outline" size={13} color={COLORS.secondary} />
          <Text style={sucS.orderBadgeTxt}>#{orderNum}</Text>
        </View>

        <Text style={sucS.sub}>
          Your order is confirmed and being{'\n'}lovingly prepared for you
        </Text>

        <View style={sucS.etaRow}>
          <View style={sucS.etaIconBox}>
            <Ionicons name="bicycle-outline" size={18} color={COLORS.success} />
          </View>
          <View>
            <Text style={sucS.etaLabel}>Estimated delivery</Text>
            <Text style={sucS.etaTime}>25 – 35 minutes</Text>
          </View>
        </View>

        <Animated.View style={[sucS.trackBtnWrap, trackAnim]}>
          <TouchableOpacity
            onPress={onTrack}
            onPressIn={trackIn}
            onPressOut={trackOut}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={sucS.trackBtn}
            >
              <Ionicons name="navigate" size={18} color={COLORS.text} />
              <Text style={sucS.trackBtnTxt}>Track My Order</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity onPress={onContinue} style={sucS.continueBtn}>
          <Text style={sucS.continueTxt}>Continue Shopping</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function CheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { items, subtotal, deliveryFee, tax, total, clearCart } = useCart();

  const [step, setStep]       = useState(0);
  const [selAddr, setSelAddr] = useState('a1');
  const [selPay, setSelPay]   = useState('cash');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNum]            = useState(`QK-${Math.floor(100000 + Math.random() * 900000)}`);

  const slideX   = useSharedValue(0);
  const btnScale = useSharedValue(1);

  const goNext = () => {
    if (step < 2) {
      slideX.value = withSequence(
        withTiming(-(SPACING.lg + SPACING.sm), { duration: ANIM.duration.fast }),
        withTiming(0, { duration: ANIM.duration.normal }),
      );
      setStep((s) => s + 1);
    }
  };
  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else navigation.goBack();
  };

  const placeOrder = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    btnScale.value = withSequence(
      withSpring(0.95, { damping: 15 }),
      withSpring(1,    { damping: 15 }),
    );
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    clearCart();
    setSuccess(true);
  };

  const handleTrack    = () => { setSuccess(false); navigation.navigate('OrdersTab', { screen: 'OrderTracking' }); };
  const handleContinue = () => { setSuccess(false); navigation.navigate('HomeTab'); };

  const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slideX.value }] }));
  const btnStyle     = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const selectedAddr = ADDRESSES.find((a) => a.id === selAddr);
  const selectedPay  = PAYMENT_METHODS.find((p) => p.id === selPay);

  const ctaLabel =
    step === 0 ? 'Continue to Payment' :
    step === 1 ? 'Review Order' :
    `Place Order · ${fmt(total)}`;

  return (
    <View style={styles.root}>

      {/* ── Dark header band ── */}
      <View style={styles.headerBand}>
        <LinearGradient
          colors={['#1C1A10', '#2A2418', '#33291C']}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color={COLORS.bg} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
            <View style={styles.headerSpacer} />
          </View>
          <ProgressBar step={step} />
        </SafeAreaView>
        {/* Curved bottom connector */}
        <View style={styles.bandCurve} />
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={contentStyle}>

          {/* Step 0 — Address */}
          {step === 0 && (
            <View style={styles.stepBlock}>
              <View style={styles.stepHeadWrap}>
                <Text style={styles.stepTitle}>Delivery Address</Text>
                <Text style={styles.stepSub}>Where should we bring your order?</Text>
              </View>

              {ADDRESSES.map((a, i) => (
                <AddressCard
                  key={a.id}
                  address={a}
                  isSelected={selAddr === a.id}
                  onPress={() => setSelAddr(a.id)}
                  index={i}
                />
              ))}

              <TouchableOpacity style={styles.addAddrRow} activeOpacity={0.7}>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.secondary} />
                <Text style={styles.addAddrTxt}>Add New Address</Text>
              </TouchableOpacity>

              {selectedAddr && (
                <View style={styles.etaBanner}>
                  <View style={styles.etaIconBox}>
                    <Ionicons name="bicycle-outline" size={18} color={COLORS.success} />
                  </View>
                  <View style={styles.etaTextWrap}>
                    <Text style={styles.etaHeadline}>25 – 35 min delivery</Text>
                    <Text style={styles.etaDetail}>to {selectedAddr.line2.split(',')[0]}</Text>
                  </View>
                </View>
                )}
                </View>
          )}
              
          {step === 1 && (
            <View style={styles.stepBlock}>
              <View style={styles.stepHeadWrap}>
                <Text style={styles.stepTitle}>Payment Method</Text>
                <Text style={styles.stepSub}>How would you like to pay?</Text>
              </View>

              {PAYMENT_METHODS.map((m, i) => (
                <PaymentCard
                  key={m.id}
                  method={m}
                  isSelected={selPay === m.id}
                  onPress={() => setSelPay(m.id)}
                  index={i}
                />
              ))}
            </View>
          )}

          {/* Step 2 — Review */}
          {step === 2 && (
            <View style={styles.stepBlock}>
              <View style={styles.stepHeadWrap}>
                <Text style={styles.stepTitle}>Review & Confirm</Text>
                <Text style={styles.stepSub}>Everything look right?</Text>
              </View>

              <ReviewCard icon="bag-outline" title={`Items (${items.reduce((s, i) => s + i.qty, 0)})`} index={0}>
                {items.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.reviewItemRow}>
                    <Text style={styles.reviewItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.reviewItemQty}>×{item.qty}</Text>
                    <Text style={styles.reviewItemPrice}>{fmt(item.price * item.qty)}</Text>
                  </View>
                ))}
                {items.length > 3 && (
                  <Text style={styles.moreItems}>+{items.length - 3} more items</Text>
                )}
              </ReviewCard>

              <ReviewCard icon="location-outline" title="Delivery To" index={1}>
                <Text style={styles.reviewPrimary}>{selectedAddr?.label}</Text>
                <Text style={styles.reviewSecondary}>{selectedAddr?.line1}, {selectedAddr?.line2}</Text>
              </ReviewCard>

              <ReviewCard icon="card-outline" title="Payment" index={2}>
                <Text style={styles.reviewPrimary}>{selectedPay?.label}</Text>
                <Text style={styles.reviewSecondary}>{selectedPay?.sub}</Text>
              </ReviewCard>

              <ReviewCard icon="receipt-outline" title="Order Total" index={3}>
                {[
                  { l: 'Subtotal',  v: fmt(subtotal) },
                  { l: 'Delivery',  v: deliveryFee === 0 ? 'FREE' : fmt(deliveryFee), free: deliveryFee === 0 },
                  { l: 'Tax (14%)', v: fmt(tax) },
                ].map((r) => (
                  <View key={r.l} style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{r.l}</Text>
                    <Text style={[styles.totalVal, r.free && styles.freeVal]}>{r.v}</Text>
                  </View>
                ))}
                <View style={styles.totalDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.grandLabel}>Grand Total</Text>
                  <Text style={styles.grandVal}>{fmt(total)}</Text>
                </View>
              </ReviewCard>
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + SPACING.md - SPACING.xs }]}>
        <LinearGradient
          colors={['transparent', COLORS.bg, COLORS.bg]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Animated.View style={[btnStyle ,{ marginBottom : 30}]}>
          <TouchableOpacity
            onPress={step < 2 ? goNext : placeOrder}
            onPressIn={() => { btnScale.value = withSpring(0.97, ANIM.springFast); }}
            onPressOut={() => { btnScale.value = withSpring(1, ANIM.spring); }}
            activeOpacity={1}
            disabled={loading}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <>
                  <Text style={styles.ctaTxt}>{ctaLabel}</Text>
                  {step < 2 && <Ionicons name="arrow-forward" size={20} color={COLORS.text} />}
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <SuccessOverlay
        visible={success}
        orderNum={orderNum}
        onTrack={handleTrack}
        onContinue={handleContinue}
      />
    </View>
  );
}
// ─── STYLES ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.bg },

  // Header band
  headerBand:    { zIndex: 10 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs },
  headerTitle:   { color: COLORS.bg, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  headerSpacer:  { width: SPACING.xl },
  backBtn:       { width: SPACING.xl, height: SPACING.xl, borderRadius: RADIUS.full, backgroundColor: COLORS.bgGlass, borderWidth: 1, borderColor: COLORS.bgBorder, alignItems: 'center', justifyContent: 'center' },
  bandCurve:     { height: SPACING.lg, backgroundColor: COLORS.bg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl },

  // Scroll
  scrollContent: { padding: SPACING.md, paddingTop: SPACING.xs, paddingBottom: 160 },
  stepBlock:     { gap: SPACING.sm + SPACING.xs },
  stepHeadWrap:  { gap: SPACING.xxs, marginBottom: SPACING.xs },
  stepTitle:     { color: COLORS.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  stepSub:       { color: COLORS.textMuted, fontSize: 13 },

  // Radio
  radio:         { width: SPACING.md + SPACING.xs, height: SPACING.md + SPACING.xs, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  radioActive:   { borderColor: COLORS.primary },
  radioDot:      { width: SPACING.sm + SPACING.xxs, height: SPACING.sm + SPACING.xxs, borderRadius: RADIUS.full, backgroundColor: COLORS.primary },

  // Address card
  addrCard:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + SPACING.xs, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md - SPACING.xs, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  addrCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  addrBody:       { flex: 1, gap: SPACING.xxs },
  addrTopRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  addrLabel:      { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  addrLine1:      { color: COLORS.textSub, fontSize: 13 },
  addrLine2:      { color: COLORS.textMuted, fontSize: 12 },
  defaultPill:    { backgroundColor: COLORS.secondaryLight, paddingHorizontal: SPACING.xs + SPACING.xxs, paddingVertical: SPACING.xxs, borderRadius: RADIUS.sm },
  defaultPillTxt: { color: COLORS.secondary, fontSize: 10, fontWeight: '700' },

  // Add address
  addAddrRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm + SPACING.xs, paddingHorizontal: SPACING.md, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.md, borderStyle: 'dashed', backgroundColor: COLORS.surface },
  addAddrTxt: { color: COLORS.secondary, fontSize: 14, fontWeight: '600' },

  // ETA banner
  etaBanner:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + SPACING.xs, backgroundColor: COLORS.successLight, borderRadius: RADIUS.md, padding: SPACING.sm + SPACING.xs, borderWidth: 1, borderColor: COLORS.success },
  etaIconBox:   { width: SPACING.xl, height: SPACING.xl, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOW.card },
  etaTextWrap:  { flex: 1 },
  etaHeadline:  { color: COLORS.success, fontSize: 13, fontWeight: '700' },
  etaDetail:    { color: COLORS.textSub, fontSize: 12, marginTop: SPACING.xxs },

  // Payment card
  payCard:          { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + SPACING.xs, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md - SPACING.xs, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  payCardActive:    { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  payIcon:          { width: SPACING.xxl, height: SPACING.xxl, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  payIconActive:    { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  payBody:          { flex: 1 },
  payLabel:         { color: COLORS.textMuted, fontSize: 15, fontWeight: '700' },
  payLabelActive:   { color: COLORS.text },
  paySub:           { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.xxs },
  balanceTxt:       { color: COLORS.success, fontSize: 12, fontWeight: '700', marginTop: SPACING.xxs },

  // Review cards
  reviewCard:       { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md - SPACING.xs, borderWidth: 1, borderColor: COLORS.border, gap: SPACING.xs, ...SHADOW.card },
  reviewCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + SPACING.xxs, marginBottom: SPACING.xs },
  reviewIconBox:    { width: SPACING.lg, height: SPACING.lg, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  reviewCardTitle:  { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  reviewItemRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  reviewItemName:   { color: COLORS.textSub, fontSize: 13, flex: 1 },
  reviewItemQty:    { color: COLORS.textMuted, fontSize: 12 },
  reviewItemPrice:  { color: COLORS.textSub, fontSize: 13, fontWeight: '700' },
  moreItems:        { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.xxs },
  reviewPrimary:    { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  reviewSecondary:  { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.xxs },

  // Totals
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:  { color: COLORS.textMuted, fontSize: 14 },
  totalVal:    { color: COLORS.textSub, fontSize: 14, fontWeight: '600' },
  freeVal:     { color: COLORS.success, fontWeight: '700' },
  totalDivider:{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs },
  grandLabel:  { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  grandVal:    { color: COLORS.dark, fontSize: 22, fontWeight: '900' },

  // CTA
  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: SPACING.md, paddingTop: SPACING.xl + SPACING.lg },
  ctaBtn:  { height: SPACING.xl + SPACING.lg, borderRadius: RADIUS.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm + SPACING.xs, ...SHADOW.float },
  ctaTxt:  { color: COLORS.text, fontSize: 17, fontWeight: '700' },
});

const progS = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, paddingBottom: SPACING.md + SPACING.xs },
  item:        { alignItems: 'center', gap: SPACING.xs },
  circle:      { width: SPACING.xl, height: SPACING.xl, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.bgBorder, backgroundColor: COLORS.bgGlass, alignItems: 'center', justifyContent: 'center' },
  circleDone:  { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  circleCurrent:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  num:         { color: COLORS.bgMuted, fontSize: 13, fontWeight: '700' },
  numActive:   { color: COLORS.text },
  label:       { color: COLORS.bgMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  labelActive: { color: COLORS.bg },
  line:        { flex: 1, height: 1.5, backgroundColor: COLORS.bgBorder, marginBottom: SPACING.md + SPACING.sm },
  lineDone:    { backgroundColor: COLORS.secondary },
});

const checkS = StyleSheet.create({
  wrap: { alignSelf: 'center', marginBottom: SPACING.sm },
  ring: { width: SPACING.xxl + SPACING.md, height: SPACING.xxl + SPACING.md, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.full, backgroundColor: COLORS.successLight, borderWidth: 1, borderColor: COLORS.success },
});

const sucS = StyleSheet.create({
  overlay:      { zIndex: 999, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  card:         { width: '100%', backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg + SPACING.xs, alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  title:        { color: COLORS.text, fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  orderBadge:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.md - SPACING.xs, paddingVertical: SPACING.xxs + SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary },
  orderBadgeTxt:{ color: COLORS.secondary, fontSize: 13, fontWeight: '800' },
  sub:          { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', lineHeight: SPACING.md + SPACING.xs },
  etaRow:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + SPACING.xs, backgroundColor: COLORS.successLight, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + SPACING.xs, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.success, alignSelf: 'stretch' },
  etaIconBox:   { width: SPACING.xl, height: SPACING.xl, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOW.card },
  etaLabel:     { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
  etaTime:      { color: COLORS.success, fontSize: 14, fontWeight: '800' },
  trackBtnWrap: { width: '100%', marginTop: SPACING.xs },
  trackBtn:     { height: SPACING.xl + SPACING.lg, borderRadius: RADIUS.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, ...SHADOW.float },
  trackBtnTxt:  { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  continueBtn:  { paddingVertical: SPACING.xs },
  continueTxt:  { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
});