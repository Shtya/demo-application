import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, StyleSheet, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence, withDelay, interpolate, Extrapolation, useAnimatedScrollHandler, FadeIn, Easing, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCart } from '../context/CartContext';
import { useFavIcon } from '../context/FavIconContext';
import { fetchGroceries } from '../services/api';

// ─── BRAND CONSTANTS ─────────────────────────────────────────────────────────────
const COLORS = {
  primary: '#FFC107',
  primaryDark: '#FF8F00',
  primaryLight: '#FFF8E1',
  secondary: '#B8975A',
  secondaryDark: '#7A5C2E',
  secondaryLight: '#F3EDE0',
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EDE0',
  text: '#1A0F00',
  textSub: '#7A5C2E',
  textMuted: '#B8975A',
  border: '#E8DCC8',
  borderStrong: '#B8975A',
  dark: '#3D2B00',
  darkMid: '#5C3D00',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  error: '#C62828',
  errorLight: '#FDECEA',
  info: '#1565C0',
  infoLight: '#E3F2FD',
  warning: '#E65100',
  warningLight: '#FBE9E7',
};

const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const RADIUS = { sm: 8, md: 12, lg: 20, xl: 28, full: 999 };
const SHADOW = {
  card: { shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  float: { shadowColor: '#FFC107', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 },
};
const ANIM = {
  spring: { damping: 16, stiffness: 160 },
  springFast: { damping: 12, stiffness: 200 },
  springSlow: { damping: 20, stiffness: 120 },
  duration: { fast: 150, normal: 280, slow: 450 },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────────
const { width: W, height: H } = Dimensions.get('window');
const COVER_H = 260;

// ─── SECTION CONFIG ───────────────────────────────────────────────────────────────
const SECTION_TITLES = ['Top Picks 🏆', 'Fresh Produce 🥦', 'Pantry Staples 🛒', 'Snacks & More 🍪'];
const SECTION_TABS = SECTION_TITLES.map(t => t.split(' ')[0]);
const formatPrice = p => `QAR ${p.toLocaleString()}`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────────
const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => {
    scale.value = withSpring(0.95, ANIM.springFast);
  };
  const onPressOut = () => {
    scale.value = withSpring(1, ANIM.spring);
  };
  return { animStyle, onPressIn, onPressOut };
};

// ─── FLY-TO-CART PARTICLE ────────────────────────────────────────────────────────
const FlyParticle = ({ startX, startY, targetX, targetY, onComplete }) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 680, easing: Easing.out(Easing.quad) }, fin => {
      if (fin) runOnJS(onComplete)();
    });
  }, []);

  const animStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const cpX = startX + (targetX - startX) * 0.3;
    const cpY = Math.min(startY, targetY) - 130;
    const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cpX + t * t * targetX;
    const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cpY + t * t * targetY;
    return {
      left: x - 16,
      top: y - 16,
      opacity: interpolate(t, [0, 0.75, 1], [1, 1, 0]),
      transform: [{ scale: interpolate(t, [0, 0.4, 1], [1, 1.25, 0.5]) }],
    };
  });

  return (
    <Animated.View style={[flyP.wrap, animStyle]} pointerEvents='none'>
      <View style={flyP.dot}>
        <Ionicons name='cart' size={15} color={COLORS.text} />
      </View>
    </Animated.View>
  );
};
const flyP = StyleSheet.create({
  wrap: { position: 'absolute', width: 32, height: 32, zIndex: 9999 },
  dot: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────────

const StarRating = ({ rating }) => {
  const full = Math.floor(rating);
  const frac = rating - full;
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= full ? 'star' : i === full + 1 && frac >= 0.5 ? 'star-half' : 'star-outline'} size={12} color={COLORS.primary} />
      ))}
    </View>
  );
};

const Divider = () => <View style={styles.divider} />;

const ProductRow = ({ item, storeId, onPress, index, onAddToCart }) => {
  const [qty, setQty] = useState(0);
  const p = usePress();
  const { addItem, updateQty, removeItem } = useCart();
  const btnScale = useSharedValue(1);
  const addBtnRef = useRef(null);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: withDelay(index * 60, withTiming(1, { duration: ANIM.duration.normal })),
    transform: [{ translateY: withDelay(index * 60, withSpring(0, ANIM.springSlow)) }],
  }));

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    btnScale.value = withSequence(withSpring(0.85, ANIM.springFast), withSpring(1, ANIM.spring));
    addItem({ ...item, storeId });
    setQty(q => q + 1);
    addBtnRef.current?.measure((_, __, w, h, px, py) => {
      onAddToCart && onAddToCart(px + w / 2, py + h / 2);
    });
  };

  const handleDec = () => {
    const newQ = qty - 1;
    setQty(newQ);
    if (newQ === 0) removeItem(item.id, storeId);
    else updateQty(item.id, storeId, newQ);
  };

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const discount = item.originalPrice > item.price ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : null;

  return (
    <Animated.View style={[{ opacity: 0, transform: [{ translateY: 20 }] }, entranceStyle]}>
      <Animated.View style={p.animStyle}>
        <TouchableOpacity onPress={onPress} onPressIn={p.onPressIn} onPressOut={p.onPressOut} style={styles.productRow} activeOpacity={1}>
          {/* Image block */}
          <View style={styles.productImgWrap}>
            <Image source={{ uri: item.image }} style={styles.productRowImg} />
            {discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountTxt}>-{discount}%</Text>
              </View>
            )}
          </View>

          {/* Info block */}
          <View style={{flex: 1 , flexDirection: 'row' , marginLeft: SPACING.md, justifyContent: 'space-between' }}>
            <View style={styles.productRowInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.productUnit}>{item.unit}</Text>

              <View style={styles.ratingRow}>
                <StarRating rating={item.rating} />
                <Text style={styles.reviewTxt}>
                  {item.rating} ({item.reviews})
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatPrice(item.price)}</Text>
                {item.originalPrice > item.price && <Text style={styles.origPrice}>{formatPrice(item.originalPrice)}</Text>}
              </View>
            </View>

            {/* Stepper / Add */}
            <View style={styles.addArea}>
              {qty === 0 ? (
                <Animated.View style={btnStyle}>
                  <TouchableOpacity ref={addBtnRef} onPress={handleAdd} style={styles.addBtn}>
                    <Ionicons name='add' size={18} color={COLORS.text} />
                    <Text style={styles.addBtnTxt}>Add</Text>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <View style={styles.stepper}>
                  <TouchableOpacity onPress={handleDec} style={styles.stepBtn}>
                    <Ionicons name='remove' size={14} color={COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.stepCount}>{qty}</Text>
                  <TouchableOpacity ref={addBtnRef} onPress={handleAdd} style={[styles.stepBtn, styles.stepBtnActive]}>
                    <Ionicons name='add' size={14} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
      <Divider />
    </Animated.View>
  );
};

const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeaderWrap}>
    <View style={styles.sectionHeaderAccent} />
    <Text style={styles.sectionHeaderTxt}>{title}</Text>
  </View>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────
export default function StoreScreen({ navigation, route }) {
  const { store } = route.params || {};
  const insets = useSafeAreaInsets();
  const { cartTabPos } = useFavIcon();
  const [particles, setParticles] = useState([]);
  const [storeSections, setStoreSections] = useState([
    {
      title: 'Top Picks 🏆',
      data: [
        { id: '16', name: 'Apple', price: 7, originalPrice: 8, discount: 13, image: 'https://cdn.dummyjson.com/product-images/groceries/apple/thumbnail.webp', rating: 4.19, reviews: 32, store: 'Green Market', storeId: 's1', unit: 'Pcs' },
        { id: '17', name: 'Beef Steak', price: 47, originalPrice: 52, discount: 10, image: 'https://cdn.dummyjson.com/product-images/groceries/beef-steak/thumbnail.webp', rating: 4.47, reviews: 344, store: 'Farm Bazaar', storeId: 's2', unit: 'Pcs' },
        { id: '18', name: 'Cat Food', price: 33, originalPrice: 37, discount: 10, image: 'https://cdn.dummyjson.com/product-images/groceries/cat-food/thumbnail.webp', rating: 3.13, reviews: 184, store: 'Fresh Corner', storeId: 's3', unit: 'Pcs' },
        { id: '19', name: 'Chicken Meat', price: 36, originalPrice: 42, discount: 14, image: 'https://cdn.dummyjson.com/product-images/groceries/chicken-meat/thumbnail.webp', rating: 3.19, reviews: 388, store: 'Veggie World', storeId: 's4', unit: 'Pcs' },
        { id: '20', name: 'Cooking Oil', price: 18, originalPrice: 20, discount: 9, image: 'https://cdn.dummyjson.com/product-images/groceries/cooking-oil/thumbnail.webp', rating: 4.8, reviews: 40, store: 'Harvest Home', storeId: 's5', unit: 'Pcs' },
        { id: '21', name: 'Cucumber', price: 5, originalPrice: 5, discount: 5, image: 'https://cdn.dummyjson.com/product-images/groceries/cucumber/thumbnail.webp', rating: 4.07, reviews: 336, store: 'Green Market', storeId: 's1', unit: 'Pcs' },
        { id: '22', name: 'Dog Food', price: 40, originalPrice: 44, discount: 10, image: 'https://cdn.dummyjson.com/product-images/groceries/dog-food/thumbnail.webp', rating: 4.55, reviews: 284, store: 'Farm Bazaar', storeId: 's2', unit: 'Pcs' },
      ],
    },
    {
      title: 'Fresh Produce 🥦',
      data: [
        { id: '23', name: 'Eggs', price: 11, originalPrice: 12, discount: 11, image: 'https://cdn.dummyjson.com/product-images/groceries/eggs/thumbnail.webp', rating: 2.53, reviews: 36, store: 'Fresh Corner', storeId: 's3', unit: 'Pcs' },
        { id: '24', name: 'Fish Steak', price: 55, originalPrice: 58, discount: 5, image: 'https://cdn.dummyjson.com/product-images/groceries/fish-steak/thumbnail.webp', rating: 3.78, reviews: 296, store: 'Veggie World', storeId: 's4', unit: 'Pcs' },
        { id: '25', name: 'Green Bell Pepper', price: 5, originalPrice: 5, discount: 5, image: 'https://cdn.dummyjson.com/product-images/groceries/green-bell-pepper/thumbnail.webp', rating: 3.25, reviews: 132, store: 'Harvest Home', storeId: 's5', unit: 'Pcs' },
        { id: '26', name: 'Green Chili Pepper', price: 4, originalPrice: 4, discount: 5, image: 'https://cdn.dummyjson.com/product-images/groceries/green-chili-pepper/thumbnail.webp', rating: 3.66, reviews: 12, store: 'Green Market', storeId: 's1', unit: 'Pcs' },
        { id: '27', name: 'Honey Jar', price: 25, originalPrice: 29, discount: 14, image: 'https://cdn.dummyjson.com/product-images/groceries/honey-jar/thumbnail.webp', rating: 3.97, reviews: 136, store: 'Farm Bazaar', storeId: 's2', unit: 'Pcs' },
        { id: '28', name: 'Ice Cream', price: 20, originalPrice: 22, discount: 9, image: 'https://cdn.dummyjson.com/product-images/groceries/ice-cream/thumbnail.webp', rating: 3.39, reviews: 108, store: 'Fresh Corner', storeId: 's3', unit: 'Pcs' },
        { id: '29', name: 'Juice', price: 15, originalPrice: 17, discount: 12, image: 'https://cdn.dummyjson.com/product-images/groceries/juice/thumbnail.webp', rating: 3.94, reviews: 200, store: 'Veggie World', storeId: 's4', unit: 'Pcs' },
      ],
    },
    {
      title: 'Pantry Staples 🛒',
      data: [
        { id: '30', name: 'Kiwi', price: 9, originalPrice: 11, discount: 15, image: 'https://cdn.dummyjson.com/product-images/groceries/kiwi/thumbnail.webp', rating: 4.93, reviews: 396, store: 'Harvest Home', storeId: 's5', unit: 'Pcs' },
        { id: '31', name: 'Lemon', price: 3, originalPrice: 3, discount: 10, image: 'https://cdn.dummyjson.com/product-images/groceries/lemon/thumbnail.webp', rating: 3.53, reviews: 124, store: 'Green Market', storeId: 's1', unit: 'Pcs' },
        { id: '32', name: 'Milk', price: 13, originalPrice: 15, discount: 14, image: 'https://cdn.dummyjson.com/product-images/groceries/milk/thumbnail.webp', rating: 2.61, reviews: 108, store: 'Farm Bazaar', storeId: 's2', unit: 'Pcs' },
        { id: '33', name: 'Mulberry', price: 18, originalPrice: 21, discount: 13, image: 'https://cdn.dummyjson.com/product-images/groceries/mulberry/thumbnail.webp', rating: 4.95, reviews: 396, store: 'Fresh Corner', storeId: 's3', unit: 'Pcs' },
        { id: '34', name: 'Nescafe Coffee', price: 29, originalPrice: 31, discount: 5, image: 'https://cdn.dummyjson.com/product-images/groceries/nescafe-coffee/thumbnail.webp', rating: 4.82, reviews: 228, store: 'Veggie World', storeId: 's4', unit: 'Pcs' },
        { id: '35', name: 'Potatoes', price: 8, originalPrice: 8, discount: 5, image: 'https://cdn.dummyjson.com/product-images/groceries/potatoes/thumbnail.webp', rating: 4.81, reviews: 52, store: 'Harvest Home', storeId: 's5', unit: 'Pcs' },
        { id: '36', name: 'Protein Powder', price: 73, originalPrice: 79, discount: 8, image: 'https://cdn.dummyjson.com/product-images/groceries/protein-powder/thumbnail.webp', rating: 4.18, reviews: 320, store: 'Green Market', storeId: 's1', unit: 'Pcs' },
      ],
    },
    {
      title: 'Snacks & More 🍪',
      data: [
        { id: '37', name: 'Red Onions', price: 7, originalPrice: 8, discount: 10, image: 'https://cdn.dummyjson.com/product-images/groceries/red-onions/thumbnail.webp', rating: 4.2, reviews: 328, store: 'Farm Bazaar', storeId: 's2', unit: 'Pcs' },
        { id: '38', name: 'Rice', price: 22, originalPrice: 24, discount: 9, image: 'https://cdn.dummyjson.com/product-images/groceries/rice/thumbnail.webp', rating: 3.18, reviews: 236, store: 'Fresh Corner', storeId: 's3', unit: 'Pcs' },
        { id: '39', name: 'Soft Drinks', price: 7, originalPrice: 8, discount: 17, image: 'https://cdn.dummyjson.com/product-images/groceries/soft-drinks/thumbnail.webp', rating: 4.75, reviews: 212, store: 'Veggie World', storeId: 's4', unit: 'Pcs' },
        { id: '40', name: 'Strawberry', price: 15, originalPrice: 16, discount: 5, image: 'https://cdn.dummyjson.com/product-images/groceries/strawberry/thumbnail.webp', rating: 3.08, reviews: 184, store: 'Harvest Home', storeId: 's5', unit: 'Pcs' },
        { id: '41', name: 'Tissue Paper Box', price: 9, originalPrice: 10, discount: 13, image: 'https://cdn.dummyjson.com/product-images/groceries/tissue-paper-box/thumbnail.webp', rating: 2.69, reviews: 344, store: 'Green Market', storeId: 's1', unit: 'Pcs' },
        { id: '42', name: 'Water', price: 4, originalPrice: 5, discount: 15, image: 'https://cdn.dummyjson.com/product-images/groceries/water/thumbnail.webp', rating: 4.96, reviews: 212, store: 'Farm Bazaar', storeId: 's2', unit: 'Pcs' },
      ],
    },
  ]);

  useEffect(() => {
    let active = true;
    fetchGroceries()
      .then(all => {
        if (!active) return;
        const size = Math.ceil(all.length / SECTION_TITLES.length);
        console.log(
          SECTION_TITLES.map((title, i) => ({
            title,
            data: all.slice(i * size, (i + 1) * size),
          })),
        );
        // setStoreSections(
        //   SECTION_TITLES.map((title, i) => {
        //     return {
        //     title,
        //     data: all.slice(i * size, (i + 1) * size),
        //   }
        //   })
        // );
        // console.log(JSON.stringify(storeSections));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const addParticle = (sx, sy) => {
    const tx = cartTabPos.current.x || W * 0.5;
    const ty = cartTabPos.current.y || H * 0.93;
    setParticles(prev => [...prev, { id: Date.now() + Math.random(), startX: sx, startY: sy, targetX: tx, targetY: ty }]);
  };
  const removeParticle = id => setParticles(prev => prev.filter(p => p.id !== id));

  const scrollY = useSharedValue(0);
  const [activeTab, setActiveTab] = useState(0);
  const [saved, setSaved] = useState(false);
  const heartScale = useSharedValue(1);

  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });

  const coverParallax = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, COVER_H], [0, -COVER_H * 0.35], Extrapolation.CLAMP) }],
  }));

  const headerBg = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], Extrapolation.CLAMP),
    backgroundColor: `rgba(250,247,242,${interpolate(scrollY.value, [0, 80], [0, 0.97], Extrapolation.CLAMP)})`,
  }));

  const headerBorder = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [60, 80], [0, 1], Extrapolation.CLAMP),
  }));

  const toggleSave = () => {
    heartScale.value = withSequence(withSpring(1.35, ANIM.springFast), withSpring(1, ANIM.spring));
    setSaved(s => !s);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const s = store || {
    id: 's1',
    name: 'Organic Shop',
    rating: 4.8,
    time: '20-30 min',
    fee: 'Free',
    dist: '1.2 km',
    isOpen: true,
    cover: 'https://picsum.photos/seed/organicshop/600/300',
    logo: 'https://ui-avatars.com/api/?name=Organic+Shop&background=3D2B00&color=FFF8E1&size=128',
    cashback: 5,
    minOrder: 'QAR 50',
    tags: ['Organic', 'Fresh'],
  };

  let globalIdx = 0;

  return (
    <View style={styles.root}>
      {/* ── Sticky header ─────────────────────────────── */}
      <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top }, headerBg]}>
        <Animated.View style={[styles.stickyBorder, headerBorder]} />
        <View style={styles.stickyInner}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Ionicons name='arrow-back' size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.stickyTitle} numberOfLines={1}>
            {s.name}
          </Text>
          <Animated.View style={heartStyle}>
            <TouchableOpacity onPress={toggleSave} style={styles.headerBtn}>
              <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? COLORS.error : COLORS.text} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
        {/* ── Hero cover ────────────────────────────────── */}
        <View style={{ height: COVER_H, overflow: 'hidden' }}>
          <Animated.View style={[{ height: COVER_H + 60 }, coverParallax]}>
            <Image source={{ uri: s.cover }} style={styles.coverImg} resizeMode='cover' />
            <LinearGradient colors={['transparent', 'rgba(61,43,0,0.40)', 'rgba(61,43,0,0.85)']} style={StyleSheet.absoluteFill} />
          </Animated.View>

          {/* Floating back / save on cover */}
          <SafeAreaView edges={['top']} style={styles.coverBtns} pointerEvents='box-none'>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassBtn}>
              <Ionicons name='arrow-back' size={20} color={COLORS.bg} />
            </TouchableOpacity>
            <Animated.View style={heartStyle}>
              <TouchableOpacity onPress={toggleSave} style={styles.glassBtn}>
                <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? COLORS.error : COLORS.bg} />
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        </View>

        {/* ── Store info card ───────────────────────────── */}
        <View style={styles.infoCard}>
          {/* Logo + name row */}
          <View style={styles.infoTop}>
            <Image source={{ uri: s.logo }} style={styles.storeLogo} />
            <View style={{ flex: 1, gap: SPACING.xs }}>
              <View style={styles.nameRow}>
                <Text style={styles.storeName}>{s.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: s.isOpen ? COLORS.successLight : COLORS.errorLight }]}>
                  <View style={[styles.statusDot, { backgroundColor: s.isOpen ? COLORS.success : COLORS.error }]} />
                  <Text style={[styles.statusTxt, { color: s.isOpen ? COLORS.success : COLORS.error }]}>{s.isOpen ? 'Open' : 'Closed'}</Text>
                </View>
              </View>

              <View style={styles.ratingRow}>
                <StarRating rating={s.rating} />
                <Text style={styles.reviewCountTxt}>{s.rating} · 287 reviews</Text>
              </View>
            </View>
          </View>

          {/* Meta chips */}
          <View style={styles.metaRow}>
            {[
              { icon: 'time-outline', txt: s.time },
              { icon: 'location-outline', txt: s.dist },
              { icon: 'receipt-outline', txt: `Min. ${s.minOrder}` },
              { icon: 'bicycle-outline', txt: s.fee === 'Free' ? 'Free Delivery' : `${s.fee}` },
            ].map(m => (
              <View key={m.icon} style={styles.metaChip}>
                <Ionicons name={m.icon} size={13} color={COLORS.textMuted} />
                <Text style={styles.metaChipTxt}>{m.txt}</Text>
              </View>
            ))}
          </View>

          {/* Tags */}
          {(s.tags || []).length > 0 && (
            <View style={styles.tagRow}>
              {(s.tags || []).map(t => (
                <View key={t} style={styles.tagChip}>
                  <Text style={styles.tagChipTxt}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Category tabs ─────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
          {SECTION_TABS.map((tab, i) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(i)} style={[styles.tab, activeTab === i && styles.tabActive]}>
              <Text style={[styles.tabTxt, activeTab === i && styles.tabTxtActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Products ──────────────────────────────────── */}
        {storeSections.map(section => (
          <View key={section.title}>
            <SectionHeader title={section.title} />
            {section.data.map(item => {
              const idx = globalIdx++;
              return <ProductRow key={item.id} item={item} storeId={s.id} index={idx} onPress={() => navigation.navigate('ItemDetail', { item, store: s })} onAddToCart={addParticle} />;
            })}
          </View>
        ))}
      </Animated.ScrollView>

      {/* ── Fly-to-cart particle overlay ──────────────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents='none'>
        {particles.map(p => (
          <FlyParticle key={p.id} startX={p.startX} startY={p.startY} targetX={p.targetX} targetY={p.targetY} onComplete={() => removeParticle(p.id)} />
        ))}
      </View>
    </View>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Root
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Sticky header
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  stickyBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.border,
  },
  stickyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  stickyTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.card,
  },

  // Cover
  coverImg: { width: '100%', height: COVER_H + 60 },
  coverBtns: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(28,26,16,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(250,247,242,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Store info card
  infoCard: {
    marginHorizontal: SPACING.md,
    marginTop: -SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
    zIndex: 10,
    ...SHADOW.card,
  },
  infoTop: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  storeLogo: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  storeName: { color: COLORS.text, fontSize: 17, fontWeight: '800', flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: RADIUS.full },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  reviewCountTxt: { color: COLORS.textMuted, fontSize: 12 },
  starRow: { flexDirection: 'row', gap: 2 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaChipTxt: { color: COLORS.textSub, fontSize: 12, fontWeight: '500' },

  tagRow: { flexDirection: 'row', gap: SPACING.sm },
  tagChip: {
    paddingHorizontal: SPACING.sm + SPACING.xs,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagChipTxt: { color: COLORS.secondaryDark, fontSize: 12, fontWeight: '600' },

  // Tabs
  tabBar: { marginTop: SPACING.md },
  tabBarContent: { paddingHorizontal: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xs },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  tabActive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderStrong,
    ...SHADOW.card,
  },
  tabTxt: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  tabTxtActive: { color: COLORS.text },

  // Section header
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  sectionHeaderAccent: {
    width: 4,
    height: 20,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.secondary,
  },
  sectionHeaderTxt: { color: COLORS.text, fontSize: 16, fontWeight: '800' },

  // Divider
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },

  // Product row
  productRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  productImgWrap: { position: 'relative' },
  productRowImg: { width: 96, height: 96, borderRadius: RADIUS.lg },
  discountBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  discountTxt: { color: COLORS.surface, fontSize: 10, fontWeight: '800' },

  productRowInfo: { flex: 1, gap: SPACING.xs },
  productName: { color: COLORS.text, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  productUnit: { color: COLORS.textMuted, fontSize: 11, fontWeight: '500' },
  reviewTxt: { color: COLORS.textMuted, fontSize: 11, marginLeft: SPACING.xs / 2 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.sm, marginTop: 2 },
  price: { color: COLORS.textSub, fontSize: 16, fontWeight: '800' },
  origPrice: {
    color: COLORS.textMuted,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },

  addArea: { marginTop: SPACING.xs },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    ...SHADOW.float,
  },
  addBtnTxt: { color: COLORS.text, fontSize: 13, fontWeight: '700' },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, alignSelf: 'flex-start' },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryDark },
  stepCount: { color: COLORS.text, fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' },

  // Cart bar
  cartBarWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  cartBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    ...SHADOW.float,
  },
  cartBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(26,15,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  cartBadgeTxt: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  cartBarLabel: { flex: 1, color: COLORS.text, fontSize: 15, fontWeight: '700' },
  cartBarPrice: { color: COLORS.text, fontSize: 15, fontWeight: '800' },
});
