import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, FlatList,
  Dimensions, StyleSheet, ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, withRepeat, withDelay, runOnJS, interpolate,
} from 'react-native-reanimated';
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
  float: { shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 8 },
  subtle: { shadowColor: '#3D2B00', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
};
const ANIM = {
  spring:     { damping: 16, stiffness: 160 },
  springFast: { damping: 12, stiffness: 200 },
  springSlow: { damping: 20, stiffness: 120 },
  duration:   { fast: 150, normal: 280, slow: 450 },
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────────
const { width: W, height: H } = Dimensions.get('window');
const GALLERY_H = W * 0.88;

// Process reviews count and average rating from API
const processReviews = (reviews) => {
  if (!reviews || reviews.length === 0) return { avgRating: 0, reviewCount: 0 };
  const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
  return {
    avgRating: sum / reviews.length,
    reviewCount: reviews.length
  };
};

// Transform API data to match expected format
const transformProductData = (apiData) => {
  const { avgRating, reviewCount } = processReviews(apiData.reviews);
  
  return {
    id: apiData.id.toString(),
    storeId: 's2',
    name: apiData.title,
    store: apiData.brand || 'Glamour Beauty',
    price: apiData.price,
    originalPrice: apiData.price / (1 - (apiData.discountPercentage / 100)),
    discount: Math.round(apiData.discountPercentage),
    images: apiData.images && apiData.images.length > 0 
      ? [apiData.images[0], ...apiData.images.slice(1), apiData.thumbnail].filter(Boolean)
      : ['https://via.placeholder.com/400'],
    rating: avgRating,
    reviews: reviewCount,
    unit: 'Pcs',
    inStock: apiData.availabilityStatus === 'In Stock' && apiData.stock > 0,
    stock: apiData.stock,
    category: apiData.category,
    description: apiData.description,
    weight: apiData.weight,
    dimensions: apiData.dimensions,
    warrantyInformation: apiData.warrantyInformation,
    shippingInformation: apiData.shippingInformation,
    returnPolicy: apiData.returnPolicy,
    minimumOrderQuantity: apiData.minimumOrderQuantity,
    tags: apiData.tags,
    type: apiData.tags ? apiData.tags.join(' · ') : 'Premium Product'
  };
};

// Helper function to get nutritional info based on product category
const getNutritionInfo = (category) => {
  // This is mock data as the API doesn't provide nutrition info
  const nutritionMap = {
    'beauty': [
      { label: 'Weight', value: '9g' },
      { label: 'Dimensions', value: '9.26 x 22.47 x 27.67 cm' },
    ],
    'default': [
      { label: 'Weight', value: 'N/A' },
      { label: 'Dimensions', value: 'N/A' },
    ]
  };
  return nutritionMap[category] || nutritionMap.default;
};

// Helper function to get allergens (mock as API doesn't provide)
const getAllergens = (category) => {
  const allergenMap = {
    'beauty': ['May contain fragrance allergens'],
    'default': ['Check product label for allergens']
  };
  return allergenMap[category] || allergenMap.default;
};

const UNITS = ['Pcs', 'Kg', 'Pack'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────────
const fmt = (p) => `QAR ${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// Confetti particle
const useConfetti = () => {
  const particles = Array.from({ length: 8 }, () => ({
    x: useSharedValue(0),
    y: useSharedValue(0),
    opacity: useSharedValue(0),
    scale: useSharedValue(1),
  }));

  const trigger = () => {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    particles.forEach((p, i) => {
      const rad  = (angles[i] * Math.PI) / 180;
      const dist = 60 + Math.random() * 40;
      p.x.value = 0; p.y.value = 0;
      p.opacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 500 }),
      );
      p.x.value = withTiming(Math.cos(rad) * dist, { duration: 600 });
      p.y.value = withTiming(Math.sin(rad) * dist, { duration: 600 });
      p.scale.value = withSequence(
        withTiming(1.4, { duration: 200 }),
        withTiming(0,   { duration: 400 }),
      );
    });
  };

  return { particles, trigger };
};

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────────

const ConfettiParticle = ({ p, color }) => {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: p.x.value },
      { translateY: p.y.value },
      { scale: p.scale.value },
    ],
    opacity: p.opacity.value,
  }));
  return <Animated.View style={[confS.particle, { backgroundColor: color }, style]} />;
};

const Divider = () => <View style={styles.divider} />;

// ─── INFO BLOCK — replaces accordion ─────────────────────────────────────────────
const InfoBlock = ({ icon, label, value }) => (
  <View style={infoS.row}>
    <View style={infoS.iconWrap}>
      <Ionicons name={icon} size={15} color={COLORS.textSub} />
    </View>
    <View style={infoS.textWrap}>
      <Text style={infoS.label}>{label}</Text>
      <Text style={infoS.value}>{value}</Text>
    </View>
  </View>
);

const RelatedCard = ({ item, onPress, index }) => {
  const p = usePress();
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: withDelay(index * 60, withTiming(1, { duration: ANIM.duration.normal })),
    transform: [{ translateY: withDelay(index * 60, withSpring(0, ANIM.springSlow)) }],
  }));

  return (
    <Animated.View style={[{ opacity: 0, transform: [{ translateY: 20 }] }, entranceStyle, p.animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        style={relS.card}
        activeOpacity={1}
      >
        <Image source={{ uri: item.image }} style={relS.img} />
        <LinearGradient
          colors={['transparent', 'rgba(61,43,0,0.70)']}
          style={relS.imgGrad}
        />
        <View style={relS.info}>
          <Text style={relS.name} numberOfLines={2}>{item.name}</Text>
          <View style={relS.ratingRow}>
            <Ionicons name="star" size={10} color={COLORS.primary} />
            <Text style={relS.rating}>{item.rating}</Text>
          </View>
          <Text style={relS.price}>{fmt(item.price)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────
export default function ItemDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgIdx, setImgIdx]   = useState(0);
  const [qty, setQty]         = useState(1);
  const [activeUnit, setUnit] = useState(UNITS[0]);
  const [added, setAdded]     = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const { particles, trigger } = useConfetti();
  const btnScale     = useSharedValue(1);
  const inStockPulse = useSharedValue(1);
  const cartBarY     = useSharedValue(80);
  const minusPress   = usePress();
  const plusPress    = usePress();

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://dummyjson.com/product/1');
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const data = await response.json();
        const transformedData = transformProductData(data);
        setItem(transformedData);
        
        // Fetch related products (products from same category)
        if (transformedData.category) {
          const relatedResponse = await fetch(`https://dummyjson.com/products/category/${transformedData.category}?limit=4`);
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            const transformedRelated = relatedData.products
              .filter(p => p.id !== data.id)
              .slice(0, 4)
              .map(p => ({
                id: p.id.toString(),
                name: p.title,
                price: p.price,
                image: p.thumbnail,
                rating: p.rating
              }));
            setRelatedProducts(transformedRelated);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, []);

  useEffect(() => {
    if (item?.inStock) {
      inStockPulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 700 }),
          withTiming(1,    { duration: 700 }),
        ),
        -1,
        false,
      );
    }
    cartBarY.value = withSpring(0, ANIM.spring);
  }, [item]);

  const inStockStyle = useAnimatedStyle(() => ({ transform: [{ scale: inStockPulse.value }] }));
  const btnStyle     = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const cartBarStyle = useAnimatedStyle(() => ({ transform: [{ translateY: cartBarY.value }] }));

  const handleAddToCart = () => {
    if (!item) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    btnScale.value = withSequence(
      withSpring(0.92, ANIM.springFast),
      withSpring(1,    ANIM.spring),
    );
    trigger();
    addItem({ ...item, qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleDecrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQty((q) => Math.max(1, q - 1));
  };

  const handleIncrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQty((q) => q + 1);
  };
  
  // Show loading state
  if (loading) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: SPACING.md, color: COLORS.textSub }}>Loading product...</Text>
      </View>
    );
  }
  
  // Show error state
  if (error || !item) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={{ marginTop: SPACING.md, color: COLORS.error, textAlign: 'center' }}>
          {error || 'Failed to load product'}
        </Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ marginTop: SPACING.lg, backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: RADIUS.md }}
        >
          <Text style={{ color: COLORS.text, fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const store = route.params?.store || { id: 's1', name: item.store };
  const images = item.images || [item.image, `${item.image}?2`, `${item.image}?3`];
  const totalPrice = item.price * qty;
  const nutritionInfo = getNutritionInfo(item.category);
  const allergens = getAllergens(item.category);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>

        {/* ── Image gallery ─────────────────────────────── */}
        <View style={styles.galleryWrap}>
          <Image source={{ uri: images[imgIdx] }} style={styles.galleryBg} blurRadius={24} />
          <LinearGradient
            colors={['transparent', 'rgba(61,43,0,0.40)', 'rgba(61,43,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `img-${i}`}
            onMomentumScrollEnd={(e) => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
            renderItem={({ item: img }) => (
              <Image source={{ uri: img }} style={styles.galleryImg} resizeMode="cover" />
            )}
          />

          {/* Dot indicators */}
          <View style={styles.galleryDots}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.galleryDot, imgIdx === i && styles.galleryDotActive]}
              />
            ))}
          </View>

          {/* Back + share */}
          <SafeAreaView edges={['top']} style={styles.galleryBtns}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassBtn}>
              <Ionicons name="arrow-back" size={20} color={COLORS.bg} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.glassBtn}>
              <Ionicons name="share-outline" size={20} color={COLORS.bg} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Discount badge on image */}
          {item.discount > 0 && (
            <View style={styles.galleryDiscBadge}>
              <Text style={styles.galleryDiscTxt}>{item.discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* ── Main content ──────────────────────────────── */}
        <View style={styles.content}>

          {/* Store link + stock badge */}
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.storePill}>
              <Ionicons name="storefront-outline" size={13} color={COLORS.textMuted} />
              <Text style={styles.storeName}>{item.store || store.name}</Text>
            </TouchableOpacity>

            {item.inStock ? (
              <Animated.View style={[styles.inStockBadge, inStockStyle]}>
                <View style={styles.inStockDot} />
                <Text style={styles.inStockTxt}>In Stock ({item.stock || 0} left)</Text>
              </Animated.View>
            ) : (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outTxt}>Out of Stock</Text>
              </View>
            )}
          </View>

          {/* Item name */}
          <Text style={styles.itemName}>{item.name}</Text>

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <View style={styles.starsRow}>
              {[1,2,3,4,5].map((i) => (
                <Ionicons
                  key={i}
                  name={i <= Math.floor(item.rating) ? 'star' : 'star-outline'}
                  size={14}
                  color={COLORS.primary}
                />
              ))}
            </View>
            <Text style={styles.ratingVal}>{item.rating?.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({item.reviews} reviews)</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeTxt}>{item.type || 'Premium'}</Text>
            </View>
          </View>

          {/* Price row */}
          <View style={styles.priceCard}>
            <View style={styles.priceLeft}>
              {item.originalPrice > item.price && (
                <Text style={styles.origPrice}>{fmt(item.originalPrice)}</Text>
              )}
              <Text style={styles.price}>{fmt(item.price)}</Text>
            </View>
            <View style={styles.priceRight}>
              <Text style={styles.perUnitLabel}>per {activeUnit}</Text>
            </View>
          </View>

          <Divider />

          {/* Unit selector */}
          <Text style={styles.sectionLabel}>Select Unit</Text>
          <View style={styles.unitRow}>
            {UNITS.map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => setUnit(u)}
                style={[styles.unitBtn, activeUnit === u && styles.unitBtnActive]}
              >
                {activeUnit === u && (
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.secondaryDark} style={{ marginRight: SPACING.xs }} />
                )}
                <Text style={[styles.unitTxt, activeUnit === u && styles.unitTxtActive]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Divider />

          {/* Description */}
          <Text style={styles.sectionLabel}>About this item</Text>
          <Text style={styles.desc}>{item.description}</Text>

          <Divider />

          {/* ── Nutrition — flat text, no accordion ──────── */}
          <View style={flatS.block}>
            <View style={flatS.labelRow}>
              <Ionicons name="leaf-outline" size={16} color={COLORS.textSub} />
              <Text style={flatS.sectionTitle}>Product Details</Text>
            </View>
            <View style={flatS.pillsRow}>
              {nutritionInfo.map((n) => (
                <View key={n.label} style={flatS.pill}>
                  <Text style={flatS.pillValue}>{n.value}</Text>
                  <Text style={flatS.pillLabel}>{n.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Allergens / Additional Info — flat text, no accordion ──────── */}
          <View style={flatS.block}>
            <View style={flatS.labelRow}>
              <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
              <Text style={flatS.sectionTitle}>Additional Information</Text>
            </View>
            <View style={flatS.allergenRow}>
              {allergens.map((a) => (
                <View key={a} style={flatS.allergenChip}>
                  <Text style={flatS.allergenTxt}>{a}</Text>
                </View>
              ))}
            </View>
            {item.warrantyInformation && (
              <Text style={flatS.additionalText}>Warranty: {item.warrantyInformation}</Text>
            )}
            {item.shippingInformation && (
              <Text style={flatS.additionalText}>Shipping: {item.shippingInformation}</Text>
            )}
            {item.returnPolicy && (
              <Text style={flatS.additionalText}>Return Policy: {item.returnPolicy}</Text>
            )}
            {item.minimumOrderQuantity && (
              <Text style={flatS.additionalText}>Minimum Order: {item.minimumOrderQuantity} units</Text>
            )}
          </View>

          {/* Related items */}
          {relatedProducts.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: SPACING.xs }]}>You May Also Like</Text>
              <FlatList
                data={relatedProducts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(i) => i.id}
                contentContainerStyle={{ gap: SPACING.sm }}
                renderItem={({ item: r, index }) => (
                  <RelatedCard 
                    item={r} 
                    index={index} 
                    onPress={() => navigation.push('ItemDetail', { item: r })}
                  />
                )}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Confetti overlay ──────────────────────────── */}
      <View style={confS.container} pointerEvents="none">
        {particles.map((p, i) => (
          <ConfettiParticle
            key={i}
            p={p}
            color={i % 2 === 0 ? COLORS.primary : COLORS.secondary}
          />
        ))}
      </View>

      {/* ── Floating bottom bar — redesigned ─────────── */}
      <Animated.View style={[btmS.wrapper, { paddingBottom: 50 }, cartBarStyle]}>
        {/* Fade scrim above bar */}
        <LinearGradient
          colors={['rgba(250,247,242,0)', 'rgba(250,247,242,0.98)']}
          style={btmS.scrim}
          pointerEvents="none"
        />

        <View style={btmS.card}>
          {/* Left — qty stepper */}
          <View style={btmS.stepperBlock}>
            <Text style={btmS.stepperHeading}>Qty</Text>
            <View style={btmS.stepper}>
              <Animated.View style={minusPress.animStyle}>
                <TouchableOpacity
                  onPress={handleDecrement}
                  onPressIn={minusPress.onPressIn}
                  onPressOut={minusPress.onPressOut}
                  style={[btmS.stepTap, qty <= 1 && btmS.stepTapDisabled]}
                  activeOpacity={1}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={qty <= 1 ? COLORS.textMuted : COLORS.text}
                  />
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
                  style={btmS.stepTapPlus}
                  activeOpacity={1}
                >
                  <Ionicons name="add" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {/* Vertical rule */}
          <View style={btmS.vRule} />

          {/* Right — total + CTA */}
          <View style={btmS.ctaBlock}>
            <View style={btmS.totalRow}>
              <Text style={btmS.totalLabel}>Total</Text>
              <Text style={btmS.totalAmt}>{fmt(totalPrice)}</Text>
            </View>

            <Animated.View style={btnStyle}>
              <TouchableOpacity
                onPress={handleAddToCart}
                onPressIn={() => { btnScale.value = withSpring(0.96, ANIM.springFast); }}
                onPressOut={() => { btnScale.value = withSpring(1,    ANIM.spring); }}
                activeOpacity={1}
                disabled={!item.inStock}
                style={[btmS.addBtn, added && btmS.addBtnSuccess, !item.inStock && btmS.addBtnDisabled]}
              >
                <Ionicons
                  name={added ? 'checkmark-circle-outline' : 'bag-add-outline'}
                  size={20}
                  color={added ? COLORS.surface : COLORS.text}
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

// ─── MAIN STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  centerContent: { justifyContent: 'center', alignItems: 'center' },

  // Gallery
  galleryWrap: { height: GALLERY_H, position: 'relative', overflow: 'hidden', backgroundColor: COLORS.dark },
  galleryBg:   { position: 'absolute', width: '100%', height: '100%', opacity: 0.25 },
  galleryImg:  { width: W, height: GALLERY_H },
  galleryDots: {
    position: 'absolute', bottom: SPACING.md, alignSelf: 'center',
    flexDirection: 'row', gap: SPACING.xs,
  },
  galleryDot: {
    width: SPACING.sm - 2, height: SPACING.sm - 2,
    borderRadius: RADIUS.full, backgroundColor: 'rgba(250,247,242,0.35)',
  },
  galleryDotActive: { width: SPACING.lg, backgroundColor: COLORS.secondary },
  galleryBtns: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  glassBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(28,26,16,0.50)',
    borderWidth: 1, borderColor: 'rgba(250,247,242,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  galleryDiscBadge: {
    position: 'absolute', top: SPACING.xxl + SPACING.sm,
    right: SPACING.md,
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.sm + SPACING.xs,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  galleryDiscTxt: { color: COLORS.surface, fontSize: 12, fontWeight: '800' },

  // Content
  content: {
    paddingHorizontal: SPACING.md, paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm, gap: SPACING.md,
    backgroundColor: COLORS.bg,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  storePill: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.surfaceAlt, paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
  },
  storeName: { color: COLORS.textSub, fontSize: 12, fontWeight: '600' },

  inStockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.successLight, paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  inStockDot: { width: 7, height: 7, borderRadius: RADIUS.full, backgroundColor: COLORS.success },
  inStockTxt: { color: COLORS.success, fontSize: 12, fontWeight: '700' },
  outOfStockBadge: {
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, backgroundColor: COLORS.errorLight,
  },
  outTxt: { color: COLORS.error, fontSize: 12, fontWeight: '700' },

  itemName: { color: COLORS.text, fontSize: 26, fontWeight: '900', lineHeight: 32 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  starsRow:  { flexDirection: 'row', gap: 2 },
  ratingVal:   { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  ratingCount: { color: COLORS.textMuted, fontSize: 13 },
  typeBadge: {
    marginLeft: 'auto', backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  typeTxt: { color: COLORS.textSub, fontSize: 11, fontWeight: '600' },

  priceCard: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    ...SHADOW.subtle,
  },
  priceLeft:    { gap: 2 },
  priceRight:   { alignItems: 'flex-end' },
  origPrice:    { color: COLORS.textMuted, fontSize: 13, textDecorationLine: 'line-through' },
  price:        { color: COLORS.textSub, fontSize: 30, fontWeight: '900' },
  perUnitLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500' },

  divider: { height: 1, backgroundColor: COLORS.border },

  sectionLabel: { color: COLORS.text, fontSize: 15, fontWeight: '800' },

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

  desc: { color: COLORS.textMuted, fontSize: 14, lineHeight: 22 },
});

// ─── INFO BLOCK STYLES ────────────────────────────────────────────────────────────
const infoS = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  textWrap: { flex: 1 },
  label:    { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  value:    { color: COLORS.text, fontSize: 14, lineHeight: 21 },
});

// ─── FLAT SECTION STYLES (replaces accordion) ─────────────────────────────────────
const flatS = StyleSheet.create({
  block: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, gap: SPACING.sm,
    ...SHADOW.subtle,
  },
  labelRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },

  // Nutrition pills
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  pill: {
    alignItems: 'center', backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    minWidth: 64,
  },
  pillValue: { color: COLORS.textSub, fontSize: 15, fontWeight: '800' },
  pillLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '500', marginTop: 2 },

  // Allergen chips
  allergenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  allergenChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + SPACING.xs,
    paddingVertical: SPACING.xs + 2,
    borderWidth: 1, borderColor: COLORS.warning,
  },
  allergenTxt: { color: COLORS.warning, fontSize: 12, fontWeight: '700' },
  additionalText: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
});

// ─── RELATED CARD STYLES ──────────────────────────────────────────────────────────
const relS = StyleSheet.create({
  card: {
    width: 140, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
    // ...SHADOW.card,
  },
  img:     { width: 140, height: 100 },
  imgGrad: { position: 'absolute', top: 50, left: 0, right: 0, height: 50 },
  info: {
    padding: SPACING.sm, gap: SPACING.xs,
    backgroundColor: COLORS.surface,
  },
  name:      { color: COLORS.text, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  rating:    { color: COLORS.textMuted, fontSize: 11 },
  price:     { color: COLORS.textSub, fontSize: 14, fontWeight: '800' },
});

// ─── BOTTOM BAR STYLES — fully redesigned ─────────────────────────────────────────
const btmS = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
  },
  scrim: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },

  // Single unified card
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.float,
  },

  // Left stepper block
  stepperBlock: {
    width: 130,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  stepperHeading: {
    color: COLORS.textMuted, fontSize: 11,
    fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  stepTap: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepTapDisabled: {
    opacity: 0.4,
  },
  stepTapPlus: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBox: {
    width: 36, alignItems: 'center',
  },
  qtyNum: {
    color: COLORS.text, fontSize: 20, fontWeight: '900',
  },

  // Vertical divider
  vRule: {
    width: 1, backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },

  // Right CTA block
  ctaBlock: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: COLORS.textMuted, fontSize: 12, fontWeight: '600',
  },
  totalAmt: {
    color: COLORS.text, fontSize: 18, fontWeight: '900',
  },

  addBtn: {
    height: 48, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm,
    ...SHADOW.card,
  },
  addBtnSuccess: {
    backgroundColor: COLORS.success,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnTxt: {
    color: COLORS.text, fontSize: 15, fontWeight: '800',
  },
  addBtnTxtSuccess: {
    color: COLORS.surface,
  },
});

// ─── CONFETTI STYLES ──────────────────────────────────────────────────────────────
const confS = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 120,
    left: W / 2 - SPACING.sm, width: SPACING.md, height: SPACING.md,
  },
  particle: {
    position: 'absolute', width: SPACING.sm + SPACING.xs,
    height: SPACING.sm + SPACING.xs, borderRadius: RADIUS.full,
  },
});