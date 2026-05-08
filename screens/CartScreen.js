import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, FlatList,
  TextInput, Dimensions, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, useAnimatedGestureHandler, runOnJS,
  Layout, FadeOut, SlideOutLeft,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCart } from '../context/CartContext';

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

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────
const { width: W } = Dimensions.get('window');
const DELETE_THRESHOLD = -W * 0.35;

const VALID_COUPONS = {
  SWIFT20:  { discount: 50, label: '20% off (max QAR 50)' },
  WELCOME:  { discount: 30, label: 'QAR 30 off first order' },
  FREESHIP: { discount: 25, label: 'Free delivery' },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────────
const fmt = (p) => `QAR ${Math.round(p).toLocaleString()}`;

// ─── usePress HOOK ───────────────────────────────────────────────────────────────
const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1, ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// ─── EMPTY CART ──────────────────────────────────────────────────────────────────
const EmptyCart = ({ onShop }) => {
  const swing = useSharedValue(0);
  const p     = usePress();

  React.useEffect(() => {
    swing.value = withTiming(12, { duration: 600 }, () => {
      swing.value = withTiming(-12, { duration: 600 }, () => {
        swing.value = withSpring(0, { damping: 10 });
      });
    });
    const interval = setInterval(() => {
      swing.value = withSequence(
        withTiming(8,  { duration: 400 }),
        withTiming(-8, { duration: 400 }),
        withSpring(0, { damping: 10 })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const swingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swing.value}deg` }],
  }));

  return (
    <View style={emptyS.wrap}>
      <View style={emptyS.iconRing}>
        <Animated.Text style={[emptyS.bag, swingStyle]}>🛍</Animated.Text>
      </View>
      <Text style={emptyS.title}>Your cart is empty</Text>
      <Text style={emptyS.sub}>Add items from stores to get started</Text>
      <Animated.View style={p.animStyle}>
        <TouchableOpacity
          onPress={onShop}
          onPressIn={p.onPressIn}
          onPressOut={p.onPressOut}
          style={emptyS.btn}
          activeOpacity={1}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={emptyS.btnGrad}
          >
            <Ionicons name="storefront-outline" size={18} color={COLORS.text} />
            <Text style={emptyS.btnTxt}>Start Shopping</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.text} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── CART ITEM ───────────────────────────────────────────────────────────────────
const CartItem = ({ item, onRemove, onUpdateQty, index }) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(96);
  const itemOp     = useSharedValue(0);
  const deleteOp   = useSharedValue(0);

  // Stagger entrance
  React.useEffect(() => {
    const delay = index * 60;
    itemOp.value = withTiming(1, { duration: ANIM.duration.normal, delay });
  }, []);

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (e) => {
      translateX.value = Math.min(0, e.translationX);
      deleteOp.value   = Math.min(1, Math.abs(e.translationX) / 100);
    },
    onEnd: (e) => {
      if (e.translationX < DELETE_THRESHOLD) {
        translateX.value = withTiming(-W, { duration: 250 });
        itemHeight.value = withTiming(0,  { duration: 250 });
        itemOp.value     = withTiming(0,  { duration: 250 }, () => {
          runOnJS(onRemove)();
        });
        deleteOp.value = withTiming(0, { duration: 250 });
      } else {
        translateX.value = withSpring(0, ANIM.spring);
        deleteOp.value   = withTiming(0, { duration: 200 });
      }
    },
  });

  const rowStyle    = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const wrapStyle   = useAnimatedStyle(() => ({ height: itemHeight.value, opacity: itemOp.value }));
  const deleteStyle = useAnimatedStyle(() => ({ opacity: deleteOp.value }));

  const decQty = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdateQty(item.qty - 1);
  };
  const incQty = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdateQty(item.qty + 1);
  };

  const isLast = item.qty === 1;

  return (
    <Animated.View style={[styles.cartItemWrap, wrapStyle]}>
      {/* Delete reveal */}
      <Animated.View style={[styles.deleteBack, deleteStyle]}>
        <View style={styles.deleteInner}>
          <Ionicons name="trash" size={22} color={COLORS.surface} />
          <Text style={styles.deleteTxt}>Remove</Text>
        </View>
      </Animated.View>

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.cartItem, rowStyle]}>
          <Image
            source={{ uri: item.image || `https://picsum.photos/seed/${item.id}/100/100` }}
            style={styles.itemImg}
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.itemStore}>{item.store || 'Store'}</Text>
            <Text style={styles.itemUnit}>{item.unit || 'Pcs'}</Text>
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.itemPrice}>{fmt(item.price * item.qty)}</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={decQty}
                style={[styles.stepBtn, isLast && styles.stepBtnDanger]}
              >
                <Ionicons
                  name={isLast ? 'trash-outline' : 'remove'}
                  size={14}
                  color={isLast ? COLORS.error : COLORS.textSub}
                />
              </TouchableOpacity>
              <Text style={styles.stepCount}>{item.qty}</Text>
              <TouchableOpacity onPress={incQty} style={[styles.stepBtn, styles.stepBtnAdd]}>
                <Ionicons name="add" size={14} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

// ─── COUPON INPUT ────────────────────────────────────────────────────────────────
const CouponInput = ({ onApply, applied, couponLabel }) => {
  const [code, setCode]         = useState('');
  const [err, setErr]           = useState('');
  const [focused, setFocused]   = useState(false);
  const checkScale              = useSharedValue(0);
  const p                       = usePress();

  const handleApply = () => {
    const entry = VALID_COUPONS[code.toUpperCase()];
    if (entry) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      checkScale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1,   { damping: 8 })
      );
      onApply(code.toUpperCase(), entry.discount, entry.label);
      setErr('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErr('Invalid coupon code');
    }
  };

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));

  return (
    <View style={couponS.wrap}>
      <View style={couponS.labelRow}>
        <Ionicons name="pricetag-outline" size={14} color={COLORS.secondary} />
        <Text style={couponS.sectionLabel}>COUPON CODE</Text>
      </View>

      {applied ? (
        <View style={couponS.applied}>
          <Animated.View style={checkStyle}>
            <View style={couponS.checkCircle}>
              <Ionicons name="checkmark" size={16} color={COLORS.success} />
            </View>
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={couponS.appliedCode}>{applied}</Text>
            <Text style={couponS.appliedLabel}>{couponLabel}</Text>
          </View>
          <TouchableOpacity onPress={() => onApply(null, 0, '')} style={couponS.removeBtn}>
            <Ionicons name="close" size={14} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[couponS.inputRow, focused && couponS.inputRowFocused]}>
            <TextInput
              style={couponS.input}
              value={code}
              onChangeText={setCode}
              placeholder="e.g. SWIFT20"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <Animated.View style={p.animStyle}>
              <TouchableOpacity
                onPress={handleApply}
                onPressIn={p.onPressIn}
                onPressOut={p.onPressOut}
                style={couponS.applyBtn}
                activeOpacity={1}
              >
                <Text style={couponS.applyTxt}>Apply</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          {err ? (
            <View style={couponS.errRow}>
              <Ionicons name="alert-circle-outline" size={13} color={COLORS.error} />
              <Text style={couponS.err}>{err}</Text>
            </View>
          ) : null}
          <Text style={couponS.hint}>Try: SWIFT20 · WELCOME · FREESHIP</Text>
        </>
      )}
    </View>
  );
};

// ─── SUMMARY ROW ─────────────────────────────────────────────────────────────────
const SummaryRow = ({ label, value, valueColor, isTotal }) => (
  <View style={styles.summaryRow}>
    <Text style={isTotal ? styles.totalLabel : styles.summaryLabel}>{label}</Text>
    <Text style={[isTotal ? styles.totalValue : styles.summaryValue, { color: valueColor }]}>
      {value}
    </Text>
  </View>
);

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    items, subtotal, deliveryFee, tax, total,
    discount, coupon, removeItem, updateQty, applyCoupon, removeCoupon,
  } = useCart();
  const [couponLabel, setCouponLabel] = useState('');
  const p = usePress();

  const handleApplyCoupon = (code, amount, label) => {
    if (!code) { removeCoupon(); setCouponLabel(''); return; }
    applyCoupon(code, amount);
    setCouponLabel(label);
  };

  const handleCheckout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Checkout');
  };

  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  if (items.length === 0) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Cart</Text>
          </View>
        </SafeAreaView>
        <EmptyCart onShop={() => navigation.navigate('HomeTab')} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Cart</Text>
            <Text style={styles.headerSub}>{itemCount} item{itemCount !== 1 ? 's' : ''} ready to order</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="cart-outline" size={14} color={COLORS.secondaryDark} />
            <Text style={styles.headerBadgeTxt}>{itemCount}</Text>
          </View>
        </View>
      </SafeAreaView>

      <FlatList
        data={items}
        keyExtractor={(i) => `${i.id}-${i.storeId}`}
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingTop: SPACING.sm,
          paddingBottom: 220,
          gap: SPACING.sm,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <CartItem
            item={item}
            index={index}
            onRemove={() => removeItem(item.id, item.storeId)}
            onUpdateQty={(qty) => {
              if (qty <= 0) removeItem(item.id, item.storeId);
              else updateQty(item.id, item.storeId, qty);
            }}
          />
        )}
        ListFooterComponent={() => (
          <View style={{ gap: SPACING.md, marginTop: SPACING.md }}>
            {/* Swipe hint */}
            <View style={styles.swipeHintRow}>
              <Ionicons name="arrow-back-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.swipeHint}>Swipe left on any item to remove</Text>
            </View>

            {/* Coupon */}
            <CouponInput
              onApply={handleApplyCoupon}
              applied={coupon}
              couponLabel={couponLabel}
            />

            {/* Order summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <SummaryRow
                label="Subtotal"
                value={fmt(subtotal)}
                valueColor={COLORS.textSub}
              />
              <SummaryRow
                label="Delivery Fee"
                value={deliveryFee === 0 ? 'FREE 🎉' : fmt(deliveryFee)}
                valueColor={deliveryFee === 0 ? COLORS.success : COLORS.textSub}
              />
              <SummaryRow
                label="Tax (14%)"
                value={fmt(tax)}
                valueColor={COLORS.textSub}
              />
              {discount > 0 && (
                <SummaryRow
                  label={`Coupon (${coupon})`}
                  value={`-${fmt(discount)}`}
                  valueColor={COLORS.success}
                />
              )}

              <View style={styles.summaryDivider} />

              <SummaryRow
                label="Total"
                value={fmt(total)}
                valueColor={COLORS.textSub}
                isTotal
              />
            </View>
          </View>
        )}
      />

      {/* ─── Checkout bar ─── */}
      <View style={[styles.checkoutWrap, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <LinearGradient
          colors={['rgba(250,247,242,0)', COLORS.bg, COLORS.bg]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[p.animStyle , { paddingBottom : 30 }]}>
          <TouchableOpacity
            onPress={handleCheckout}
            onPressIn={p.onPressIn}
            onPressOut={p.onPressOut}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.checkoutBtn}
            >
              <View style={styles.checkoutLeft}>
                <Text style={styles.checkoutTxt}>Proceed to Checkout</Text>
                <Text style={styles.checkoutMeta}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.checkoutTotalWrap}>
                <Text style={styles.checkoutTotalTxt}>{fmt(total)}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical:  SPACING.sm,
  },
  headerTitle: {
    color:      COLORS.text,
    fontSize:   26,
    fontFamily: 'Poppins_800ExtraBold',
    lineHeight: 32,
  },
  headerSub: {
    color:      COLORS.textMuted,
    fontSize:   13,
    fontFamily: 'Poppins_400Regular',
  },
  headerBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm + SPACING.xs,
    paddingVertical:  SPACING.xs + 2,
    borderRadius:    RADIUS.full,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  headerBadgeTxt: {
    color:      COLORS.secondaryDark,
    fontSize:   13,
    fontFamily: 'Poppins_700Bold',
  },

  // Cart item
  cartItemWrap: {
    position:     'relative',
    overflow:     'hidden',
    borderRadius: RADIUS.lg,
  },
  deleteBack: {
    position:       'absolute',
    right:          0,
    top:            0,
    bottom:         0,
    width:          110,
    backgroundColor: COLORS.error,
    borderRadius:   RADIUS.lg,
    alignItems:     'center',
    justifyContent: 'center',
  },
  deleteInner: { alignItems: 'center', gap: SPACING.xs },
  deleteTxt: {
    color:      COLORS.surface,
    fontSize:   11,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  cartItem: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.sm,
    backgroundColor: COLORS.surface,
    padding:         SPACING.sm,
    borderRadius:    RADIUS.lg,
    borderWidth:     1,
    borderColor:     COLORS.border,
    ...{
      shadowColor:   '#3D2B00',
      shadowOffset:  { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius:  10,
      elevation:     3,
    },
  },
  itemImg: {
    width:        68,
    height:       68,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
  },
  itemInfo:  { flex: 1, gap: 2 },
  itemName:  { color: COLORS.text,    fontSize: 14, fontFamily: 'Poppins_600SemiBold', lineHeight: 19 },
  itemStore: { color: COLORS.textMuted, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  itemUnit:  { color: COLORS.textMuted, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  itemRight: { alignItems: 'flex-end', gap: SPACING.sm },
  itemPrice: {
    color:      COLORS.textSub,
    fontSize:   15,
    fontFamily: 'Poppins_800ExtraBold',
  },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2 },
  stepBtn: {
    width:           30,
    height:          30,
    borderRadius:    RADIUS.full,
    borderWidth:     1.5,
    borderColor:     COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    alignItems:      'center',
    justifyContent:  'center',
  },
  stepBtnDanger: {
    borderColor:     COLORS.errorLight,
    backgroundColor: COLORS.errorLight,
  },
  stepBtnAdd: {
    borderColor:     COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  stepCount: {
    color:      COLORS.text,
    fontSize:   14,
    fontFamily: 'Poppins_800ExtraBold',
    minWidth:   18,
    textAlign:  'center',
  },

  // Swipe hint
  swipeHintRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.xs,
  },
  swipeHint: {
    color:      COLORS.textMuted,
    fontSize:   12,
    fontFamily: 'Poppins_400Regular',
  },

  // Order summary
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    gap:             SPACING.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
    ...{
      shadowColor:   '#3D2B00',
      shadowOffset:  { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius:  10,
      elevation:     3,
    },
  },
  summaryTitle: {
    color:        COLORS.text,
    fontSize:     16,
    fontFamily:   'Poppins_700Bold',
    marginBottom: SPACING.xs,
  },
  summaryRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  summaryLabel: {
    color:      COLORS.textMuted,
    fontSize:   14,
    fontFamily: 'Poppins_400Regular',
  },
  summaryValue: {
    fontSize:   14,
    fontFamily: 'Poppins_600SemiBold',
  },
  summaryDivider: {
    height:          1,
    backgroundColor: COLORS.border,
    marginVertical:  SPACING.xs,
  },
  totalLabel: {
    color:      COLORS.text,
    fontSize:   17,
    fontFamily: 'Poppins_800ExtraBold',
  },
  totalValue: {
    fontSize:   20,
    fontFamily: 'Poppins_800ExtraBold',
  },

  // Checkout
  checkoutWrap: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    paddingHorizontal: SPACING.md,
    paddingTop:      SPACING.xl,
  },
  checkoutBtn: {
    height:          60,
    borderRadius:    RADIUS.lg,
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: SPACING.md,
    gap:             SPACING.sm,
    
    ...{
      shadowColor:   '#FFC107',
      shadowOffset:  { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius:  12,
      elevation:     6,
    },
  },
  checkoutLeft: { flex: 1 },
  checkoutTxt: {
    color:      COLORS.text,
    fontSize:   16,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 20,
  },
  checkoutMeta: {
    color:      COLORS.darkMid,
    fontSize:   11,
    fontFamily: 'Poppins_400Regular',
    opacity:    0.75,
  },
  checkoutTotalWrap: {
    backgroundColor:  'rgba(28,26,16,0.12)',
    paddingHorizontal: SPACING.sm + SPACING.xs,
    paddingVertical:   SPACING.xs + 2,
    borderRadius:     RADIUS.full,
  },
  checkoutTotalTxt: {
    color:      COLORS.text,
    fontSize:   15,
    fontFamily: 'Poppins_800ExtraBold',
  },
});

// ─── EMPTY STATE STYLES ──────────────────────────────────────────────────────────
const emptyS = StyleSheet.create({
  wrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            SPACING.md,
    padding:        SPACING.xl,
  },
  iconRing: {
    width:           120,
    height:          120,
    borderRadius:    RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth:     1.5,
    borderColor:     COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.sm,
  },
  bag:   { fontSize: 56 },
  title: { color: COLORS.text, fontSize: 22, fontFamily: 'Poppins_800ExtraBold' },
  sub:   { color: COLORS.textMuted, fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  btn:   { marginTop: SPACING.sm, width: '100%' },
  btnGrad: {
    height:          54,
    borderRadius:    RADIUS.xl,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             SPACING.sm,
    paddingHorizontal : 20,
  },
  btnTxt: { color: COLORS.text, fontSize: 16, fontFamily: 'Poppins_700Bold' },
});

// ─── COUPON STYLES ───────────────────────────────────────────────────────────────
const couponS = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    gap:             SPACING.sm,
    ...{
      shadowColor:   '#3D2B00',
      shadowOffset:  { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius:  8,
      elevation:     2,
    },
  },
  labelRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.xs,
  },
  sectionLabel: {
    color:       COLORS.secondary,
    fontSize:    11,
    fontFamily:  'Poppins_700Bold',
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius:    RADIUS.md - 2,
    borderWidth:     1.5,
    borderColor:     COLORS.border,
    paddingHorizontal: SPACING.sm,
    height:          48,
    gap:             SPACING.xs,
  },
  inputRowFocused: { borderColor: COLORS.borderStrong },
  input: {
    flex:       1,
    color:      COLORS.text,
    fontSize:   14,
    fontFamily: 'Poppins_600SemiBold',
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical:  SPACING.xs + 2,
    borderRadius:    RADIUS.full,
  },
  applyTxt: {
    color:      COLORS.text,
    fontSize:   13,
    fontFamily: 'Poppins_700Bold',
  },
  errRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  err:    { color: COLORS.error, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  hint:   { color: COLORS.textMuted, fontSize: 11, fontFamily: 'Poppins_400Regular' },
  applied: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
  },
  checkCircle: {
    width:           32,
    height:          32,
    borderRadius:    RADIUS.full,
    backgroundColor: COLORS.successLight,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     COLORS.success,
  },
  appliedCode:  { color: COLORS.success,   fontSize: 14, fontFamily: 'Poppins_700Bold' },
  appliedLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: 'Poppins_400Regular' },
  removeBtn: {
    width:           28,
    height:          28,
    borderRadius:    RADIUS.full,
    backgroundColor: COLORS.errorLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
});