import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  FlatList, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/fonts';
import { useCart } from '../context/CartContext';

const { width: W } = Dimensions.get('window');

const COLORS = {
  primary:     '#FFC107',
  primaryDark: '#FF8F00',
  bg:          '#FAF7F2',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F3EDE0',
  text:        '#1A0F00',
  textSub:     '#7A5C2E',
  textMuted:   '#B8975A',
  border:      '#E8DCC8',
  borderStrong:'#B8975A',
  dark:        '#3D2B00',
  success:     '#2E7D32',
  successLight:'#E8F5E9',
  error:       '#C62828',
  warning:     '#E65100',
};
const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
const RADIUS  = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };
const CARD_W  = (W - SPACING.md * 2 - SPACING.sm) / 2;

const formatPrice = (p) => `${p.toLocaleString()} QAR`;

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────────
const ProductCard = ({ item, onPress, onAdd }) => (
  <TouchableOpacity style={s.prodCard} onPress={onPress} activeOpacity={0.88}>
    <View style={s.prodImgWrap}>
      <Image source={{ uri: item.image }} style={s.prodImg} />
      {item.discount > 0 && (
        <View style={s.discBadge}>
          <Text style={s.discTxt}>-{item.discount}%</Text>
        </View>
      )}
    </View>
    <View style={s.prodBody}>
      <Text style={s.prodName} numberOfLines={2}>{item.name}</Text>
      <View style={s.prodPriceRow}>
        <Text style={s.prodPrice}>{formatPrice(item.price)}</Text>
        {item.originalPrice > item.price && (
          <Text style={s.prodOrig}>{formatPrice(item.originalPrice)}</Text>
        )}
      </View>
      {item.rating && (
        <View style={s.ratingRow}>
          <Ionicons name="star" size={11} color={COLORS.primary} />
          <Text style={s.ratingTxt}>{item.rating} · {item.reviews} reviews</Text>
        </View>
      )}
      <TouchableOpacity style={s.addBtn} onPress={() => onAdd(item)} activeOpacity={0.82}>
        <Ionicons name="add" size={16} color={COLORS.text} />
        {/* <Text style={s.addBtnTxt}>Add</Text> */}
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

// ─── STORE ROW ────────────────────────────────────────────────────────────────────
const StoreRow = ({ item, onPress }) => (
  <TouchableOpacity style={s.storeRow} onPress={onPress} activeOpacity={0.88}>
    <Image source={{ uri: item.logo }} style={s.storeLogo} />
    <View style={s.storeInfo}>
      <View style={s.storeNameRow}>
        <Text style={s.storeName}>{item.name}</Text>
        <View style={[s.statusDot, { backgroundColor: item.isOpen ? COLORS.success : COLORS.error }]} />
      </View>
      <View style={s.storeMeta}>
        <Ionicons name="star" size={11} color={COLORS.primary} />
        <Text style={s.storeMetaTxt}>{item.rating}</Text>
        <Text style={s.storeMetaSep}>·</Text>
        <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
        <Text style={s.storeMetaTxt}>{item.time}</Text>
        <Text style={s.storeMetaSep}>·</Text>
        <Text style={s.storeMetaTxt}>{item.dist}</Text>
      </View>
      {(item.tags || []).length > 0 && (
        <View style={s.tagRow}>
          {item.tags.map((t) => (
            <View key={t} style={s.tag}>
              <Text style={s.tagTxt}>{t}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
    <View style={[s.feeChip, { backgroundColor: item.fee === 'Free' ? COLORS.successLight : COLORS.surfaceAlt }]}>
      <Text style={[s.feeTxt, { color: item.fee === 'Free' ? COLORS.success : COLORS.textSub }]}>
        {item.fee === 'Free' ? 'Free' : item.fee}
      </Text>
    </View>
  </TouchableOpacity>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────────
export default function AllProductsScreen({ navigation, route }) {
  const { title = 'All Products', items = [], type = 'products' } = route.params || {};
  const [query, setQuery] = useState('');
  const { addItem } = useCart();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, query]);

  const renderProduct = ({ item }) => (
    <ProductCard
      item={item}
      onPress={() => navigation.navigate('ItemDetail', { item })}
      onAdd={(p) => addItem(p)}
    />
  );

  const renderStore = ({ item }) => (
    <StoreRow
      item={item}
      onPress={() => navigation.navigate('Store', { store: item })}
    />
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{title}</Text>
          <Text style={s.headerCount}>{filtered.length} {type === 'stores' ? 'markets' : 'items'}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Search bar ── */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${title.toLowerCase()}…`}
          placeholderTextColor={COLORS.textMuted + '99'}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="search-outline" size={48} color={COLORS.border} />
          <Text style={s.emptyTitle}>No results for "{query}"</Text>
          <Text style={s.emptySub}>Try a different keyword</Text>
        </View>
      ) : type === 'stores' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderStore}
          contentContainerStyle={s.storeList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={s.separator} />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderProduct}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg , marginBottom : -50 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text },
  headerCount: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: FONTS.regular,
    color: COLORS.text, padding: 0,
  },

  // Empty
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingBottom: 80,
  },
  emptyTitle: { fontSize: 16, fontFamily: FONTS.semibold, color: COLORS.textSub },
  emptySub:   { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted },

  // Product grid
  grid: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  row:  { gap: SPACING.sm, marginBottom: SPACING.sm },

  prodCard: {
    width: CARD_W, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: COLORS.dark, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  prodImgWrap: { position: 'relative' },
  prodImg: { width: '100%', height: CARD_W * 0.82, resizeMode: 'cover' },
  discBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm,
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.xs + 2, paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  discTxt: { color: COLORS.surface, fontSize: 10, fontFamily: FONTS.bold },
  prodBody: { padding: SPACING.sm, gap: SPACING.xs },
  prodName: { fontSize: 12, fontFamily: FONTS.semibold, color: COLORS.text, lineHeight: 17 },
  prodPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: SPACING.xs },
  prodPrice: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.textSub },
  prodOrig: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTxt: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    alignSelf: 'flex-start', paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full, backgroundColor: COLORS.primary, marginTop: 2, marginLeft : "auto" ,
    position : "absolute", bottom : 5, right : 8
  },
  addBtnTxt: { fontSize: 11, fontFamily: FONTS.semibold, color: COLORS.text },

  // Store list
  storeList: { paddingHorizontal: SPACING.md, paddingBottom: 100, paddingTop: SPACING.xs },
  separator: { height: 1, backgroundColor: COLORS.border },
  storeRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingVertical: SPACING.md, backgroundColor: COLORS.surface,
  },
  storeLogo: {
    width: 56, height: 56, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  storeInfo: { flex: 1, gap: 4 },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  storeName: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text },
  statusDot: { width: 7, height: 7, borderRadius: RADIUS.full },
  storeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storeMetaTxt: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted },
  storeMetaSep: { color: COLORS.border, fontSize: 12 },
  tagRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  tag: {
    paddingHorizontal: SPACING.sm, paddingVertical: 2,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tagTxt: { fontSize: 10, fontFamily: FONTS.medium, color: COLORS.textSub },
  feeChip: {
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
  },
  feeTxt: { fontSize: 11, fontFamily: FONTS.semibold },
});
