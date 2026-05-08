import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, FlatList,
  Dimensions, StyleSheet, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, withRepeat, withDelay, interpolate, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCart } from '../context/CartContext';

// ─── BRAND CONSTANTS ──────────────────────────────────────────────────────────────
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
  card:   { shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 3  }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  float:  { shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 6  }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 8 },
  subtle: { shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 1  }, shadowOpacity: 0.05, shadowRadius: 6,  elevation: 2 },
};
const ANIM = {
  spring:     { damping: 16, stiffness: 160 },
  springFast: { damping: 12, stiffness: 200 },
  springSlow: { damping: 20, stiffness: 120 },
  duration:   { fast: 150, normal: 280, slow: 450 },
};

// ─── GROCERY PRODUCT DATA ─────────────────────────────────────────────────────────
const GROCERY_PRODUCT = {
  id: 'gp-001',
  name: 'Organic Alphonso\nMangoes',
  nameShort: 'Organic Alphonso Mangoes',
  subtitle: 'Premium · Hand-picked · Cold-chain Shipped',
  store: 'Green Basket Farms',
  brand: 'Konkan Harvest · Maharashtra',
  category: 'tropical-fruit',
  price: 22.95,
  originalPrice: 28.00,
  discount: 18,
  images: [
    'https://imgs.search.brave.com/EZrRzSESzvg2HFhbrCenbfw4_mGDGHbGsNrAKv1Ny28/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTAv/NTk0LzgxMS9zbWFs/bC9zaG9wcGluZy1i/YXNrZXQtd2l0aC12/YXJpZXR5LW9mLWdy/b2NlcnktcHJvZHVj/dHMtc2lkZS12aWV3/LWlzb2xhdGUtb24t/dHJhbnNwYXJlbmN5/LWJhY2tncm91bmQt/cG5nLnBuZw',
    'https://imgs.search.brave.com/oIHC8ueQd4KN_15rUbn2nxlb0G_KFUsPRrnNwbstZlU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTAv/NTk1LzUzNS9zbWFs/bC9zaG9wcGluZy1i/YXNrZXQtd2l0aC12/YXJpZXR5LW9mLWdy/b2NlcnktcHJvZHVj/dHMtaXNvbGF0ZS1v/bi10cmFuc3BhcmVu/Y3ktYmFja2dyb3Vu/ZC1wbmcucG5n',
    'https://imgs.search.brave.com/oIHC8ueQd4KN_15rUbn2nxlb0G_KFUsPRrnNwbstZlU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTAv/NTk1LzUzNS9zbWFs/bC9zaG9wcGluZy1i/YXNrZXQtd2l0aC12/YXJpZXR5LW9mLWdy/b2NlcnktcHJvZHVj/dHMtaXNvbGF0ZS1v/bi10cmFuc3BhcmVu/Y3ktYmFja2dyb3Vu/ZC1wbmcucG5n',
    'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=760&q=80',
  ],
  thumbnails: [
    'https://imgs.search.brave.com/EZrRzSESzvg2HFhbrCenbfw4_mGDGHbGsNrAKv1Ny28/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTAv/NTk0LzgxMS9zbWFs/bC9zaG9wcGluZy1i/YXNrZXQtd2l0aC12/YXJpZXR5LW9mLWdy/b2NlcnktcHJvZHVj/dHMtc2lkZS12aWV3/LWlzb2xhdGUtb24t/dHJhbnNwYXJlbmN5/LWJhY2tncm91bmQt/cG5nLnBuZw',
    'https://imgs.search.brave.com/oIHC8ueQd4KN_15rUbn2nxlb0G_KFUsPRrnNwbstZlU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTAv/NTk1LzUzNS9zbWFs/bC9zaG9wcGluZy1i/YXNrZXQtd2l0aC12/YXJpZXR5LW9mLWdy/b2NlcnktcHJvZHVj/dHMtaXNvbGF0ZS1v/bi10cmFuc3BhcmVu/Y3ktYmFja2dyb3Vu/ZC1wbmcucG5n',
    'https://imgs.search.brave.com/oIHC8ueQd4KN_15rUbn2nxlb0G_KFUsPRrnNwbstZlU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTAv/NTk1LzUzNS9zbWFs/bC9zaG9wcGluZy1i/YXNrZXQtd2l0aC12/YXJpZXR5LW9mLWdy/b2NlcnktcHJvZHVj/dHMtaXNvbGF0ZS1v/bi10cmFuc3BhcmVu/Y3ktYmFja2dyb3Vu/ZC1wbmcucG5n',
    'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&q=70',
  ],
  rating: 4.8,
  reviews: 2341,
  inStock: true,
  stock: 47,
  minQty: 2,
  certification: '🇮🇳 GI Certified',
  categoryLabel: '🥭 Tropical Fruit',
  description: 'Sourced directly from orchards in Ratnagiri, Maharashtra, these GI-certified Alphonso mangoes are the undisputed king of mangoes. Hand-picked at peak ripeness, each mango boasts a rich saffron hue, zero fiber, and an intoxicating aroma that fills a room.',
  descriptionExtra: 'Perfect for fresh eating, mango lassi, aamras, or desserts. No artificial ripening — what you taste is pure sun-soaked sweetness, arriving in temperature-controlled packaging to ensure peak flavor when it lands on your doorstep.',
  freshnessChips: [
    { icon: '🌿', label: 'Organic',   value: 'Certified'    },
    { icon: '🏷️', label: 'Harvested', value: '3 days ago'   },
    { icon: '❄️', label: 'Storage',   value: 'Cold-chain'   },
  ],
  nutrition: [
    { label: 'Calories', value: '60',   unit: 'kcal' },
    { label: 'Protein',  value: '0.8g', unit: null   },
    { label: 'Carbs',    value: '14g',  unit: null   },
    { label: 'Vit C',    value: '54%',  unit: null   },
  ],
  tags: [
    { label: '🌱 Vegan',          warn: false },
    { label: '🚫 Gluten Free',    warn: false },
    { label: '🍬 No Added Sugar', warn: false },
    { label: '⚠️ Tree Nut Facility', warn: true },
  ],
  delivery: 'Same-day by 9pm',
  returns:  'Free if not fresh',
};

const RELATED_PRODUCTS = [
  { id: 'rp-1', name: 'Seedless', price: 12.50, unit: 'kg',  rating: 4.7, image: 'https://imgs.search.brave.com/oIHC8ueQd4KN_15rUbn2nxlb0G_KFUsPRrnNwbstZlU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTAv/NTk1LzUzNS9zbWFs/bC9zaG9wcGluZy1i/YXNrZXQtd2l0aC12/YXJpZXR5LW9mLWdy/b2NlcnktcHJvZHVj/dHMtaXNvbGF0ZS1v/bi10cmFuc3BhcmVu/Y3ktYmFja2dyb3Vu/ZC1wbmcucG5n' },
  { id: 'rp-2', name: 'Royal Strawberries',  price: 18.00, unit: 'box', rating: 4.9, image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=300&q=70' },
  { id: 'rp-3', name: 'Maradol Papaya',       price: 9.75,  unit: 'kg',  rating: 4.6, image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=300&q=70' },
  { id: 'rp-4', name: 'Golden Pineapple',     price: 14.50, unit: 'pcs', rating: 4.8, image: 'https://imgs.search.brave.com/EZrRzSESzvg2HFhbrCenbfw4_mGDGHbGsNrAKv1Ny28/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTAv/NTk0LzgxMS9zbWFs/bC9zaG9wcGluZy1i/YXNrZXQtd2l0aC12/YXJpZXR5LW9mLWdy/b2NlcnktcHJvZHVj/dHMtc2lkZS12aWV3/LWlzb2xhdGUtb24t/dHJhbnNwYXJlbmN5/LWJhY2tncm91bmQt/cG5nLnBuZw' },
];

const UNITS = ['Kg', 'Box (3kg)', 'Pcs'];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────────
const { width: W } = Dimensions.get('window');
const GALLERY_H    = W * 0.9;
const SKELETON_MS  = 2200; // fake loading duration

// ─── HELPERS ──────────────────────────────────────────────────────────────────────
const fmt = (p) =>
  `QAR ${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── HOOKS ────────────────────────────────────────────────────────────────────────
const usePress = () => {
  const scale    = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.94, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring);     };
  return { animStyle, onPressIn, onPressOut };
};

const useConfetti = () => {
  const particles = Array.from({ length: 10 }, () => ({
    x:       useSharedValue(0),
    y:       useSharedValue(0),
    opacity: useSharedValue(0),
    scale:   useSharedValue(1),
    rotate:  useSharedValue(0),
  }));

  const trigger = () => {
    const angles = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
    particles.forEach((p, i) => {
      const rad  = (angles[i] * Math.PI) / 180;
      const dist = 70 + Math.random() * 50;
      p.x.value = 0; p.y.value = 0; p.rotate.value = 0;
      p.opacity.value = withSequence(
        withTiming(1, { duration: 60  }),
        withTiming(0, { duration: 520 }),
      );
      p.x.value      = withTiming(Math.cos(rad) * dist, { duration: 620 });
      p.y.value      = withTiming(Math.sin(rad) * dist, { duration: 620 });
      p.rotate.value = withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 620 });
      p.scale.value  = withSequence(
        withTiming(1.5, { duration: 180 }),
        withTiming(0,   { duration: 440 }),
      );
    });
  };

  return { particles, trigger };
};

// ─── SKELETON LOADER ─────────────────────────────────────────────────────────────
const SkeletonPulse = ({ style }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[skS.base, style, anim]} />;
};

const SkeletonScreen = () => (
  <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
    {/* gallery */}
    <SkeletonPulse style={skS.gallery} />
    {/* thumbnail strip */}
    <View style={skS.thumbRow}>
      {[0,1,2,3].map(i => <SkeletonPulse key={i} style={skS.thumb} />)}
    </View>
    {/* meta bar */}
    <View style={skS.row}>
      <SkeletonPulse style={skS.pill} />
      <SkeletonPulse style={[skS.pill, { width: 120 }]} />
    </View>
    {/* name */}
    <View style={{ paddingHorizontal: SPACING.md, marginTop: SPACING.sm }}>
      <SkeletonPulse style={{ height: 36, width: '75%', borderRadius: RADIUS.md }} />
      <SkeletonPulse style={{ height: 14, width: '45%', borderRadius: RADIUS.sm, marginTop: SPACING.sm }} />
    </View>
    {/* rating */}
    <View style={skS.row}>
      <SkeletonPulse style={{ height: 14, width: 110, borderRadius: RADIUS.sm }} />
      <SkeletonPulse style={{ height: 24, width: 80, borderRadius: RADIUS.full, marginLeft: 'auto' }} />
    </View>
    {/* price card */}
    <View style={{ paddingHorizontal: SPACING.md, marginTop: SPACING.sm }}>
      <SkeletonPulse style={{ height: 86, borderRadius: RADIUS.lg }} />
    </View>
    {/* divider */}
    <View style={skS.divider} />
    {/* freshness chips */}
    <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}>
      <SkeletonPulse style={{ height: 12, width: 110, borderRadius: 4, marginBottom: SPACING.sm }} />
    </View>
    <View style={skS.chipRow}>
      {[0,1,2].map(i => <SkeletonPulse key={i} style={skS.chip} />)}
    </View>
    {/* divider */}
    <View style={skS.divider} />
    {/* nutrition */}
    <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}>
      <SkeletonPulse style={{ height: 12, width: 130, borderRadius: 4, marginBottom: SPACING.sm }} />
    </View>
    <View style={skS.nutrRow}>
      {[0,1,2,3].map(i => <SkeletonPulse key={i} style={skS.nutrCell} />)}
    </View>
    {/* divider */}
    <View style={skS.divider} />
    {/* related */}
    <View style={{ paddingHorizontal: SPACING.md, marginBottom: SPACING.sm }}>
      <SkeletonPulse style={{ height: 12, width: 140, borderRadius: 4, marginBottom: SPACING.sm }} />
    </View>
    <View style={skS.relRow}>
      {[0,1,2].map(i => <SkeletonPulse key={i} style={skS.relCard} />)}
    </View>
  </View>
);

// ─── DIVIDER ──────────────────────────────────────────────────────────────────────
const Divider = ({ mt = SPACING.md, mb = SPACING.md }) => (
  <View style={{ height: 1, backgroundColor: COLORS.border, marginTop: mt, marginBottom: mb }} />
);

// ─── CONFETTI PARTICLE ────────────────────────────────────────────────────────────
const ConfettiParticle = ({ p, color }) => {
  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateX: p.x.value },
      { translateY: p.y.value },
      { scale: p.scale.value },
      { rotate: `${p.rotate.value}deg` },
    ],
    opacity: p.opacity.value,
  }));
  return <Animated.View style={[confS.particle, { backgroundColor: color }, anim]} />;
};

// ─── RELATED CARD ─────────────────────────────────────────────────────────────────
const RelatedCard = ({ item, onPress, index }) => {
  const press = usePress();
  const entrance = useAnimatedStyle(() => ({
    opacity: withDelay(index * 70, withTiming(1, { duration: ANIM.duration.normal })),
    transform: [
      { translateY: withDelay(index * 70, withSpring(0, ANIM.springSlow)) },
    ],
  }));

  return (
    <Animated.View style={[{ opacity: 0, transform: [{ translateY: 24 }] }, entrance, press.animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={relS.card}
        activeOpacity={1}
      >
        <View style={relS.imgWrap}>
          <Image source={{ uri: item.image }} style={relS.img} resizeMode="cover" />
          <View style={relS.ratingBadge}>
            <Ionicons name="star" size={9} color={COLORS.primary} />
            <Text style={relS.ratingTxt}>{item.rating}</Text>
          </View>
        </View>
        <View style={relS.info}>
          <Text style={relS.name} numberOfLines={2}>{item.name}</Text>
          <Text style={relS.price}>{fmt(item.price)}</Text>
          <Text style={relS.unit}>/ {item.unit}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────
export default function ItemDetailScreen({ navigation, route }) {
  const insets       = useSafeAreaInsets();
  const { addItem }  = useCart();

  // State
  const [isLoading,  setLoading]  = useState(true);
  const [imgIdx,     setImgIdx]   = useState(0);
  const [qty,        setQty]      = useState(GROCERY_PRODUCT.minQty);
  const [activeUnit, setUnit]     = useState(UNITS[0]);
  const [expanded,   setExpanded] = useState(false);
  const [added,      setAdded]    = useState(false);

  const item = GROCERY_PRODUCT;

  // Animations
  const { particles, trigger } = useConfetti();
  const btnScale     = useSharedValue(1);
  const inStockPulse = useSharedValue(1);
  const cartBarY     = useSharedValue(100);
  const contentFade  = useSharedValue(0);
  const minusPress   = usePress();
  const plusPress    = usePress();

  // Simulate network fetch → reveal content
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
      contentFade.value = withTiming(1, { duration: 380 });
      cartBarY.value    = withSpring(0, ANIM.springSlow);
      inStockPulse.value = withRepeat(
        withSequence(
          withTiming(1.10, { duration: 750 }),
          withTiming(1,    { duration: 750 }),
        ),
        -1,
        false,
      );
    }, SKELETON_MS);
    return () => clearTimeout(t);
  }, []);

  // Animated styles
  const contentStyle  = useAnimatedStyle(() => ({ opacity: contentFade.value }));
  const inStockStyle  = useAnimatedStyle(() => ({ transform: [{ scale: inStockPulse.value }] }));
  const btnStyle      = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const cartBarStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: cartBarY.value }] }));

  // Handlers
  const handleAddToCart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    btnScale.value = withSequence(
      withSpring(0.91, ANIM.springFast),
      withSpring(1,    ANIM.spring),
    );
    trigger();
    addItem({ ...item, qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }, [item, qty]);

  const handleDecrement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQty(q => Math.max(item.minQty, q - 1));
  }, [item.minQty]);

  const handleIncrement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQty(q => q + 1);
  }, []);

  const totalPrice = item.price * qty;
  const savings    = item.originalPrice - item.price;

  // ── RENDER: skeleton ────────────────────────────────────────────────────────────
  if (isLoading) return <SkeletonScreen />;

  // ── RENDER: content ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 190 }}
        >

          {/* ── GALLERY ──────────────────────────────────── */}
          <View style={styles.galleryWrap}>
            {/* Blurred bg */}
            <Image
              source={{ uri: item.images[imgIdx] }}
              style={styles.galleryBg}
              blurRadius={22}
            />
            <LinearGradient
              colors={['rgba(61,43,0,0.18)', 'rgba(61,43,0,0)', 'rgba(61,43,0,0)', 'rgba(61,43,0,0.72)']}
              locations={[0, 0.2, 0.55, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Main image swiper */}
            <FlatList
              data={item.images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => `img-${i}`}
              onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
              renderItem={({ item: img }) => (
                <Image source={{ uri: img }} style={styles.galleryImg} resizeMode="cover" />
              )}
            />

            {/* Top controls */}
            <SafeAreaView edges={['top']} style={styles.galleryTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassBtn}>
                <Ionicons name="arrow-back" size={20} color={COLORS.bg} />
              </TouchableOpacity>
              <View style={styles.glassTag}>
                <Text style={styles.glassTagTxt}>{item.categoryLabel}</Text>
              </View>
              <TouchableOpacity style={styles.glassBtn}>
                <Ionicons name="heart-outline" size={20} color={COLORS.bg} />
              </TouchableOpacity>
            </SafeAreaView>

            {/* Discount badge */}
            {item.discount > 0 && (
              <View style={styles.discBadge}>
                <Text style={styles.discTxt}>{item.discount}% OFF</Text>
              </View>
            )}

            {/* Brand + name overlaid on image */}
            <View style={styles.galleryBottom}>
              <Text style={styles.galleryBrand}>{item.brand}</Text>
              <Text style={styles.galleryName}>{item.name}</Text>
            </View>

            {/* Dot indicators */}
            <View style={styles.dots}>
              {item.images.map((_, i) => (
                <View key={i} style={[styles.dot, imgIdx === i && styles.dotActive]} />
              ))}
            </View>
          </View>

          {/* ── THUMBNAIL STRIP ───────────────────────────── */}
          <View style={styles.thumbStrip}>
            {item.thumbnails.map((src, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setImgIdx(i)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: src }}
                  style={[styles.thumb, imgIdx === i && styles.thumbActive]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* ── CONTENT BODY ──────────────────────────────── */}
          <View style={styles.body}>

            {/* Store + stock row */}
            <View style={styles.metaBar}>
              <TouchableOpacity style={styles.storePill}>
                <View style={styles.storeDot} />
                <Text style={styles.storeName}>{item.store}</Text>
              </TouchableOpacity>

              {item.inStock ? (
                <Animated.View style={[styles.stockBadge, inStockStyle]}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.stockTxt}>In Stock · {item.stock} left</Text>
                </Animated.View>
              ) : (
                <View style={styles.outBadge}>
                  <Text style={styles.outTxt}>Out of Stock</Text>
                </View>
              )}
            </View>

            {/* Name + subtitle */}
            <View style={styles.nameBlock}>
              <Text style={styles.itemName}>{item.nameShort}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            </View>

            {/* Rating row */}
            <View style={styles.ratingRow}>
              <View style={styles.starsRow}>
                {[1,2,3,4,5].map(i => (
                  <Ionicons
                    key={i}
                    name={i <= Math.floor(item.rating) ? 'star' : i - 0.5 <= item.rating ? 'star-half' : 'star-outline'}
                    size={14}
                    color={COLORS.primary}
                  />
                ))}
              </View>
              <Text style={styles.ratingNum}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({item.reviews.toLocaleString()} reviews)</Text>
              <View style={styles.certPill}>
                <Text style={styles.certTxt}>{item.certification}</Text>
              </View>
            </View>

            {/* Price ribbon */}
            <View style={styles.priceRibbon}>
              <View>
                <Text style={styles.origPrice}>{fmt(item.originalPrice)}</Text>
                <Text style={styles.price}>{fmt(item.price)}</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveTxt}>You save {fmt(savings)} 🎉</Text>
                </View>
              </View>
              <View style={styles.priceRight}>
                <Text style={styles.perUnit}>per {activeUnit}</Text>
                <View style={styles.totalPill}>
                  <Text style={styles.totalPillTxt}>📦 {fmt(totalPrice)}</Text>
                </View>
              </View>
            </View>

            <Divider />

            {/* Unit selector */}
            <Text style={styles.secLabel}>Select Unit</Text>
            <View style={styles.unitRow}>
              {UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitBtn, activeUnit === u && styles.unitBtnActive]}
                  activeOpacity={0.8}
                >
                  {activeUnit === u && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={COLORS.secondaryDark}
                      style={{ marginRight: SPACING.xs }}
                    />
                  )}
                  <Text style={[styles.unitTxt, activeUnit === u && styles.unitTxtActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Divider />

            {/* Freshness facts */}
            <Text style={styles.secLabel}>Freshness Facts</Text>
            <View style={styles.freshRow}>
              {item.freshnessChips.map((chip, i) => (
                <View key={i} style={styles.freshChip}>
                  <Text style={styles.freshIcon}>{chip.icon}</Text>
                  <View>
                    <Text style={styles.freshLabel}>{chip.label}</Text>
                    <Text style={styles.freshVal}>{chip.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Divider />

            {/* Description */}
            <Text style={styles.secLabel}>About this item</Text>
            <Text style={styles.desc}>{item.description}</Text>
            {!expanded ? (
              <TouchableOpacity onPress={() => setExpanded(true)} activeOpacity={0.7}>
                <Text style={styles.readMore}>Read more ›</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.desc, { marginTop: SPACING.sm }]}>{item.descriptionExtra}</Text>
            )}

            <Divider />

            {/* Nutrition grid */}
            <Text style={styles.secLabel}>Nutrition per 100g</Text>
            <View style={styles.nutrGrid}>
              {item.nutrition.map((n, i) => (
                <View key={i} style={styles.nutrCell}>
                  <Text style={styles.nutrVal}>{n.value}</Text>
                  {n.unit && <Text style={styles.nutrUnit}>{n.unit}</Text>}
                  <Text style={styles.nutrLabel}>{n.label}</Text>
                </View>
              ))}
            </View>

            <Divider />

            {/* Tags */}
            <Text style={styles.secLabel}>Labels & Alerts</Text>
            <View style={styles.tagsRow}>
              {item.tags.map((tag, i) => (
                <View key={i} style={[styles.tag, tag.warn && styles.tagWarn]}>
                  <Text style={[styles.tagTxt, tag.warn && styles.tagTxtWarn]}>{tag.label}</Text>
                </View>
              ))}
            </View>

            {/* Delivery & returns */}
            <View style={styles.infoTiles}>
              <View style={styles.infoTile}>
                <Text style={styles.infoTileIcon}>🚚</Text>
                <View>
                  <Text style={styles.infoTileLabel}>Delivery</Text>
                  <Text style={styles.infoTileVal}>{item.delivery}</Text>
                </View>
              </View>
              <View style={styles.infoTile}>
                <Text style={styles.infoTileIcon}>↩️</Text>
                <View>
                  <Text style={styles.infoTileLabel}>Returns</Text>
                  <Text style={styles.infoTileVal}>{item.returns}</Text>
                </View>
              </View>
            </View>

            <Divider />

            {/* Related */}
            <Text style={styles.secLabel}>You May Also Like</Text>
            <FlatList
              data={RELATED_PRODUCTS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={r => r.id}
              contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: SPACING.sm }}
              renderItem={({ item: r, index }) => (
                <RelatedCard
                  item={r}
                  index={index}
                  onPress={() => navigation.push('ItemDetail', { item: r })}
                />
              )}
            />

          </View>
        </ScrollView>
      </Animated.View>

      {/* ── CONFETTI ──────────────────────────────────────── */}
      <View style={confS.container} pointerEvents="none">
        {particles.map((p, i) => (
          <ConfettiParticle
            key={i}
            p={p}
            color={[COLORS.primary, COLORS.secondary, COLORS.primaryDark, COLORS.secondaryDark][i % 4]}
          />
        ))}
      </View>

      {/* ── BOTTOM BAR ────────────────────────────────────── */}
      <Animated.View style={[btmS.wrapper, { paddingBottom: insets.bottom + SPACING.md }, cartBarStyle]}>
        <LinearGradient
          colors={['rgba(250,247,242,0)', 'rgba(250,247,242,0.98)']}
          style={btmS.scrim}
          pointerEvents="none"
        />
        <View style={btmS.card}>

          {/* Qty stepper */}
          <View style={btmS.stepperBlock}>
            <Text style={btmS.stepperLbl}>Qty</Text>
            <View style={btmS.stepper}>

              <Animated.View style={minusPress.animStyle}>
                <TouchableOpacity
                  onPress={handleDecrement}
                  onPressIn={minusPress.onPressIn}
                  onPressOut={minusPress.onPressOut}
                  style={[btmS.stepBtn, btmS.stepMinus, qty <= item.minQty && btmS.stepDisabled]}
                  activeOpacity={1}
                >
                  <Ionicons name="remove" size={18} color={qty <= item.minQty ? COLORS.textMuted : COLORS.text} />
                </TouchableOpacity>
              </Animated.View>

              <View style={btmS.qtyBox}>
                <Text style={btmS.qtyNum}>{qty}</Text>
              </View>

              <Animated.View style={plusPress.animStyle}>
                <TouchableOpacity
                  onPress={handleIncrement}
                  onPressIn={plusPress.onPressIn}
                  onPressOut={plusPress.onPressOut}
                  style={[btmS.stepBtn, btmS.stepPlus]}
                  activeOpacity={1}
                >
                  <Ionicons name="add" size={18} color={COLORS.dark} />
                </TouchableOpacity>
              </Animated.View>

            </View>
          </View>

          {/* Vertical rule */}
          <View style={btmS.vRule} />

          {/* Total + CTA */}
          <View style={btmS.ctaBlock}>
            <View style={btmS.totalRow}>
              <Text style={btmS.totalLbl}>Total</Text>
              <Text style={btmS.totalAmt}>{fmt(totalPrice)}</Text>
            </View>

            <Animated.View style={btnStyle}>
              <TouchableOpacity
                onPress={handleAddToCart}
                onPressIn={() => { btnScale.value = withSpring(0.95, ANIM.springFast); }}
                onPressOut={() => { btnScale.value = withSpring(1,    ANIM.spring);     }}
                activeOpacity={1}
                disabled={!item.inStock}
                style={[
                  btmS.addBtn,
                  added && btmS.addBtnSuccess,
                  !item.inStock && btmS.addBtnDisabled,
                ]}
              >
                <Ionicons
                  name={added ? 'checkmark-circle-outline' : 'bag-add-outline'}
                  size={20}
                  color={added ? COLORS.surface : COLORS.dark}
                />
                <Text style={[btmS.addBtnTxt, added && btmS.addBtnTxtSuccess]}>
                  {added ? 'Added!' : 'Add to Cart'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

        </View>
      </Animated.View>
    </View>
  );
}

// ─── SKELETON STYLES ──────────────────────────────────────────────────────────────
const skS = StyleSheet.create({
  base:    { backgroundColor: '#EDE5D0', borderRadius: RADIUS.md },
  gallery: { height: W * 0.9, borderRadius: 0 },
  thumbRow: {
    flexDirection: 'row', gap: SPACING.sm,
    padding: SPACING.md, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  thumb:   { width: 56, height: 56, borderRadius: RADIUS.sm },
  row:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, marginTop: SPACING.md, gap: SPACING.sm },
  pill:    { height: 28, width: 100, borderRadius: RADIUS.full },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  chipRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md },
  chip:    { flex: 1, height: 60, borderRadius: RADIUS.md },
  nutrRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md },
  nutrCell:{ flex: 1, height: 62, borderRadius: RADIUS.md },
  relRow:  { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md },
  relCard: { width: 130, height: 162, borderRadius: RADIUS.lg },
});

// ─── MAIN STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Gallery
  galleryWrap:  { height: W * 0.9, position: 'relative', overflow: 'hidden', backgroundColor: COLORS.dark },
  galleryBg:    { position: 'absolute', width: '100%', height: '100%', opacity: 0.28 },
  galleryImg:   { width: W, height: W * 0.9 },
  galleryTop:   {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.xs,
  },
  glassBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(28,26,16,0.52)',
    borderWidth: 1, borderColor: 'rgba(250,247,242,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  glassTag: {
    backgroundColor: 'rgba(28,26,16,0.52)',
    borderWidth: 1, borderColor: 'rgba(250,247,242,0.18)',
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
  },
  glassTagTxt: { color: COLORS.bg, fontSize: 12, fontWeight: '600' },
  discBadge: {
    position: 'absolute', bottom: 10, right: SPACING.md,
    backgroundColor: COLORS.warning, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: SPACING.xs + 2,
  },
  discTxt:     { color: COLORS.surface, fontSize: 12, fontWeight: '800' },
  galleryBottom: {
    position: 'absolute', bottom: SPACING.xl, left: SPACING.md, right: SPACING.md,
  },
  galleryBrand: {
    color: 'rgba(250,247,242,0.82)', fontSize: 13, fontWeight: '400',
    fontStyle: 'italic', marginBottom: 4,
  },
  galleryName: {
    color: '#FFFFFF', fontSize: 24, fontWeight: '800',
    lineHeight: 30,
    textShadowColor: 'rgba(61,43,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  dots: {
    position: 'absolute', bottom: SPACING.sm, alignSelf: 'center',
    flexDirection: 'row', gap: SPACING.xs,
  },
  dot:       { width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(250,247,242,0.38)' },
  dotActive: { width: SPACING.lg, backgroundColor: COLORS.secondary },

  // Thumbnail strip
  thumbStrip: {
    flexDirection: 'row', gap: SPACING.sm,
    padding: SPACING.md, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  thumb:       { width: 56, height: 56, borderRadius: RADIUS.sm, borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: COLORS.primaryDark },

  // Body
  body: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm },

  // Meta bar
  metaBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storePill: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: SPACING.xs + 2,
  },
  storeDot:  { width: 7, height: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.secondary },
  storeName: { color: COLORS.textSub, fontSize: 12, fontWeight: '600' },
  stockBadge:{
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.successLight, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: SPACING.xs + 2,
  },
  pulseDot:  { width: 7, height: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.success },
  stockTxt:  { color: COLORS.success, fontSize: 12, fontWeight: '700' },
  outBadge:  { backgroundColor: COLORS.errorLight, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  outTxt:    { color: COLORS.error, fontSize: 12, fontWeight: '700' },

  // Name block
  nameBlock:    {},
  itemName:     { color: COLORS.text, fontSize: 26, fontWeight: '900', lineHeight: 32 },
  itemSubtitle: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500', marginTop: 4 },

  // Rating
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  starsRow:    { flexDirection: 'row', gap: 2 },
  ratingNum:   { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  ratingCount: { color: COLORS.textMuted, fontSize: 13 },
  certPill: {
    marginLeft: 'auto', backgroundColor: COLORS.primaryLight,
    borderWidth: 1, borderColor: '#FFE082',
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: SPACING.xs,
  },
  certTxt: { color: COLORS.secondaryDark, fontSize: 11, fontWeight: '600' },

  // Price ribbon
  priceRibbon: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    ...SHADOW.subtle,
  },
  origPrice: { color: COLORS.textMuted, fontSize: 13, textDecorationLine: 'line-through' },
  price:     { color: COLORS.secondaryDark, fontSize: 32, fontWeight: '900', lineHeight: 36 },
  saveBadge: {
    marginTop: SPACING.xs, alignSelf: 'flex-start',
    backgroundColor: COLORS.successLight, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: 3,
  },
  saveTxt:  { color: COLORS.success, fontSize: 11, fontWeight: '700' },
  priceRight: { alignItems: 'flex-end', gap: SPACING.xs },
  perUnit:    { color: COLORS.textMuted, fontSize: 12, fontWeight: '500' },
  totalPill: {
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: '#FFE082',
    paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: SPACING.xs + 2,
  },
  totalPillTxt: { color: COLORS.secondaryDark, fontSize: 13, fontWeight: '700' },

  // Section label
  secLabel: { color: COLORS.text, fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },

  // Unit selector
  unitRow: { flexDirection: 'row', gap: SPACING.sm },
  unitBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.surfaceAlt,
  },
  unitBtnActive: {
    borderColor: COLORS.borderStrong, backgroundColor: COLORS.secondaryLight,
    ...SHADOW.card,
  },
  unitTxt:       { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  unitTxtActive: { color: COLORS.secondaryDark },

  // Freshness chips
  freshRow: { flexDirection: 'row', gap: SPACING.sm },
  freshChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm,
    ...SHADOW.subtle,
  },
  freshIcon:  { fontSize: 20 },
  freshLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  freshVal:   { color: COLORS.textSub,   fontSize: 12, fontWeight: '700', marginTop: 1 },

  // Description
  desc:     { color: COLORS.textMuted, fontSize: 14, lineHeight: 22 },
  readMore: {
    color: COLORS.secondaryDark, fontSize: 14, fontWeight: '600',
    borderBottomWidth: 1, borderBottomColor: COLORS.borderStrong,
    alignSelf: 'flex-start', marginTop: SPACING.xs,
  },

  // Nutrition
  nutrGrid: { flexDirection: 'row', gap: SPACING.sm },
  nutrCell: {
    flex: 1, alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingVertical: SPACING.sm,
  },
  nutrVal:   { color: COLORS.textSub,   fontSize: 16, fontWeight: '800' },
  nutrUnit:  { color: COLORS.textMuted, fontSize: 10 },
  nutrLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '500', marginTop: 2 },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tag: {
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: '#FFE082',
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: SPACING.xs + 2,
  },
  tagWarn:    { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning },
  tagTxt:     { color: COLORS.secondaryDark, fontSize: 12, fontWeight: '600' },
  tagTxtWarn: { color: COLORS.warning },

  // Info tiles
  infoTiles: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  infoTile: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: SPACING.sm + 2,
    ...SHADOW.subtle,
  },
  infoTileIcon:  { fontSize: 18 },
  infoTileLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  infoTileVal:   { color: COLORS.textSub,   fontSize: 12, fontWeight: '700', marginTop: 1 },
});

// ─── RELATED CARD STYLES ──────────────────────────────────────────────────────────
const relS = StyleSheet.create({
  card: {
    width: 132, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
  },
  imgWrap:     { height: 96, position: 'relative' },
  img:         { width: '100%', height: '100%' },
  ratingBadge: {
    position: 'absolute', top: 6, left: 6,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(250,247,242,0.92)',
    borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 3,
  },
  ratingTxt: { color: COLORS.secondaryDark, fontSize: 11, fontWeight: '700' },
  info:  { padding: SPACING.sm },
  name:  { color: COLORS.text, fontSize: 12, fontWeight: '600', lineHeight: 17, marginBottom: 4 },
  price: { color: COLORS.textSub, fontSize: 14, fontWeight: '800' },
  unit:  { color: COLORS.textMuted, fontSize: 10 },
});

// ─── BOTTOM BAR STYLES ────────────────────────────────────────────────────────────
const btmS = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
  },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.float,
  },
  stepperBlock: {
    width: 130, alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, gap: SPACING.xs,
  },
  stepperLbl: {
    color: COLORS.textMuted, fontSize: 10, fontWeight: '700',
    letterSpacing: 0.9, textTransform: 'uppercase',
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  stepBtn: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  stepMinus: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1, borderColor: COLORS.border,
  },
  stepPlus:    { backgroundColor: COLORS.primary },
  stepDisabled:{ opacity: 0.38 },
  qtyBox:      { width: 36, alignItems: 'center' },
  qtyNum:      { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  vRule:       { width: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  ctaBlock: {
    flex: 1, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    justifyContent: 'space-between', gap: SPACING.sm,
  },
  totalRow:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalLbl:  { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  totalAmt:  { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  addBtn: {
    height: 48, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm,
    ...SHADOW.card,
  },
  addBtnSuccess:  { backgroundColor: COLORS.success },
  addBtnDisabled: { opacity: 0.38 },
  addBtnTxt:      { color: COLORS.dark, fontSize: 15, fontWeight: '800' },
  addBtnTxtSuccess: { color: COLORS.surface },
});

// ─── CONFETTI STYLES ──────────────────────────────────────────────────────────────
const confS = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 130,
    left: W / 2 - SPACING.sm, width: SPACING.md, height: SPACING.md,
  },
  particle: {
    position: 'absolute',
    width: SPACING.sm + SPACING.xs + 2,
    height: SPACING.sm + SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
});