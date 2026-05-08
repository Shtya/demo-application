import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, Dimensions, StyleSheet } from 'react-native';
import { FONTS } from '../constants/fonts';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, interpolate, Extrapolation,
  useAnimatedScrollHandler, runOnJS, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCart } from '../context/CartContext';
import { useFavIcon } from '../context/FavIconContext';
import { fetchGroceries, fetchStores } from '../services/api';

const { width: W } = Dimensions.get('window');

const COLORS = {
  primary:       '#FFC107',
  primaryDark:   '#FF8F00',
  primaryLight:  '#FFF8E1',
  secondary:     '#B8975A',
  secondaryDark: '#7A5C2E',
  secondaryLight:'#F3EDE0',
  bg:            '#FAF7F2',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F3EDE0',
  text:          '#1A0F00',
  textSub:       '#7A5C2E',
  textMuted:     '#B8975A',
  border:        '#E8DCC8',
  borderStrong:  '#B8975A',
  dark:          '#3D2B00',
  darkMid:       '#5C3D00',
  success:       '#2E7D32',
  successLight:  '#E8F5E9',
  error:         '#C62828',
  errorLight:    '#FDECEA',
  info:          '#1565C0',
  infoLight:     '#E3F2FD',
  warning:       '#E65100',
  warningLight:  '#FBE9E7',
};

const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const RADIUS  = { sm: 8, md: 12, lg: 20, xl: 28, full: 999 };
const SHADOW  = {
  card: {
    shadowColor: '#3D2B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  float: {
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
};
const ANIM = {
  spring:     { damping: 16, stiffness: 160 },
  springFast: { damping: 12, stiffness: 200 },
  springSlow: { damping: 20, stiffness: 120 },
  duration:   { fast: 150, normal: 280, slow: 450 },
};

const CATEGORIES = [
  { id: 'c1', name: 'All',     icon: '🛒' },
  { id: 'c2', name: 'Fruits',  icon: '🍎' },
  { id: 'c3', name: 'Veggies', icon: '🥦' },
  { id: 'c4', name: 'Dairy',   icon: '🥛' },
  { id: 'c5', name: 'Bakery',  icon: '🍞' },
  { id: 'c6', name: 'Meat',    icon: '🥩' },
  { id: 'c7', name: 'Drinks',  icon: '🧃' },
  { id: 'c8', name: 'Organic', icon: '🌿' },
];

const BANNERS = [
  { id: 'b1', image: 'https://picsum.photos/seed/fruits/800/400',     title: 'Fresh Fruits\nDelivered Today',     cta: 'Shop Now',      gradient: ['transparent', 'rgba(61,43,0,0.40)', 'rgba(61,43,0,0.88)'], badge: 'DAILY FRESH',   highlight: '40% OFF' },
  { id: 'b2', image: 'https://picsum.photos/seed/vegetables/800/400', title: 'Organic Veggies\nDirect from Farm', cta: 'Order Fresh',   gradient: ['transparent', 'rgba(61,43,0,0.40)', 'rgba(61,43,0,0.88)'], badge: 'FARM TO TABLE', highlight: 'NEW' },
  { id: 'b3', image: 'https://picsum.photos/seed/market/800/400',     title: 'Free Delivery\nOver 50 QAR',        cta: 'Start Shopping',gradient: ['transparent', 'rgba(61,43,0,0.40)', 'rgba(61,43,0,0.88)'], badge: 'FREE DELIVERY', highlight: '🚀 Fast' },
];

const PLACEHOLDERS = ['Search fruits…', 'Search vegetables…', 'Search groceries…'];
const formatPrice  = p => `${p.toLocaleString()} QAR`;

// ─── usePress ────────────────────────────────────────────────────────────────────
const usePress = () => {
  const scale     = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// ─── SHIMMER ─────────────────────────────────────────────────────────────────────
const ShimmerCard = ({ width = 160, height = 200 }) => {
  const opacity = useSharedValue(0.4);
  useEffect(() => { opacity.value = withRepeat(withTiming(1.0, { duration: 750 }), -1, true); }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width, height, borderRadius: RADIUS.lg, backgroundColor: COLORS.border, marginRight: SPACING.sm }, style]} />;
};

// ─── CATEGORY PILL ───────────────────────────────────────────────────────────────
const CategoryPill = ({ cat, onPress, index, isActive }) => {
  const p          = usePress();
  const opacity    = useSharedValue(0);
  const translateX = useSharedValue(-12);

  useEffect(() => {
    opacity.value    = withTiming(1,  { duration: ANIM.duration.normal, delay: index * 50 });
    translateX.value = withSpring(0,  { ...ANIM.spring, delay: index * 50 });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[p.animStyle, entranceStyle]}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
        onPressIn={p.onPressIn} onPressOut={p.onPressOut} activeOpacity={1}
      >
        {isActive ? (
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.catPillActive}>
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={styles.catNameActive}>{cat.name}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.catPill}>
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={styles.catName}>{cat.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── FLASH CARD ──────────────────────────────────────────────────────────────────
const FlashCard = ({ item, onAdd, onFavorite, onPress, index }) => {
  const p          = usePress();
  const [liked, setLiked] = useState(false);
  const btnScale   = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const addBtnRef  = useRef(null);
  const heartRef   = useRef(null);
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value    = withTiming(1, { duration: ANIM.duration.normal, delay: index * 60 });
    translateY.value = withSpring(0, { ...ANIM.spring, delay: index * 60 });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    btnScale.value = withSequence(withSpring(0.82, ANIM.springFast), withSpring(1, ANIM.spring));
    addBtnRef.current?.measure((_, __, w, h, px, py) => { onAdd(item, { x: px + w / 2, y: py + h / 2 }); });
  };

  const handleLike = () => {
    const newLiked = !liked;
    heartScale.value = withSequence(withSpring(1.5, { damping: 8 }), withSpring(1, { damping: 12 }));
    setLiked(newLiked);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heartRef.current?.measure((_, __, w, h, px, py) => { onFavorite?.(item, { x: px + w / 2, y: py + h / 2 }, newLiked); });
  };

  const btnStyle   = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  return (
    <Animated.View style={[p.animStyle, entranceStyle]}>
      <TouchableOpacity onPressIn={p.onPressIn} onPressOut={p.onPressOut} onPress={onPress} style={styles.flashCard} activeOpacity={1}>
        <View style={styles.cardImgWrap}>
          <Image source={{ uri: item.image }} style={styles.flashImg} />
          <LinearGradient colors={['transparent', 'rgba(61,43,0,0.40)', 'rgba(61,43,0,0.85)']} style={StyleSheet.absoluteFill} />
          <View style={styles.discBadge}><Text style={styles.discTxt}>-{item.discount}%</Text></View>
          <TouchableOpacity ref={heartRef} onPress={handleLike} style={styles.heartBtn}>
            <Animated.View style={heartStyle}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? COLORS.error : COLORS.textMuted} />
            </Animated.View>
          </TouchableOpacity>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardSub}  numberOfLines={1}>{item.store}</Text>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.origPrice}>{formatPrice(item.originalPrice)}</Text>
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
            </View>
            <Animated.View ref={addBtnRef} style={btnStyle}>
              <TouchableOpacity onPress={handleAdd} activeOpacity={0.85}>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.addBtn}>
                  <Ionicons name="add" size={18} color={COLORS.text} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── STORE CARD ──────────────────────────────────────────────────────────────────
const StoreCard = ({ store, onPress, index }) => {
  const p          = usePress();
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value    = withTiming(1, { duration: ANIM.duration.normal, delay: index * 60 });
    translateY.value = withSpring(0, { ...ANIM.spring, delay: index * 60 });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View style={[styles.storeCard, p.animStyle, entranceStyle]}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
        onPressIn={p.onPressIn} onPressOut={p.onPressOut} activeOpacity={1}
      >
        <View style={styles.storeCoverWrap}>
          <Image source={{ uri: store.cover }} style={styles.storeCover} />
          <LinearGradient colors={['transparent', 'rgba(61,43,0,0.40)', 'rgba(61,43,0,0.85)']} style={StyleSheet.absoluteFill} />
          <View style={styles.ratingChip}>
            <Ionicons name="star" size={11} color={COLORS.primary} />
            <Text style={styles.ratingChipTxt}>{store.rating}</Text>
          </View>
          <View style={[styles.openBadge, { backgroundColor: store.isOpen ? COLORS.successLight : COLORS.errorLight }]}>
            <View style={[styles.openDot, { backgroundColor: store.isOpen ? COLORS.success : COLORS.error }]} />
            <Text style={[styles.openBadgeTxt, { color: store.isOpen ? COLORS.success : COLORS.error }]}>
              {store.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
          <View style={styles.storeLogoWrap}>
            <Image source={{ uri: store.logo }} style={styles.storeLogo} />
          </View>
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <View style={styles.storeMetaRow}>
            <Ionicons name="time-outline"     size={11} color={COLORS.textMuted} />
            <Text style={styles.storeMeta}>{store.time}</Text>
            <View style={styles.metaDot} />
            <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.storeMeta}>{store.dist}</Text>
            <View style={styles.metaDot} />
            <Ionicons name="bicycle-outline"  size={11} color={store.fee === 'Free' ? COLORS.success : COLORS.textMuted} />
            <Text style={[styles.storeMeta, store.fee === 'Free' && { color: COLORS.success, fontFamily: FONTS.semibold }]}>
              {store.fee === 'Free' ? 'Free' : store.fee}
            </Text>
          </View>
          <View style={styles.storeTagRow}>
            {store.tags.map(t => (
              <View key={t} style={styles.storeTag}><Text style={styles.storeTagTxt}>{t}</Text></View>
            ))}
            {store.cashback > 0 && (
              <View style={styles.cashbackTag}><Text style={styles.cashbackTxt}>{store.cashback}% back</Text></View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────────
const ProductCard = ({ item, onAdd, onFavorite, onPress, index }) => {
  const [liked, setLiked] = useState(false);
  const heartScale  = useSharedValue(1);
  const p           = usePress();
  const addBtnRef   = useRef(null);
  const heartBtnRef = useRef(null);
  const opacity     = useSharedValue(0);
  const translateY  = useSharedValue(18);

  useEffect(() => {
    opacity.value    = withTiming(1, { duration: ANIM.duration.normal, delay: index * 60 });
    translateY.value = withSpring(0, { ...ANIM.spring, delay: index * 60 });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  const doToggleLike = () => {
    const newLiked = !liked;
    heartScale.value = withSequence(withSpring(1.45, { damping: 8, stiffness: 200 }), withSpring(1, { damping: 12, stiffness: 200 }));
    setLiked(newLiked);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heartBtnRef.current?.measure((_, __, w, h, px, py) => { onFavorite?.(item, { x: px + w / 2, y: py + h / 2 }, newLiked); });
  };

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addBtnRef.current?.measure((_, __, w, h, px, py) => { onAdd(item, { x: px + w / 2, y: py + h / 2 }); });
  };

  return (
    <Animated.View style={[styles.productCard, p.animStyle, entranceStyle]}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
        onPressIn={p.onPressIn} onPressOut={p.onPressOut} activeOpacity={1}
      >
        <View style={styles.cardImgWrap}>
          <Image source={{ uri: item.image }} style={styles.productImg} />
          <LinearGradient colors={['transparent', 'rgba(61,43,0,0.28)']} style={styles.productImgGrad} />
          {item.discount > 0 && (
            <View style={styles.discBadge}><Text style={styles.discTxt}>{item.discount}%</Text></View>
          )}
          <TouchableOpacity ref={heartBtnRef} onPress={doToggleLike} style={styles.heartBtn}>
            <Animated.View style={heartStyle}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={15} color={liked ? COLORS.error : COLORS.textMuted} />
            </Animated.View>
          </TouchableOpacity>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color={COLORS.secondary} />
            <Text style={styles.ratingNum}>{item.rating}</Text>
            <Text style={styles.ratingReviews}>({item.reviews})</Text>
          </View>
          <View style={styles.priceRow}>
            <View>
              {item.originalPrice > item.price && (
                <Text style={styles.origPrice}>{formatPrice(item.originalPrice)}</Text>
              )}
              <Text style={styles.price}>{formatPrice(item.price)}</Text>
            </View>
            <TouchableOpacity ref={addBtnRef} onPress={handleAdd} activeOpacity={0.85}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.addBtn}>
                <Ionicons name="add" size={17} color={COLORS.text} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── FLY PARTICLES ───────────────────────────────────────────────────────────────
const FlyParticle = ({ startX, startY, targetX, targetY, image, onComplete }) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 750, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }, fin => {
      if (fin) runOnJS(onComplete)();
    });
  }, []);
  const animStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const cpX = startX + (targetX - startX) * 0.05;
    const cpY = Math.min(startY, targetY) - 160;
    const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cpX + t * t * targetX;
    const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cpY + t * t * targetY;
    const scale   = interpolate(t, [0, 0.4, 1], [1, 0.85, 0.25]);
    const opacity = t > 0.78 ? interpolate(t, [0.78, 1], [1, 0]) : 1;
    return { left: x - 22, top: y - 22, opacity, transform: [{ scale }] };
  });
  return (
    <Animated.View style={[flyStyles.bubble, animStyle]}>
      <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
};
const flyStyles = StyleSheet.create({
  bubble: {
    position: 'absolute', width: 44, height: 44, borderRadius: RADIUS.full,
    overflow: 'hidden', borderWidth: 2, borderColor: COLORS.secondary, zIndex: 9999,
    shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 8, elevation: 14,
  },
});

const FlyFavParticle = ({ startX, startY, targetX, targetY, onComplete }) => {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 680, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }, fin => {
      if (fin) runOnJS(onComplete)();
    });
  }, []);
  const animStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const cpX = startX + (targetX - startX) * 0.1;
    const cpY = startY - 90;
    const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cpX + t * t * targetX;
    const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cpY + t * t * targetY;
    const scale   = interpolate(t, [0, 0.25, 1], [1, 1.3, 0.2], Extrapolation.CLAMP);
    const opacity = t > 0.82 ? interpolate(t, [0.82, 1], [1, 0], Extrapolation.CLAMP) : 1;
    return { left: x - 18, top: y - 18, opacity, transform: [{ scale }] };
  });
  return (
    <Animated.View style={[favFlyStyles.heart, animStyle]}>
      <Ionicons name="heart" size={22} color={COLORS.error} />
    </Animated.View>
  );
};
const favFlyStyles = StyleSheet.create({
  heart: {
    position: 'absolute', width: 36, height: 36, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(198,40,40,0.10)', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, shadowColor: COLORS.error, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14, shadowRadius: 6, elevation: 13,
  },
});

// ─── FLOATING CART ───────────────────────────────────────────────────────────────
const FloatingCart = ({ total, count, onPress }) => {
  const translateY = useSharedValue(80);
  const scale      = useSharedValue(0.9);
  const pulse      = useSharedValue(1);

  useEffect(() => {
    if (count > 0) {
      translateY.value = withSpring(0, ANIM.springSlow);
      scale.value      = withSpring(1, ANIM.spring);
      pulse.value      = withSequence(withSpring(1.05, ANIM.springFast), withSpring(1, ANIM.spring));
    } else {
      translateY.value = withTiming(80, { duration: ANIM.duration.normal });
    }
  }, [count]);

  const wrapStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }, { scale: scale.value }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (count === 0) return null;
  return (
    <Animated.View style={[styles.floatCartWrap, wrapStyle]}>
      <Animated.View style={pulseStyle}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.floatCartBtn, SHADOW.float]}>
            <View style={styles.floatCartLeft}>
              <Ionicons name="cart" size={20} color={COLORS.text} />
              <View style={styles.floatCartBadge}><Text style={styles.floatCartBadgeTxt}>{count}</Text></View>
            </View>
            <Text style={styles.floatCartTxt}>View Cart</Text>
            <Text style={styles.floatCartPrice}>{formatPrice(total)}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.dark} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { addItem, totalItems } = useCart();
  const { favIconPos, cartTabPos, toggleFavorite } = useFavIcon();

  const [loading,    setLoading]    = useState(false);
  const [flashDeals, setFlashDeals] = useState([
    { discount: 13, id: '16', image: 'https://cdn.dummyjson.com/product-images/groceries/apple/thumbnail.webp',        name: 'Apple',        originalPrice: 8,  price: 7,  rating: 4.19, reviews: 32,  store: 'Green Market', storeId: 's1', unit: 'Pcs' },
    { discount: 10, id: '17', image: 'https://cdn.dummyjson.com/product-images/groceries/beef-steak/thumbnail.webp',   name: 'Beef Steak',   originalPrice: 52, price: 47, rating: 4.47, reviews: 344, store: 'Farm Bazaar',  storeId: 's2', unit: 'Pcs' },
    { discount: 10, id: '18', image: 'https://cdn.dummyjson.com/product-images/groceries/cat-food/thumbnail.webp',     name: 'Cat Food',     originalPrice: 37, price: 33, rating: 3.13, reviews: 184, store: 'Fresh Corner', storeId: 's3', unit: 'Pcs' },
    { discount: 14, id: '19', image: 'https://cdn.dummyjson.com/product-images/groceries/chicken-meat/thumbnail.webp', name: 'Chicken Meat', originalPrice: 42, price: 36, rating: 3.19, reviews: 388, store: 'Veggie World', storeId: 's4', unit: 'Pcs' },
    { discount: 9,  id: '20', image: 'https://cdn.dummyjson.com/product-images/groceries/cooking-oil/thumbnail.webp',  name: 'Cooking Oil',  originalPrice: 20, price: 18, rating: 4.8,  reviews: 40,  store: 'Harvest Home', storeId: 's5', unit: 'Pcs' },
  ]);
  const [products, setProducts] = useState([
    { discount: 5,  id: '21', image: 'https://cdn.dummyjson.com/product-images/groceries/cucumber/thumbnail.webp',          name: 'Cucumber',           originalPrice: 5,  price: 5,  rating: 4.07, reviews: 336, store: 'Green Market', storeId: 's1', unit: 'Pcs' },
    { discount: 10, id: '22', image: 'https://cdn.dummyjson.com/product-images/groceries/dog-food/thumbnail.webp',           name: 'Dog Food',           originalPrice: 44, price: 40, rating: 4.55, reviews: 284, store: 'Farm Bazaar',  storeId: 's2', unit: 'Pcs' },
    { discount: 11, id: '23', image: 'https://cdn.dummyjson.com/product-images/groceries/eggs/thumbnail.webp',               name: 'Eggs',               originalPrice: 12, price: 11, rating: 2.53, reviews: 36,  store: 'Fresh Corner', storeId: 's3', unit: 'Pcs' },
    { discount: 5,  id: '24', image: 'https://cdn.dummyjson.com/product-images/groceries/fish-steak/thumbnail.webp',         name: 'Fish Steak',         originalPrice: 58, price: 55, rating: 3.78, reviews: 296, store: 'Veggie World', storeId: 's4', unit: 'Pcs' },
    { discount: 5,  id: '25', image: 'https://cdn.dummyjson.com/product-images/groceries/green-bell-pepper/thumbnail.webp',  name: 'Green Bell Pepper',  originalPrice: 5,  price: 5,  rating: 3.25, reviews: 132, store: 'Harvest Home', storeId: 's5', unit: 'Pcs' },
    { discount: 5,  id: '26', image: 'https://cdn.dummyjson.com/product-images/groceries/green-chili-pepper/thumbnail.webp', name: 'Green Chili Pepper', originalPrice: 4,  price: 4,  rating: 3.66, reviews: 12,  store: 'Green Market', storeId: 's1', unit: 'Pcs' },
  ]);
  const [stores, setStores] = useState([
    { cashback: 5, cover: 'https://cdn.dummyjson.com/product-images/groceries/apple/thumbnail.webp',              dist: '1.2 km', fee: 'Free',  id: 's1', isOpen: true,  logo: 'https://ui-avatars.com/api/?name=Green+Market&background=B8975A&color=FAF7F2&size=128', minOrder: 'QAR 30', name: 'Green Market',  rating: 4.8, tags: ['Organic', 'Fresh'],      time: '20-30 min' },
    { cashback: 0, cover: 'https://cdn.dummyjson.com/product-images/groceries/cucumber/thumbnail.webp',           dist: '2.5 km', fee: '5 QAR', id: 's2', isOpen: true,  logo: 'https://ui-avatars.com/api/?name=Farm+Bazaar&background=7A5C2E&color=FAF7F2&size=128',  minOrder: 'QAR 50', name: 'Farm Bazaar',   rating: 4.6, tags: ['Fruits', 'Vegetables'], time: '25-35 min' },
    { cashback: 3, cover: 'https://cdn.dummyjson.com/product-images/groceries/green-chili-pepper/thumbnail.webp', dist: '0.8 km', fee: 'Free',  id: 's3', isOpen: true,  logo: 'https://ui-avatars.com/api/?name=Fresh+Corner&background=5C3D00&color=FAF7F2&size=128', minOrder: 'QAR 25', name: 'Fresh Corner',  rating: 4.9, tags: ['Daily', 'Dairy'],       time: '15-25 min' },
    { cashback: 2, cover: 'https://cdn.dummyjson.com/product-images/groceries/lemon/thumbnail.webp',              dist: '3.1 km', fee: '8 QAR', id: 's4', isOpen: false, logo: 'https://ui-avatars.com/api/?name=Veggie+World&background=3D2B00&color=FAF7F2&size=128',  minOrder: 'QAR 40', name: 'Veggie World',  rating: 4.5, tags: ['Veggies', 'Herbs'],     time: '30-40 min' },
    { cashback: 7, cover: 'https://cdn.dummyjson.com/product-images/groceries/protein-powder/thumbnail.webp',     dist: '1.9 km', fee: 'Free',  id: 's5', isOpen: true,  logo: 'https://ui-avatars.com/api/?name=Harvest+Home&background=B8975A&color=FAF7F2&size=128', minOrder: 'QAR 35', name: 'Harvest Home',  rating: 4.7, tags: ['Organic', 'Fruits'],    time: '35-45 min' },
  ]);

  const [bannerIdx,      setBannerIdx]      = useState(0);
  const [phIdx,          setPhIdx]          = useState(0);
  const [activeCategory, setActiveCategory] = useState('c1');
  const [particles,      setParticles]      = useState([]);
  const [favParticles,   setFavParticles]   = useState([]);

  const scrollY   = useSharedValue(0);
  const bannerRef = useRef(null);

  const triggerFly        = useCallback((image, from) => { const id = Date.now() + Math.random();     setParticles(prev => [...prev, { id, image, startX: from.x, startY: from.y }]); }, []);
  const onParticleComplete= useCallback(id => { setParticles(prev => prev.filter(p => p.id !== id)); }, []);
  const triggerFavFly     = useCallback((item, from) => { const id = Date.now() + Math.random() + 2; setFavParticles(prev => [...prev, { id, startX: from.x, startY: from.y }]); }, []);
  const onFavParticleComplete = useCallback(id => { setFavParticles(prev => prev.filter(p => p.id !== id)); }, []);

  useEffect(() => {
    let active = true;
    const bannerTimer = setInterval(() => {
      setBannerIdx(i => { const next = (i + 1) % BANNERS.length; bannerRef.current?.scrollToIndex({ index: next, animated: true }); return next; });
    }, 4000);
    const phTimer = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 2500);
    return () => { active = false; clearInterval(bannerTimer); clearInterval(phTimer); };
  }, []);

  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const headerStyle = useAnimatedStyle(() => {
    const bg = interpolate(scrollY.value, [0, 70], [0, 0.97], Extrapolation.CLAMP);
    return {
      backgroundColor: `rgba(250,247,242,${bg})`,
      borderBottomWidth: interpolate(scrollY.value, [0, 70], [0, 1], Extrapolation.CLAMP),
      borderBottomColor: COLORS.border,
      shadowOpacity: interpolate(scrollY.value, [0, 70], [0, 0.05], Extrapolation.CLAMP),
    };
  });

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <Animated.View style={[styles.header, headerStyle]}>
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.75}>
            <View style={styles.locationPin}>
              <Ionicons name="location-sharp" size={15} color={COLORS.primaryDark} />
            </View>
            <View>
              <View style={styles.locTitleRow}>
                <Text style={styles.locTitle}>Home</Text>
                <Ionicons name="chevron-down" size={12} color={COLORS.textSub} />
              </View>
              <Text style={styles.locSub} numberOfLines={1}>Road 12, City Stars, Cairo</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.bellWrap}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
            <Image source={{ uri: 'https://randomuser.me/api/portraits/men/81.jpg' }} style={styles.avatar} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Search ── */}
        <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.searchBar} activeOpacity={0.85}>
          <View style={styles.searchIcon}>
            <Ionicons name="search-outline" size={17} color={COLORS.secondaryDark} />
          </View>
          <Text style={styles.searchPlaceholder}>{PLACEHOLDERS[phIdx]}</Text>
          <View style={styles.searchDivider} />
          <View style={styles.micBtn}>
            <Ionicons name="mic-outline" size={16} color={COLORS.secondaryDark} />
          </View>
        </TouchableOpacity>

        {/* ── Banners ── */}
        <View style={styles.bannerWrap}>
          <FlatList
            ref={bannerRef}
            data={BANNERS}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i.id}
            onMomentumScrollEnd={e => setBannerIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
            renderItem={({ item }) => (
              <View style={styles.bannerItem}>
                <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFill} />
                <View style={styles.bannerBadge}>
                  <View style={styles.bannerBadgeDot} />
                  <Text style={styles.bannerBadgeTxt}>{item.badge}</Text>
                </View>
                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.bannerHighlight}>
                  <Text style={styles.bannerHighlightTxt}>{item.highlight}</Text>
                </LinearGradient>
                <View style={styles.bannerContent}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                  <TouchableOpacity style={styles.bannerCta} activeOpacity={0.85}>
                    <Text style={styles.bannerCtaTxt}>{item.cta}</Text>
                    <View style={styles.bannerCtaArrow}>
                      <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <View style={styles.dotsRow}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[styles.dot, bannerIdx === i && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* ── Categories ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>
        <FlatList
          data={CATEGORIES} horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id} contentContainerStyle={styles.hList}
          renderItem={({ item, index }) => (
            <CategoryPill cat={item} index={index} isActive={activeCategory === item.id}
              onPress={() => { setActiveCategory(item.id); navigation.navigate('Category', { category: item }); }}
            />
          )}
        />

        {/* ── Flash Sale — same header as all other sections ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.flashTitleWrap}>
            <Text style={styles.sectionTitle}>Flash Sale</Text>
             
          </View>
          <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.7}
            onPress={() => navigation.navigate('AllProducts', { title: 'Flash Sale', items: flashDeals, type: 'products' })}>
            <Text style={styles.seeAll}>See All</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={flashDeals} horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id} contentContainerStyle={styles.hList}
          renderItem={({ item, index }) => (
            <FlashCard item={item} index={index}
              onPress={() => navigation.navigate('ItemDetail', { item })}
              onAdd={(prod, pos) => { addItem({ ...prod, storeId: 's1' }); if (pos) triggerFly(prod.image, pos); }}
              onFavorite={(prod, pos, liked) => { if (pos) triggerFavFly(prod, pos); if (typeof liked === 'boolean') toggleFavorite(prod, liked); }}
            />
          )}
        />

        {/* ── Nearby Markets ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Markets</Text>
          <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.7}
            onPress={() => navigation.navigate('AllProducts', { title: 'Nearby Markets', items: stores, type: 'stores' })}>
            <Text style={styles.seeAll}>See All</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={stores} horizontal showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id} contentContainerStyle={styles.hList}
          renderItem={({ item, index }) => (
            <StoreCard store={item} index={index} onPress={() => navigation.navigate('Store', { store: item })} />
          )}
        />

        {/* ── Most Popular ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Most Popular</Text>
          <TouchableOpacity style={styles.seeAllBtn} activeOpacity={0.7}
            onPress={() => navigation.navigate('AllProducts', { title: 'Most Popular', items: products, type: 'products' })}>
            <Text style={styles.seeAll}>See All</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.gridWrap}>
            {[1, 2, 3, 4].map(i => <ShimmerCard key={i} width={(W - SPACING.md * 2 - SPACING.sm) / 2} height={230} />)}
          </View>
        ) : (
          <View style={styles.gridWrap}>
            {products.map((prod, index) => (
              <ProductCard key={prod.id} item={prod} index={index}
                onAdd={(p, pos) => { addItem(p); if (pos) triggerFly(p.image, pos); }}
                onFavorite={(p, pos, liked) => { if (pos) triggerFavFly(p, pos); if (typeof liked === 'boolean') toggleFavorite(p, liked); }}
                onPress={() => navigation.navigate('ItemDetail', { item: prod })}
              />
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {/* ── Particles ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {particles.map(p => (
          <FlyParticle key={p.id} startX={p.startX} startY={p.startY} targetX={cartTabPos.current.x} targetY={cartTabPos.current.y} image={p.image} onComplete={() => onParticleComplete(p.id)} />
        ))}
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {favParticles.map(p => (
          <FlyFavParticle key={p.id} startX={p.startX} startY={p.startY} targetX={favIconPos.current.x} targetY={favIconPos.current.y} onComplete={() => onFavParticleComplete(p.id)} />
        ))}
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: SPACING.xxl + SPACING.xl },

  // Header
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 2 }, shadowRadius: 12 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, paddingTop: SPACING.xs },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  locationPin:  { width: 34, height: 34, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  locTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locTitle:     { color: COLORS.text,    fontSize: 15, fontFamily: FONTS.bold },
  locSub:       { color: COLORS.textMuted, fontSize: 11, fontFamily: FONTS.regular, maxWidth: 170 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  bellWrap:     { position: 'relative', padding: SPACING.xs },
  bellDot:      { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.error, borderWidth: 1.5, borderColor: COLORS.bg },
  avatar:       { width: 34, height: 34, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border },

  // Search
  searchBar:         { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.md, marginTop: 100, marginBottom: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm, height: 52, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  searchIcon:        { width: 34, height: 34, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  searchPlaceholder: { flex: 1, color: COLORS.textMuted, fontSize: 14, fontFamily: FONTS.regular },
  searchDivider:     { width: 1, height: 22, backgroundColor: COLORS.border, marginRight: SPACING.sm },
  micBtn:            { width: 34, height: 34, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },

  // Banners
  bannerWrap:         { overflow: 'hidden', marginBottom: SPACING.lg },
  bannerItem:         { width: W, height: 210, backgroundColor: COLORS.surfaceAlt },
  bannerBadge:        { position: 'absolute', top: SPACING.md, left: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(250,247,242,0.10)', borderWidth: 1, borderColor: 'rgba(250,247,242,0.16)', paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: 5, borderRadius: RADIUS.full },
  bannerBadgeDot:     { width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.secondary },
  bannerBadgeTxt:     { color: 'rgba(250,247,242,0.75)', fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 1 },
  bannerHighlight:    { position: 'absolute', top: SPACING.md, right: SPACING.md, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  bannerHighlightTxt: { color: COLORS.text, fontSize: 11, fontFamily: FONTS.extrabold, letterSpacing: 0.4 },
  bannerContent:      { position: 'absolute', bottom: SPACING.md, left: SPACING.md, right: SPACING.md },
  bannerTitle:        { color: COLORS.bg, fontSize: 22, fontFamily: FONTS.extrabold, lineHeight: 28, marginBottom: SPACING.sm, letterSpacing: -0.3 },
  bannerCta:          { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2, backgroundColor: 'rgba(250,247,242,0.12)', borderWidth: 1, borderColor: 'rgba(250,247,242,0.22)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  bannerCtaTxt:       { color: COLORS.bg, fontSize: 13, fontFamily: FONTS.bold },
  bannerCtaArrow:     { width: 22, height: 22, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  dotsRow:            { position: 'absolute', bottom: SPACING.md, right: SPACING.md, flexDirection: 'row', gap: 5 },
  dot:                { width: 6,  height: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(250,247,242,0.35)' },
  dotActive:          { width: 18, backgroundColor: COLORS.secondary },

  // Section header — one shared pattern for ALL sections
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm, marginTop: SPACING.lg },
  sectionTitle:    { color: COLORS.text, fontSize: 18, fontFamily: FONTS.extrabold, letterSpacing: -0.3 },
  seeAllBtn:       { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll:          { color: COLORS.secondary, fontSize: 13, fontFamily: FONTS.semibold },

  // Flash title inline badge
  flashTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  liveBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warningLight, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  liveDot:        { width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: COLORS.warning },
  liveTxt:        { color: COLORS.warning, fontSize: 10, fontFamily: FONTS.extrabold, letterSpacing: 0.8 },

  // Horizontal list
  hList: { paddingHorizontal: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xs },

  // Categories
  catPill:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + SPACING.xs, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  catPillActive: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + SPACING.xs, borderRadius: RADIUS.full, ...SHADOW.float },
  catIcon:       { fontSize: 15 },
  catName:       { fontSize: 13, fontFamily: FONTS.semibold, color: COLORS.textSub },
  catNameActive: { fontSize: 13, fontFamily: FONTS.bold,     color: COLORS.text },

  // Shared card image wrap
  cardImgWrap: { position: 'relative', overflow: 'hidden' },

  // Flash cards
  flashCard:  { width: 152, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  flashImg:   { width: 152, height: 114 },
  cardInfo:   { padding: SPACING.sm, gap: SPACING.xs },
  cardName:   { color: COLORS.text,    fontSize: 13, fontFamily: FONTS.bold },
  cardSub:    { color: COLORS.textMuted, fontSize: 11, fontFamily: FONTS.regular },
  priceRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: SPACING.xs },
  origPrice:  { color: COLORS.textMuted, fontSize: 10, fontFamily: FONTS.regular, textDecorationLine: 'line-through' },
  price:      { color: COLORS.textSub,   fontSize: 14, fontFamily: FONTS.extrabold },

  // Store cards
  storeCard:      { width: 240, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  storeCoverWrap: { position: 'relative', width: 240, height: 120 },
  storeCover:     { width: 240, height: 120 },
  ratingChip:     { position: 'absolute', top: SPACING.sm, left: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(26,15,0,0.55)', paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  ratingChipTxt:  { color: COLORS.bg, fontSize: 12, fontFamily: FONTS.extrabold },
  openBadge:      { position: 'absolute', top: SPACING.sm, right: SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  openDot:        { width: 6, height: 6, borderRadius: RADIUS.full },
  openBadgeTxt:   { fontSize: 11, fontFamily: FONTS.bold },
  storeLogoWrap:  { position: 'absolute', bottom: -16, left: SPACING.md, width: 36, height: 36, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.surface, overflow: 'hidden', backgroundColor: COLORS.surface },
  storeLogo:      { width: 36, height: 36 },
  storeInfo:      { padding: SPACING.sm, paddingTop: SPACING.md + SPACING.xs },
  storeName:      { color: COLORS.text, fontSize: 14, fontFamily: FONTS.extrabold, marginBottom: SPACING.xs, letterSpacing: -0.2 },
  storeMetaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.xs, flexWrap: 'wrap' },
  metaDot:        { width: 3, height: 3, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
  storeMeta:      { color: COLORS.textMuted, fontSize: 11, fontFamily: FONTS.regular },
  storeTagRow:    { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  storeTag:       { backgroundColor: COLORS.surfaceAlt, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  storeTagTxt:    { color: COLORS.textSub, fontSize: 10, fontFamily: FONTS.semibold },
  cashbackTag:    { backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  cashbackTxt:    { color: COLORS.secondaryDark, fontSize: 10, fontFamily: FONTS.semibold },

  // Product grid
  gridWrap:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.sm },
  productCard:    { width: (W - SPACING.md * 2 - SPACING.sm) / 2, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  productImg:     { width: '100%', height: 140 },
  productImgGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 56 },
  ratingRow:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingNum:      { color: COLORS.text, fontSize: 11, fontFamily: FONTS.bold },
  ratingReviews:  { color: COLORS.textMuted, fontSize: 11, fontFamily: FONTS.regular },
  productPriceRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.xs },

  // Shared: add button, discount badge, heart
  addBtn:    { width: 32, height: 32, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', ...SHADOW.float },
  discBadge: { position: 'absolute', top: SPACING.sm, left: SPACING.sm, backgroundColor: COLORS.warning, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  discTxt:   { color: COLORS.surface, fontSize: 10, fontFamily: FONTS.extrabold },
  heartBtn:  { position: 'absolute', top: SPACING.sm, right: SPACING.sm, width: 28, height: 28, borderRadius: RADIUS.full, backgroundColor: 'rgba(250,247,242,0.94)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },

  // Floating cart
  floatCartWrap:     { position: 'absolute', bottom: 90, left: SPACING.md, right: SPACING.md },
  floatCartBtn:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, height: 56, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md },
  floatCartLeft:     { position: 'relative' },
  floatCartBadge:    { position: 'absolute', top: -6, right: -6, backgroundColor: COLORS.dark, width: 17, height: 17, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.primary },
  floatCartBadgeTxt: { color: COLORS.bg, fontSize: 10, fontFamily: FONTS.extrabold },
  floatCartTxt:      { color: COLORS.text, fontSize: 15, fontFamily: FONTS.bold, flex: 1 },
  floatCartPrice:    { color: COLORS.dark, fontSize: 14, fontFamily: FONTS.extrabold },
});