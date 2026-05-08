import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, FlatList,
  Dimensions, StyleSheet, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, useAnimatedScrollHandler, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
const { width: W, height: H } = Dimensions.get('window');

const SUBCATS_MAP = {
  Grocery:     ['All', 'Fruits & Veg', 'Dairy', 'Bakery', 'Meat', 'Snacks', 'Beverages', 'Frozen'],
  Food:        ['All', 'Burgers', 'Pizza', 'Pasta', 'Sushi', 'Sandwiches', 'Desserts', 'Drinks'],
  Pharmacy:    ['All', 'Medicines', 'Vitamins', 'Skin Care', 'Baby Care', 'First Aid', 'Supplements'],
  Electronics: ['All', 'Phones', 'Laptops', 'Accessories', 'Audio', 'Gaming', 'Cameras'],
  Fashion:     ['All', 'T-Shirts', 'Dresses', 'Shoes', 'Bags', 'Accessories', 'Sport'],
  Homes:       ['All', 'Furniture', 'Kitchen', 'Lighting', 'Decor', 'Bedding', 'Cleaning'],
  Parcel:      ['All', 'Documents', 'Small Box', 'Medium Box', 'Large Box', 'Fragile'],
  Rental:      ['All', 'Cars', 'Bikes', 'Scooters', 'Vans', 'Trucks'],
  default:     ['All', 'Popular', 'New', 'Top Rated', 'Nearby', 'Open Now'],
};

const ALL_STORES = [
  { id: 's1', name: 'Organic Shop',   rating: 4.8, time: '20-30 min', fee: 'Free',    dist: '1.2 km', isOpen: true,  cover: '../assets/stores/1.jpeg',   logo: 'https://ui-avatars.com/api/?name=Organic+Shop&background=B8975A&color=FAF7F2&size=128',   cashback: 5,  minOrder: 'QAR 50',  tags: ['Organic', 'Fresh', 'Local'] },
  { id: 's2', name: 'Burger Express', rating: 4.6, time: '25-35 min', fee: 'QAR 10',  dist: '2.5 km', isOpen: true,  cover: '../assets/stores/2.jpeg', logo: 'https://ui-avatars.com/api/?name=Burger+Express&background=7A5C2E&color=FAF7F2&size=128', cashback: 0,  minOrder: 'QAR 80',  tags: ['Fast Food', 'Burgers'] },
  { id: 's3', name: 'PharmaCare',     rating: 4.9, time: '15-25 min', fee: 'Free',    dist: '0.8 km', isOpen: true,  cover: '../assets/stores/3.jpeg',     logo: 'https://ui-avatars.com/api/?name=PharmaCare&background=5C3D00&color=FAF7F2&size=128',   cashback: 3,  minOrder: 'QAR 30',  tags: ['24/7', 'Medicines', 'Express'] },
  { id: 's4', name: 'TechZone',       rating: 4.5, time: '40-55 min', fee: 'QAR 20',  dist: '4.1 km', isOpen: false, cover: '../assets/stores/4.jpeg',       logo: 'https://ui-avatars.com/api/?name=TechZone&background=3D2B00&color=FAF7F2&size=128',     cashback: 2,  minOrder: 'QAR 200', tags: ['Electronics', 'Gadgets'] },
  { id: 's5', name: 'Green Market',   rating: 4.7, time: '30-40 min', fee: 'Free',    dist: '1.9 km', isOpen: true,  cover: '../assets/stores/5.jpeg',   logo: 'https://ui-avatars.com/api/?name=Green+Market&background=B8975A&color=FAF7F2&size=128', cashback: 7,  minOrder: 'QAR 40',  tags: ['Veggies', 'Fruits', 'Organic'] },
  { id: 's6', name: 'Beauty Hub',     rating: 4.4, time: '35-45 min', fee: 'QAR 15',  dist: '3.2 km', isOpen: true,  cover: '../assets/stores/6.jpeg',     logo: 'https://ui-avatars.com/api/?name=Beauty+Hub&background=7A5C2E&color=FAF7F2&size=128',   cashback: 4,  minOrder: 'QAR 100', tags: ['Cosmetics', 'Skincare'] },
  { id: 's7', name: 'Home Depot',     rating: 4.3, time: '45-60 min', fee: 'QAR 25',  dist: '5.8 km', isOpen: true,  cover: '../assets/stores/7.jpeg',     logo: 'https://ui-avatars.com/api/?name=Home+Depot&background=5C3D00&color=FAF7F2&size=128',   cashback: 0,  minOrder: 'QAR 150', tags: ['Furniture', 'Decor'] },
  { id: 's8', name: 'Quick Courier',  rating: 4.6, time: '10-20 min', fee: 'QAR 30',  dist: '0.5 km', isOpen: true,  cover: '../assets/stores/8.jpeg',       logo: 'https://ui-avatars.com/api/?name=Quick+Courier&background=3D2B00&color=FAF7F2&size=128', cashback: 0,  minOrder: 'QAR 0',   tags: ['Fast', 'Reliable'] },
];

const storeImages = {
  s1: require('../assets/stores/1.jpeg'),
  s2: require('../assets/stores/2.jpeg'),
  s3: require('../assets/stores/3.jpeg'),
  s4: require('../assets/stores/4.jpeg'),
  s5: require('../assets/stores/5.jpeg'),
  s6: require('../assets/stores/6.jpeg'),
  s7: require('../assets/stores/1.jpeg'),
  s8: require('../assets/stores/2.jpeg'),
};

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended'   },
  { id: 'time',        label: 'Delivery Time' },
  { id: 'distance',    label: 'Distance'      },
  { id: 'rating',      label: 'Top Rated'     },
];

// ─── usePress HOOK ───────────────────────────────────────────────────────────────
const usePress = () => {
  const scale     = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1,    ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// ─── SHIMMER ROW ─────────────────────────────────────────────────────────────────
const ShimmerRow = () => {
  const op = useSharedValue(0.4);
  useEffect(() => {
    op.value = withRepeat(withTiming(1.0, { duration: 750 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View style={[shimS.card, style]}>
      <View style={shimS.img} />
      <View style={{ flex: 1, gap: SPACING.sm, padding: SPACING.sm }}>
        <View style={shimS.line} />
        <View style={[shimS.line, { width: '60%' }]} />
        <View style={[shimS.line, { width: '40%' }]} />
      </View>
    </Animated.View>
  );
};

// ─── STORE ROW ───────────────────────────────────────────────────────────────────
const StoreRow = ({ store, onPress, index }) => {
  const p       = usePress();
  const opacity = useSharedValue(0);
  const transY  = useSharedValue(20);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withTiming(1,  { duration: ANIM.duration.normal, delay });
    transY.value  = withSpring(0, { ...ANIM.spring, delay });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: transY.value }],
  }));

  return (
    <Animated.View style={[p.animStyle, entranceStyle]}>
      <TouchableOpacity
        onPress={onPress} 
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        style={styles.storeRow}
        activeOpacity={1}
      >
        {/* Cover image */}
        <View style={styles.storeRowImgWrap}>
<Image source={storeImages[store.id]} style={styles.storeRowImg} resizeMode="cover" /> 
          <LinearGradient
            colors={['transparent', 'rgba(61,43,0,0.40)', 'rgba(61,43,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Open / Closed badge */}
          <View style={[
            styles.openBadge,
            { backgroundColor: store.isOpen ? COLORS.successLight : COLORS.errorLight },
          ]}>
            <View style={[
              styles.openDot,
              { backgroundColor: store.isOpen ? COLORS.success : COLORS.error },
            ]} />
            <Text style={[
              styles.openBadgeTxt,
              { color: store.isOpen ? COLORS.success : COLORS.error },
            ]}>
              {store.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>

          {/* Min order chip */}
          {store.minOrder !== 'QAR 0' && (
            <View style={styles.minOrderBadge}>
              <Text style={styles.minOrderTxt}>Min {store.minOrder}</Text>
            </View>
          )}
        </View>

        {/* Info section */}
        <View style={styles.storeRowInfo}>
          {/* Top row: logo + name + meta */}
          <View style={styles.storeRowTop}>
            <Image source={{ uri: store.logo }} style={styles.storeRowLogo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.storeRowName}>{store.name}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={11} color={COLORS.secondary} />
                  <Text style={styles.meta}>{store.rating}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
                  <Text style={styles.meta}>{store.time}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
                  <Text style={styles.meta}>{store.dist}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom row: tags + fee */}
          <View style={styles.storeRowBottom}>
            <View style={styles.tagRow}>
              {store.tags.slice(0, 2).map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagTxt}>{t}</Text>
                </View>
              ))}
            </View>
            <View style={[
              styles.feeChip,
              { backgroundColor: store.fee === 'Free' ? COLORS.successLight : COLORS.surfaceAlt },
            ]}>
              {store.fee === 'Free'
                ? <Ionicons name="gift-outline" size={11} color={COLORS.success} />
                : <Ionicons name="bicycle-outline" size={11} color={COLORS.textMuted} />
              }
              <Text style={[
                styles.feeTxt,
                { color: store.fee === 'Free' ? COLORS.success : COLORS.textMuted },
              ]}>
                {store.fee === 'Free' ? 'Free Delivery' : store.fee}
              </Text>
            </View>
          </View>

          {/* Cashback strip */}
          {store.cashback > 0 && (
            <View style={styles.cashbackWrap}>
              <Ionicons name="cash-outline" size={13} color={COLORS.secondaryDark} />
              <Text style={styles.cashbackTxt}>
                {store.cashback}% cashback on this order
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── SORT SHEET ──────────────────────────────────────────────────────────────────
const SortSheet = ({ visible, onClose, active, onSelect }) => {
  const ty = useSharedValue(H);

  useEffect(() => {
    ty.value = visible
      ? withSpring(0, ANIM.springSlow)
      : withTiming(H, { duration: ANIM.duration.normal });
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[styles.sortSheet, sheetStyle]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Sort by</Text>
        {SORT_OPTIONS.map((opt) => {
          const isActive = active === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.sortOpt, isActive && styles.sortOptActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSelect(opt.id);
                onClose();
              }}
            >
              <Text style={[styles.sortOptTxt, isActive && styles.sortOptTxtActive]}>
                {opt.label}
              </Text>
              {isActive && (
                <View style={styles.sortCheckCircle}>
                  <Ionicons name="checkmark" size={14} color={COLORS.success} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function CategoryScreen({ navigation, route }) {
  const { category } = route.params || { category: { name: 'All', icon: '🛒' } };

  const subs = SUBCATS_MAP[category.name] || SUBCATS_MAP.default;
  const [activeSub,  setActiveSub]  = useState('All');
  const [activeSort, setActiveSort] = useState('recommended');
  const [showSort,   setShowSort]   = useState(false);
  const [loading,    setLoading]    = useState(true);

  const scrollY   = useSharedValue(0);
  const subScroll = useRef(null);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1200);
  }, []);

  const onScroll = useAnimatedScrollHandler((e) => { scrollY.value = e.contentOffset.y; });

  const stickyHeaderStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(250,247,242,${interpolate(scrollY.value, [0, 80], [0, 0.97], Extrapolation.CLAMP)})`,
    borderBottomWidth: interpolate(scrollY.value, [0, 80], [0, 1], Extrapolation.CLAMP),
    shadowOpacity: interpolate(scrollY.value, [0, 80], [0, 0.08], Extrapolation.CLAMP),
  }));

  const heroTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.root}>
      {/* ─── Sticky mini header ─── */}
      <Animated.View style={[styles.stickyHeader, stickyHeaderStyle]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.stickyInner}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.text} />
            </TouchableOpacity>
             
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* ─── Hero ─── */}
        <LinearGradient
          colors={['#1C1A10', '#2A2418', '#33291C']}
          style={styles.hero}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.heroInner}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtnDark}
              >
                <Ionicons name="arrow-back" size={20} color={COLORS.bg} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <Animated.View style={[styles.heroContent, heroTitleStyle]}>
            <View style={styles.heroIconRing}>
              <Text style={styles.heroCatIcon}>{category.icon}</Text>
            </View>
            <Text style={styles.heroCatName}>{category.name}</Text>
            <Text style={styles.heroCatSub}>{ALL_STORES.length} stores nearby</Text>
          </Animated.View>
        </LinearGradient>

        {/* ─── Sub-category chips (sticky) ─── */}
        <View style={styles.subCatBar}>
          <ScrollView
            ref={subScroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: SPACING.sm }}
          >
            {subs.map((s) => {
              const isActive = s === activeSub;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setActiveSub(s);
                  }}
                  style={[styles.chip, isActive && styles.chipActive]}
                >
                  <Text style={[styles.chipTxt, isActive && styles.chipTxtActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Sort / Filter bar ─── */}
        <View style={styles.sortBar}>
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setShowSort(true)}
          >
            <Ionicons name="swap-vertical-outline" size={15} color={COLORS.textMuted} />
            <Text style={styles.sortBtnTxt}>
              {SORT_OPTIONS.find((o) => o.id === activeSort)?.label}
            </Text>
            <Ionicons name="chevron-down" size={13} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options-outline" size={15} color={COLORS.textMuted} />
            <Text style={styles.sortBtnTxt}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Store list ─── */}
        <View style={styles.storeList}>
          {loading
            ? [1, 2, 3].map((i) => <ShimmerRow key={i} />)
            : ALL_STORES.map((s, index) => (
                <StoreRow
                  key={s.id}
                  store={s}
                  index={index}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('Store', { store: s });
                  }}
                />
              ))
          }
        </View>
      </Animated.ScrollView>

      <SortSheet
        visible={showSort}
        onClose={() => setShowSort(false)}
        active={activeSort}
        onSelect={setActiveSort}
      />
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Sticky header
  stickyHeader: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    zIndex:          100,
    borderBottomColor: COLORS.border,
    shadowColor:     COLORS.dark,
    shadowOffset:    { width: 0, height: 3 },
    shadowRadius:    10,
    elevation:       6,
  },
  stickyInner: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom:   SPACING.sm,
    paddingTop:      SPACING.xs,
  },
  stickyTitle: {
    color:      COLORS.primaryLight,
    fontSize:   17,
    fontFamily: 'Poppins_800ExtraBold',
  },

  // Back buttons
  backBtn: {
    width:           40,
    height:          40,
    borderRadius:    RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth:     1,
    borderColor:     COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
    ...{
      shadowColor:   COLORS.dark,
      shadowOffset:  { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius:  6,
      elevation:     2,
    },
  },
  backBtnDark: {
    width:           40,
    height:          40,
    borderRadius:    RADIUS.full,
    backgroundColor: 'rgba(250,247,242,0.08)',
    borderWidth:     1,
    borderColor:     'rgba(250,247,242,0.14)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Hero
  hero:        { paddingBottom: SPACING.xl },
  heroInner:   { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  heroContent: {
    alignItems:   'center',
    paddingTop:   SPACING.md,
    paddingBottom: SPACING.sm,
    gap:          SPACING.sm,
  },
  heroIconRing: {
    width:           88,
    height:          88,
    borderRadius:    RADIUS.full,
    backgroundColor: 'rgba(250,247,242,0.08)',
    borderWidth:     1.5,
    borderColor:     'rgba(250,247,242,0.14)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACING.xs,
  },
  heroCatIcon: { fontSize: 44 },
  heroCatName: {
    color:      COLORS.bg,
    fontSize:   28,
    fontFamily: 'Poppins_900Black',
  },
  heroCatSub: {
    color:    'rgba(250,247,242,0.55)',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },

  // Sub-category bar (sticky)
  subCatBar: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.xs + 2,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
    borderColor:       COLORS.border,
    backgroundColor:   COLORS.surfaceAlt,
  },
  chipActive: {
    backgroundColor: COLORS.surface,
    borderColor:     COLORS.borderStrong,
    // active pill gets a soft shadow
    shadowColor:     COLORS.dark,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    6,
    elevation:       2,
  },
  chipTxt: {
    color:      COLORS.textMuted,
    fontSize:   13,
    fontFamily: 'Poppins_600SemiBold',
  },
  chipTxtActive: { color: COLORS.text },

  // Sort / filter bar
  sortBar: {
    flexDirection:   'row',
    gap:             SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical:  SPACING.sm,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sortBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.xs,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm + SPACING.xs,
    paddingVertical:  SPACING.xs + 2,
    borderRadius:    RADIUS.full,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  filterBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.xs,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm + SPACING.xs,
    paddingVertical:  SPACING.xs + 2,
    borderRadius:    RADIUS.full,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  sortBtnTxt: {
    color:      COLORS.textMuted,
    fontSize:   13,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Store list
  storeList: {
    padding: SPACING.md,
    gap:     SPACING.sm,
  },

  // Store row card
  storeRow: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     COLORS.border,
    ...{
      shadowColor:   '#3D2B00',
      shadowOffset:  { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius:  12,
      elevation:     4,
    },
  },
  storeRowImgWrap: { height: 140, position: 'relative' },
  storeRowImg:     { width: '100%', height: '100%' },

  // Open badge
  openBadge: {
    position:      'absolute',
    bottom:        SPACING.sm,
    left:          SPACING.sm,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   SPACING.xs,
    borderRadius:  RADIUS.full,
  },
  openDot:    { width: 6, height: 6, borderRadius: RADIUS.full },
  openBadgeTxt: { fontSize: 11, fontFamily: 'Poppins_700Bold' },

  // Min order badge
  minOrderBadge: {
    position:        'absolute',
    bottom:          SPACING.sm,
    right:           SPACING.sm,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   SPACING.xs,
    borderRadius:    RADIUS.full,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  minOrderTxt: {
    color:      COLORS.textSub,
    fontSize:   10,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Info section
  storeRowInfo: { padding: SPACING.sm, gap: SPACING.sm },
  storeRowTop:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  storeRowLogo: {
    width:           44,
    height:          44,
    borderRadius:    RADIUS.full,
    borderWidth:     2,
    borderColor:     COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  storeRowName: {
    color:      COLORS.text,
    fontSize:   15,
    fontFamily: 'Poppins_800ExtraBold',
    marginBottom: 3,
  },

  // Meta row
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaDivider: { width: 1, height: 10, backgroundColor: COLORS.border },
  meta:        { color: COLORS.textMuted, fontSize: 11, fontFamily: 'Poppins_400Regular' },

  // Bottom row
  storeRowBottom: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  tagRow: { flexDirection: 'row', gap: SPACING.xs },
  tag: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   2,
    borderRadius:    RADIUS.full,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  tagTxt: { color: COLORS.textSub, fontSize: 10, fontFamily: 'Poppins_500Medium' },
  feeChip: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           3,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   3,
    borderRadius:  RADIUS.full,
    borderWidth:   1,
    borderColor:   COLORS.border,
  },
  feeTxt: { fontSize: 11, fontFamily: 'Poppins_600SemiBold' },

  // Cashback strip
  cashbackWrap: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.xs,
    backgroundColor: COLORS.secondaryLight,
    borderRadius:    RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical:  SPACING.xs + 2,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  cashbackTxt: {
    color:      COLORS.secondaryDark,
    fontSize:   12,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Sort sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,26,16,0.55)',
  },
  sortSheet: {
    position:            'absolute',
    bottom:              0,
    left:                0,
    right:               0,
    backgroundColor:     COLORS.surface,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop:          SPACING.sm,
    paddingBottom:       SPACING.xl,
    paddingHorizontal:   SPACING.md,
    gap:                 SPACING.xs,
    borderWidth:         1,
    borderBottomWidth:   0,
    borderColor:         COLORS.border,
    ...{
      shadowColor:   COLORS.dark,
      shadowOffset:  { width: 0, height: -4 },
      shadowOpacity: 0.10,
      shadowRadius:  16,
      elevation:     12,
    },
  },
  sheetHandle: {
    width:           40,
    height:          4,
    borderRadius:    RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf:       'center',
    marginBottom:    SPACING.md,
  },
  sheetTitle: {
    color:        COLORS.text,
    fontSize:     18,
    fontFamily:   'Poppins_800ExtraBold',
    marginBottom: SPACING.xs,
  },
  sortOpt: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sortOptActive: { },
  sortOptTxt: {
    color:      COLORS.textMuted,
    fontSize:   15,
    fontFamily: 'Poppins_600SemiBold',
  },
  sortOptTxtActive: { color: COLORS.text },
  sortCheckCircle: {
    width:           26,
    height:          26,
    borderRadius:    RADIUS.full,
    backgroundColor: COLORS.successLight,
    borderWidth:     1,
    borderColor:     COLORS.success,
    alignItems:      'center',
    justifyContent:  'center',
  },
});

// ─── SHIMMER STYLES ──────────────────────────────────────────────────────────────
const shimS = StyleSheet.create({
  card: {
    flexDirection:   'row',
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.lg,
    overflow:        'hidden',
    marginBottom:    SPACING.sm,
    height:          100,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  img:  { width: 100, backgroundColor: COLORS.border },
  line: {
    height:          12,
    backgroundColor: COLORS.border,
    borderRadius:    RADIUS.sm,
    width:           '80%',
  },
});