import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
  FlatList, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/fonts';
import { useFavIcon } from '../context/FavIconContext';
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
  error:       '#C62828',
};
const SPACING = { xs: 4, sm: 8, md: 16, lg: 24 };
const RADIUS  = { sm: 8, md: 12, lg: 16, full: 999 };
const CARD_W  = (W - SPACING.md * 2 - SPACING.sm) / 2;

const formatPrice = (p) => `QAR ${p.toLocaleString()}`;

const FavCard = ({ item, onRemove, onAddToCart }) => (
  <View style={s.card}>
    <View style={s.imgWrap}>
      <Image source={{ uri: item.image }} style={s.img} />
      <TouchableOpacity style={s.removeBtn} onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Ionicons name="heart" size={15} color={COLORS.error} />
      </TouchableOpacity>
    </View>
    <View style={s.cardBody}>
      <Text style={s.name} numberOfLines={2}>{item.name}</Text>
      <Text style={s.price}>{formatPrice(item.price)}</Text>
      <TouchableOpacity style={s.addBtn} onPress={onAddToCart} activeOpacity={0.8}>
        <Ionicons name="add" size={18} color={COLORS.text} /> 
      </TouchableOpacity>
    </View>
  </View>
);

export default function FavoritesScreen() {
  const { favorites, toggleFavorite } = useFavIcon();
  const { addItem } = useCart();

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Favorites</Text>
        <Text style={s.sub}>
          {favorites.length > 0
            ? `${favorites.length} saved item${favorites.length !== 1 ? 's' : ''}`
            : 'Items you loved'}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="heart" size={48} color="#FCA5A5" />
          </View>
          <Text style={s.emptyTitle}>No favorites yet</Text>
          <Text style={s.emptySub}>
            Tap the heart icon on any product{'\n'}to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <FavCard
              item={item}
              onRemove={() => toggleFavorite(item, false)}
              onAddToCart={() => addItem(item)}
            />
          )}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 26, fontFamily: FONTS.bold, color: COLORS.text },
  sub:   { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 14, paddingBottom: 80,
  },
  emptyIconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontFamily: FONTS.semibold, color: '#475569' },
  emptySub: {
    fontSize: 14, fontFamily: FONTS.regular,
    color: '#94A3B8', textAlign: 'center', lineHeight: 22,
  },

  grid: { padding: SPACING.md, paddingBottom: 100 },
  row:  { gap: SPACING.sm, marginBottom: SPACING.sm },

  card: {
    width: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#3D2B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: CARD_W * 0.82, resizeMode: 'cover' },
  removeBtn: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    width: 28, height: 28, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(198,40,40,0.18)',
  },
  cardBody: { padding: SPACING.sm, gap: SPACING.xs },
  name:  { fontSize: 12, fontFamily: FONTS.semibold, color: COLORS.text, lineHeight: 17 },
  price: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.textSub },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.xs, marginTop: 2, marginLeft : "auto" ,
    position : "absolute", bottom : 5, right : 8
  },
  addBtnTxt: { fontSize: 11, fontFamily: FONTS.semibold, color: COLORS.text },
});
