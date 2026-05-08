import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, TextInput, FlatList,
  Dimensions, StyleSheet, Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, withDelay, Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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

// ─── DIMENSIONS ─────────────────────────────────────────────────────────────────
const { width: W } = Dimensions.get('window');

// ─── FAKE DATA ───────────────────────────────────────────────────────────────────
const RECENT = ['Wagyu Burger', 'Vitamin C', 'Fresh Strawberries', 'iPhone Case', 'Organic Avocado'];

const TRENDING = [
  { label: 'Burgers 🍔' },
  { label: 'Sushi 🍣' },
  { label: 'Pizza 🍕' },
  { label: 'Vitamins 💊' },
  { label: 'Groceries 🛒' },
  { label: 'Phones 📱' },
  { label: 'Ice Cream 🍦' },
  { label: 'Coffee ☕' },
];

const PRODUCTS = [
  { id: 'p1', name: 'Gourmet Beef Burger',  store: 'Burger Express', price: 190, originalPrice: 240, image: 'https://picsum.photos/seed/burger/300/300',     rating: 4.7, category: 'Food'       },
  { id: 'p2', name: 'Fresh Strawberries',   store: 'Green Market',   price: 85,  originalPrice: 120, image: 'https://picsum.photos/seed/strawberry/300/300', rating: 4.9, category: 'Grocery'   },
  { id: 'p3', name: 'Vitamin C 1000mg',     store: 'PharmaCare',     price: 55,  originalPrice: 75,  image: 'https://picsum.photos/seed/vitamins/300/300',   rating: 4.8, category: 'Pharmacy'  },
  { id: 'p4', name: 'iPhone 15 Pro Case',   store: 'TechZone',       price: 75,  originalPrice: 150, image: 'https://picsum.photos/seed/iphonecase/300/300', rating: 4.5, category: 'Electronics' },
  { id: 'p5', name: 'Organic Avocados x3',  store: 'Green Market',   price: 110, originalPrice: 140, image: 'https://picsum.photos/seed/avocado/300/300',    rating: 4.7, category: 'Grocery'   },
  { id: 'p6', name: 'Blueberry Smoothie',   store: 'Organic Shop',   price: 75,  originalPrice: 95,  image: 'https://picsum.photos/seed/smoothie/300/300',   rating: 4.5, category: 'Food'      },
  { id: 'p7', name: 'Hand Cream Duo Set',   store: 'Beauty Hub',     price: 100, originalPrice: 200, image: 'https://picsum.photos/seed/handcream/300/300',  rating: 4.6, category: 'Fashion'   },
  { id: 'p8', name: 'Wireless Earbuds',     store: 'TechZone',       price: 350, originalPrice: 550, image: 'https://picsum.photos/seed/earbuds/300/300',    rating: 4.8, category: 'Electronics' },
];

const STORES = [
  { id: 's1', name: 'Organic Shop',   rating: 4.8, time: '20-30 min', fee: 'Free',   dist: '1.2 km', logo: 'https://ui-avatars.com/api/?name=Organic+Shop&background=2E7D32&color=fff&size=128',   cover: 'https://picsum.photos/seed/organicshop/600/200',   tags: ['Organic', 'Fresh']  },
  { id: 's2', name: 'Burger Express', rating: 4.6, time: '25-35 min', fee: 'QAR 10', dist: '2.5 km', logo: 'https://ui-avatars.com/api/?name=Burger+Express&background=7A5C2E&color=fff&size=128', cover: 'https://picsum.photos/seed/burgerexpress/600/200', tags: ['Fast Food']         },
  { id: 's3', name: 'PharmaCare',     rating: 4.9, time: '15-25 min', fee: 'Free',   dist: '0.8 km', logo: 'https://ui-avatars.com/api/?name=PharmaCare&background=1565C0&color=fff&size=128',   cover: 'https://picsum.photos/seed/pharmacy2/600/200',    tags: ['24/7', 'Express']   },
];

// ─── HELPERS ────────────────────────────────────────────────────────────────────
const fmt = (p) => `QAR ${p.toLocaleString()}`;

const filterItems = (query, tab) => {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  if (tab === 'stores') return STORES.filter((s) => s.name.toLowerCase().includes(q));
  return PRODUCTS.filter((p) => p.name.toLowerCase().includes(q) || p.store.toLowerCase().includes(q));
};

// ─── usePress HOOK ───────────────────────────────────────────────────────────────
const usePress = () => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn  = () => { scale.value = withSpring(0.95, ANIM.springFast); };
  const onPressOut = () => { scale.value = withSpring(1, ANIM.spring); };
  return { animStyle, onPressIn, onPressOut };
};

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────────

const ShimmerCard = ({ height = 80 }) => {
  const op = useSharedValue(0.4);
  useEffect(() => {
    op.value = withRepeat(withTiming(1.0, { duration: 750 }), -1, true);
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View
      style={[
        { height, backgroundColor: COLORS.border, borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
        s,
      ]}
    />
  );
};

const ProductResult = ({ item, index, onPress }) => {
  const p = usePress();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: ANIM.duration.normal }));
    translateY.value = withDelay(index * 60, withSpring(0, ANIM.spring));
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const discountPct = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);

  return (
    <Animated.View style={[p.animStyle, entranceStyle]}>
      <TouchableOpacity
        style={styles.resultRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        activeOpacity={1}
      >
        <View style={styles.resultImgWrap}>
          <Image source={{ uri: item.image }} style={styles.resultImg} />
          {item.originalPrice > item.price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountTxt}>-{discountPct}%</Text>
            </View>
          )}
        </View>
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.resultStore}>{item.store} · {item.category}</Text>
          <View style={styles.resultMeta}>
            <Ionicons name="star" size={12} color={COLORS.secondary} />
            <Text style={styles.resultRating}>{item.rating}</Text>
          </View>
          <View style={styles.resultPriceRow}>
            {item.originalPrice > item.price && (
              <Text style={styles.origPrice}>{fmt(item.originalPrice)}</Text>
            )}
            <Text style={styles.price}>{fmt(item.price)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const StoreResult = ({ store, index, onPress }) => {
  const p = usePress();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: ANIM.duration.normal }));
    translateY.value = withDelay(index * 60, withSpring(0, ANIM.spring));
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[p.animStyle, entranceStyle]}>
      <TouchableOpacity
        style={styles.storeResult}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        activeOpacity={1}
      >
        <Image source={{ uri: store.logo }} style={styles.storeLogo} />
        <View style={styles.storeResultInfo}>
          <Text style={styles.storeResultName}>{store.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={12} color={COLORS.secondary} />
            <Text style={styles.storeMeta}>{store.rating}</Text>
            <Text style={styles.storeMeta}>· {store.time}</Text>
            <Text style={styles.storeMeta}>· {store.dist}</Text>
          </View>
          <View style={styles.tagRow}>
            {store.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagTxt}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.feeBadge, store.fee === 'Free' && styles.feeBadgeFree]}>
          <Text style={[styles.feeTxt, store.fee === 'Free' && styles.feeTxtFree]}>
            {store.fee === 'Free' ? 'Free' : store.fee}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const EmptyState = ({ query }) => {
  const bounce = useSharedValue(0);
  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 700, easing: Easing.inOut(Easing.sine) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sine) })
      ),
      -1,
      false
    );
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));
  return (
    <View style={styles.emptyWrap}>
      <Animated.Text style={[styles.emptyEmoji, s]}>📭</Animated.Text>
      <Text style={styles.emptyTitle}>No results for "{query}"</Text>
      <Text style={styles.emptySubt}>Try different keywords or check the spelling</Text>
    </View>
  );
};

const VoiceWave = () => {
  const bars = [
    useSharedValue(0.3),
    useSharedValue(0.6),
    useSharedValue(1),
    useSharedValue(0.6),
    useSharedValue(0.3),
  ];
  useEffect(() => {
    bars.forEach((b, i) => {
      b.value = withRepeat(
        withSequence(
          withTiming(1,   { duration: 300 + i * 80 }),
          withTiming(0.2, { duration: 300 + i * 80 })
        ),
        -1,
        true
      );
    });
  }, []);
  return (
    <View style={styles.waveWrap}>
      {bars.map((b, i) => {
        const s = useAnimatedStyle(() => ({ height: b.value * 28 + 6 }));
        return <Animated.View key={i} style={[styles.waveBar, s]} />;
      })}
    </View>
  );
};

const RecentRow = ({ item, index, onPress, onRemove }) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-12);
  useEffect(() => {
    opacity.value   = withDelay(index * 40, withTiming(1, { duration: ANIM.duration.normal }));
    translateX.value = withDelay(index * 40, withSpring(0, ANIM.spring));
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateX: translateX.value }] }));
  return (
    <Animated.View style={s}>
      <TouchableOpacity style={styles.recentRow} onPress={onPress}>
        <View style={styles.recentIconWrap}>
          <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
        </View>
        <Text style={styles.recentTxt}>{item}</Text>
        <TouchableOpacity onPress={onRemove} style={styles.recentRemove}>
          <Ionicons name="close" size={15} color={COLORS.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const TrendChip = ({ item, index, onPress }) => {
  const p = usePress();
  const opacity = useSharedValue(0);
  const scale0  = useSharedValue(0.88);
  useEffect(() => {
    opacity.value = withDelay(index * 45, withTiming(1, { duration: ANIM.duration.normal }));
    scale0.value  = withDelay(index * 45, withSpring(1, ANIM.spring));
  }, []);
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale0.value }],
  }));
  return (
    <Animated.View style={[p.animStyle, entranceStyle]}>
      <TouchableOpacity
        style={styles.trendChip}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        activeOpacity={1}
      >
        <Text style={styles.trendTxt}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function SearchScreen({ navigation }) {
  const [query, setQuery]       = useState('');
  const [tab, setTab]           = useState('items');
  const [loading, setLoading]   = useState(false);
  const [recents, setRecents]   = useState(RECENT);
  const [voiceActive, setVoice] = useState(false);
  const inputRef = useRef(null);

  const results  = filterItems(query, tab);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (hasQuery) {
      setLoading(true);
      const t = setTimeout(() => setLoading(false), 900);
      return () => clearTimeout(t);
    }
  }, [query]);

  const removeRecent = (r) => setRecents((p) => p.filter((x) => x !== r));

  const handleVoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVoice(true);
    setTimeout(() => {
      setVoice(false);
      setQuery('Fresh Strawberries');
    }, 2500);
  };

  // Animated tab indicator
  const tabIndicatorX = useSharedValue(0);
  const HALF = (W - SPACING.md * 2 - SPACING.sm) / 2;
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
  }));

  const switchTab = (t) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTab(t);
    tabIndicatorX.value = withSpring(t === 'items' ? 0 : HALF + SPACING.sm, ANIM.spring);
  };

  const itemCount  = PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.store.toLowerCase().includes(query.toLowerCase())).length;
  const storeCount = STORES.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.headerWrap}>
          {/* Back */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: SPACING.sm, bottom: SPACING.sm, left: SPACING.sm, right: SPACING.sm }}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          {/* Search bar */}
          <View style={[styles.searchBar, voiceActive && styles.searchBarActive]}>
            <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search anything…"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
              returnKeyType="search"
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Mic */}
          <TouchableOpacity
            onPress={handleVoice}
            style={[styles.micBtn, voiceActive && styles.micBtnActive]}
          >
            <Ionicons
              name={voiceActive ? 'mic' : 'mic-outline'}
              size={20}
              color={voiceActive ? COLORS.success : COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Voice listening bar */}
        {voiceActive && (
          <View style={styles.voiceBar}>
            <VoiceWave />
            <Text style={styles.voiceTxt}>Listening…</Text>
          </View>
        )}
      </SafeAreaView>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Body */}
      {!hasQuery ? (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          ListHeaderComponent={() => (
            <View style={styles.emptyScreenContent}>
              {/* Recent searches */}
              {recents.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle}>Recent</Text>
                    <TouchableOpacity onPress={() => setRecents([])}>
                      <Text style={styles.clearTxt}>Clear all</Text>
                    </TouchableOpacity>
                  </View>
                  {recents.map((r, i) => (
                    <RecentRow
                      key={r}
                      item={r}
                      index={i}
                      onPress={() => setQuery(r)}
                      onRemove={() => removeRecent(r)}
                    />
                  ))}
                </View>
              )}

              {/* Trending */}
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Trending Now</Text>
                  <Text style={styles.fireEmoji}>🔥</Text>
                </View>
                <View style={styles.trendingGrid}>
                  {TRENDING.map((t, i) => (
                    <TrendChip
                      key={t.label}
                      item={t}
                      index={i}
                      onPress={() => setQuery(t.label.split(' ')[0])}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {/* Segmented tab */}
          <View style={styles.tabTrack}>
            <Animated.View style={[styles.tabIndicator, { width: HALF }, indicatorStyle]} />
            {['items', 'stores'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, { width: HALF }]}
                onPress={() => switchTab(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
                  {t === 'items' ? `Items (${itemCount})` : `Stores (${storeCount})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.shimmerWrap}>
              {[1, 2, 3].map((i) => <ShimmerCard key={i} />)}
            </View>
          ) : results.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) =>
                tab === 'stores'
                  ? <StoreResult store={item} index={index} onPress={() => navigation.navigate('Store', { store: item })} />
                  : <ProductResult item={item} index={index} onPress={() => navigation.navigate('ItemDetail', { item })} />
              }
            />
          )}
        </View>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeTop: {
    backgroundColor: COLORS.bg,
  },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.bg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 0,
  },

  // Back button
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },

  // Search bar
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchBarActive: {
    borderColor: COLORS.borderStrong,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },

  // Mic button
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  micBtnActive: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },

  // Voice bar
  voiceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.successLight,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  waveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  waveBar: {
    width: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.success,
  },
  voiceTxt: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty screen
  emptyScreenContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  clearTxt: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  fireEmoji: {
    fontSize: 16,
  },

  // Recent row
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  recentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentTxt: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  recentRemove: {
    padding: SPACING.xs,
  },

  // Trending chips
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  trendChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  trendTxt: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },

  // Segmented tab
  tabTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xs,
    position: 'relative',
    height: 44,
  },
  tabIndicator: {
    position: 'absolute',
    left: SPACING.xs,
    top: SPACING.xs,
    bottom: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  tabBtn: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabTxt: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTxtActive: {
    color: COLORS.text,
  },

  // Results list
  resultsList: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xl,
  },

  // Product result row
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  resultImgWrap: {
    position: 'relative',
  },
  resultImg: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
  },
  discountBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  discountTxt: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '800',
  },
  resultInfo: {
    flex: 1,
    gap: 3,
  },
  resultName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  resultStore: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  resultRating: {
    color: COLORS.textSub,
    fontSize: 11,
    fontWeight: '600',
  },
  resultPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  origPrice: {
    color: COLORS.textMuted,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  price: {
    color: COLORS.textSub,
    fontSize: 15,
    fontWeight: '800',
  },

  // Store result row
  storeResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  storeLogo: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  storeResultInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  storeResultName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  storeMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: 2,
  },
  tag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  tagTxt: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  feeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  feeBadgeFree: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  feeTxt: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '700',
  },
  feeTxtFree: {
    color: COLORS.success,
  },

  // Shimmer
  shimmerWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  emptySubt: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});