import 'react-native-gesture-handler';
import React, { useEffect, useRef, useCallback } from 'react';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { FONTS } from './constants/fonts';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { CartProvider, useCart } from './context/CartContext';
import { FavIconProvider, useFavIcon } from './context/FavIconContext';

// ─── SCREENS ────────────────────────────────────────────────────────────────────
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import CategoryScreen from './screens/CategoryScreen';
import StoreScreen from './screens/StoreScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';
import SearchScreen from './screens/SearchScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import OrdersScreen from './screens/OrdersScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';
import ProfileScreen from './screens/ProfileScreen';
import WalletScreen from './screens/WalletScreen';
import LoyaltyScreen from './screens/LoyaltyScreen';
import AllProductsScreen from './screens/AllProductsScreen';

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

const { width: W } = Dimensions.get('window');

// ─── NAVIGATION THEME ───────────────────────────────────────────────────────────
const NavTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary:    COLORS.primary,
    background: COLORS.bg,
    card:       COLORS.surface,
    text:       COLORS.text,
    border:     'transparent',
  },
};

// ─── STACKS ─────────────────────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Home"        component={HomeScreen}        />
    <Stack.Screen name="Search"      component={SearchScreen}      />
    <Stack.Screen name="Category"    component={CategoryScreen}    />
    <Stack.Screen name="Store"       component={StoreScreen}       />
    <Stack.Screen name="ItemDetail"  component={ItemDetailScreen}  />
    <Stack.Screen name="AllProducts" component={AllProductsScreen} />
  </Stack.Navigator>
);

const FavoritesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
    <Stack.Screen name="Favorites" component={FavoritesScreen} />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
    <Stack.Screen name="Cart"     component={CartScreen}     />
    <Stack.Screen name="Checkout" component={CheckoutScreen} />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Orders"        component={OrdersScreen}        />
    <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Wallet"  component={WalletScreen}  />
    <Stack.Screen name="Loyalty" component={LoyaltyScreen} />
  </Stack.Navigator>
);

// ─── TAB CONFIG ─────────────────────────────────────────────────────────────────
const TAB_ITEMS = [
  { name: 'HomeTab',      icon: 'home',            label: 'Home'      },
  { name: 'FavoritesTab', icon: 'heart',           label: 'Saved',    isFav: true  },
  { name: 'CartTab',      icon: 'cart',            label: 'Cart',     isCart: true },
  { name: 'OrdersTab',    icon: 'receipt-outline', label: 'Orders'   },
  { name: 'ProfileTab',   icon: 'person',          label: 'Profile'  },
];

// ─── REGULAR TAB ITEM ────────────────────────────────────────────────────────────
const TabItem = ({
  item, isFocused, onPress, badgeCount,
  tabRef, onTabLayout,
}) => {
  const scale      = useSharedValue(isFocused ? 1 : 1);
  const indicatorW = useSharedValue(isFocused ? 24 : 0);
  const iconY      = useSharedValue(isFocused ? -2 : 0);
  const labelOp    = useSharedValue(isFocused ? 1 : 0.55);

  useEffect(() => {
    scale.value      = withSpring(isFocused ? 1.18 : 1, ANIM.springFast);
    indicatorW.value = withSpring(isFocused ? 24 : 0, ANIM.spring);
    iconY.value      = withTiming(isFocused ? -2 : 0, { duration: ANIM.duration.normal });
    labelOp.value    = withTiming(isFocused ? 1 : 0.45, { duration: ANIM.duration.normal });
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: iconY.value }],
  }));
  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorW.value,
    opacity: isFocused ? 1 : 0,
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOp.value,
  }));

  const activeColor = item.isFav
    ? COLORS.error
    : COLORS.secondaryDark;

  const iconColor  = isFocused ? activeColor : COLORS.textMuted;
  const base       = item.icon.replace(/-outline$/, '');
  const iconName   = isFocused ? base : `${base}-outline`;

  return (
    <TouchableOpacity
      ref={tabRef}
      onLayout={onTabLayout}
      onPress={onPress}
      style={s.tabItem}
      activeOpacity={0.75}
    >
      {/* Active indicator pill above icon */}
      <Animated.View style={[s.activeIndicator, indicatorStyle, {
        backgroundColor: item.isFav ? COLORS.error : COLORS.primary,
      }]} />

      <View style={s.iconWrap}>
        <Animated.View style={iconStyle}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </Animated.View>
        {badgeCount > 0 && (
          <View style={[s.badgeDot, {
            backgroundColor: item.isFav ? COLORS.error : COLORS.warning,
          }]}>
            <Text style={s.badgeDotTxt}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
      </View>

      <Animated.Text
        style={[
          s.tabLabel,
          { color: isFocused ? activeColor : COLORS.textMuted },
          labelStyle,
        ]}
      >
        {item.label}
      </Animated.Text>
    </TouchableOpacity>
  );
};

// ─── CART CENTER BUTTON ──────────────────────────────────────────────────────────
const CartTabItem = ({ isFocused, onPress, badgeCount, cartRef, onCartLayout }) => {
  const scale    = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isFocused) {
      scale.value    = withSequence(
        withSpring(1.12, ANIM.springFast),
        withSpring(1, ANIM.spring)
      );
      rotation.value = withSequence(
        withTiming(-8, { duration: 100 }),
        withTiming(8,  { duration: 100 }),
        withTiming(0,  { duration: 100 })
      );
    } else {
      scale.value = withSpring(1, ANIM.spring);
    }
  }, [isFocused]);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <TouchableOpacity
      ref={cartRef}
      onLayout={onCartLayout}
      onPress={onPress}
      style={s.cartBtnWrap}
      activeOpacity={0.88}
    >
      <Animated.View style={btnStyle}>
        {/* Outer ring — warm glow */}
        <View style={[
          s.cartRing,
          { borderColor: isFocused ? COLORS.primary : COLORS.border },
        ]}>
          <LinearGradient
            colors={isFocused
              ? [COLORS.primary, COLORS.primaryDark]
              : [COLORS.surfaceAlt, COLORS.secondaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.cartBtnGrad}
          >
            <Ionicons
              name="cart"
              size={26}
              color={isFocused ? COLORS.text : COLORS.textMuted}
            />
          </LinearGradient>
        </View>

        {badgeCount > 0 && (
          <View style={s.cartBadge}>
            <Text style={s.cartBadgeTxt}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
      </Animated.View>

      <Text style={[
        s.tabLabel,
        { color: isFocused ? COLORS.secondaryDark : COLORS.textMuted, marginTop: SPACING.xs },
      ]}>
        Cart
      </Text>
    </TouchableOpacity>
  );
};

// ─── CUSTOM TAB BAR ─────────────────────────────────────────────────────────────
const CustomTabBar = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { favoriteCount, favIconPos, cartTabPos } = useFavIcon();
  const { totalItems } = useCart();
  const favTabRef  = useRef(null);
  const cartTabRef = useRef(null);

  const measureFavTab = useCallback(() => {
    favTabRef.current?.measure((_, __, w, h, px, py) => {
      favIconPos.current = { x: px + w / 2, y: py + h / 2 };
    });
  }, [favIconPos]);

  const measureCartTab = useCallback(() => {
    cartTabRef.current?.measure((_, __, w, h, px, py) => {
      cartTabPos.current = { x: px + w / 2, y: py + h / 2 };
    });
  }, [cartTabPos]);

  return (
    <View style={[s.tabBar, { paddingBottom: insets.bottom + SPACING.xs }]}>
      {/* Subtle top border line */}
      <View style={s.tabBorderLine} />

      {TAB_ITEMS.map((item, idx) => {
        const isFocused = state.index === idx;
        const onPress   = () => navigation.navigate(item.name);

        if (item.isCart) {
          return (
            <CartTabItem
              key={item.name}
              isFocused={isFocused}
              onPress={onPress}
              badgeCount={totalItems}
              cartRef={cartTabRef}
              onCartLayout={measureCartTab}
            />
          );
        }

        return (
          <TabItem
            key={item.name}
            item={item}
            isFocused={isFocused}
            onPress={onPress}
            badgeCount={item.isFav ? favoriteCount : 0}
            tabRef={item.isFav ? favTabRef : undefined}
            onTabLayout={item.isFav ? measureFavTab : undefined}
          />
        );
      })}
    </View>
  );
};

// ─── MAIN TABS ──────────────────────────────────────────────────────────────────
const MainTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="HomeTab"      component={HomeStack}      />
    <Tab.Screen name="FavoritesTab" component={FavoritesStack} />
    <Tab.Screen name="CartTab"      component={CartStack}      />
    <Tab.Screen name="OrdersTab"    component={OrdersStack}    />
    <Tab.Screen name="ProfileTab"   component={ProfileStack}   />
  </Tab.Navigator>
);

// ─── ROOT NAVIGATOR ──────────────────────────────────────────────────────────────
const RootNavigator = () => (
  <Stack.Navigator
    initialRouteName="Splash"
    screenOptions={{ headerShown: false, animation: 'fade' }}
  >
    <Stack.Screen name="Splash"     component={SplashScreen}     />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="Auth"       component={AuthScreen}       />
    <Stack.Screen name="MainTabs"   component={MainTabs}
      options={{ animation: 'fade' }}
    />
  </Stack.Navigator>
);

// ─── APP ROOT ───────────────────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CartProvider>
          <FavIconProvider>
            <NavigationContainer theme={NavTheme}>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </FavIconProvider>
        </CartProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  tabBar: {
    flexDirection:    'row',
    alignItems:       'flex-end',
    backgroundColor:  COLORS.surface,
    paddingTop:       SPACING.sm,
    paddingHorizontal: SPACING.xs,
    // Crisp card-like elevation
    shadowColor:      COLORS.dark,
    shadowOffset:     { width: 0, height: -4 },
    shadowOpacity:    0.07,
    shadowRadius:     16,
    elevation:        16,
    minHeight:        Platform.OS === 'ios' ? 86 : 66,
  },

  tabBorderLine: {
    position:        'absolute',
    top:             0,
    left:            SPACING.xl,
    right:           SPACING.xl,
    height:          1,
    backgroundColor: COLORS.border,
    opacity:         0.6,
  },

  // ─── Regular tab item ───
  tabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-end',
    paddingBottom:  SPACING.xs,
    gap:            SPACING.xs,
  },

  activeIndicator: {
    height:       3,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
    // width is animated
  },

  iconWrap: {
    position:       'relative',
    alignItems:     'center',
    justifyContent: 'center',
  },

  badgeDot: {
    position:        'absolute',
    top:             -5,
    right:           -8,
    minWidth:        17,
    height:          17,
    borderRadius:    RADIUS.full,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: SPACING.xs,
    borderWidth:     1.5,
    borderColor:     COLORS.surface,
  },
  badgeDotTxt: {
    color:      COLORS.surface,
    fontSize:   9,
    fontFamily: FONTS.extrabold,
    lineHeight: 12,
  },

  tabLabel: {
    fontSize:   10,
    fontFamily: FONTS.semibold,
    letterSpacing: 0.2,
  },

  // ─── Cart center button ───
  cartBtnWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-end',
    marginTop:      -SPACING.xl,        // lifts the button above the bar
    paddingBottom:  SPACING.xs,
  },

  cartRing: {
    width:        62,
    height:       62,
    borderRadius: RADIUS.full,
    borderWidth:  2.5,
    padding:      2,
    // shadow lives on the ring view
    shadowColor:  COLORS.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation:    10,
    backgroundColor: COLORS.surface,
  },

  cartBtnGrad: {
    flex:           1,
    borderRadius:   RADIUS.full,
    alignItems:     'center',
    justifyContent: 'center',
  },

  cartBadge: {
    position:        'absolute',
    top:             0,
    right:           0,
    minWidth:        19,
    height:          19,
    borderRadius:    RADIUS.full,
    backgroundColor: COLORS.error,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: SPACING.xs,
    borderWidth:     2,
    borderColor:     COLORS.surface,
  },
  cartBadgeTxt: {
    color:      COLORS.surface,
    fontSize:   9,
    fontFamily: FONTS.extrabold,
    lineHeight: 13,
  },
});