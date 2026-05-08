# ⚡ Swift — Fast Delivery App

A stunning multi-vendor delivery super-app built with React Native + Expo.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npx expo start

# 3. Scan QR code with Expo Go app (iOS/Android)
#    or press 'a' for Android emulator / 'i' for iOS simulator
```

## Fresh Setup (from scratch)

```bash
npx create-expo-app@latest SwiftDelivery --template blank
cd SwiftDelivery
npx expo install \
  @react-navigation/native@^6.1.17 \
  @react-navigation/native-stack@^6.9.26 \
  @react-navigation/bottom-tabs@^6.5.20 \
  react-native-reanimated@~3.10.1 \
  react-native-gesture-handler@~2.16.1 \
  expo-linear-gradient@~13.0.2 \
  expo-blur@~13.0.2 \
  expo-haptics@~13.0.1 \
  expo-font@~12.0.9 \
  expo-splash-screen@~0.27.5 \
  expo-status-bar@~1.12.1 \
  @expo/vector-icons@^14.0.2 \
  react-native-safe-area-context@4.10.1 \
  react-native-screens@3.31.1 \
  react-native-svg@15.2.0 \
  @shopify/flash-list@1.6.4
```

## Features

- 🎨 **Dark-first premium UI** with animated transitions and glassmorphism
- 🛒 **Full e-commerce flow**: browse → cart → checkout → real-time tracking
- ⚡ **60fps animations** powered by React Native Reanimated 3
- 🏪 **Multi-vendor marketplace**: grocery, food, pharmacy, electronics, fashion
- 💰 **Loyalty points, wallet, cashback, coupons** system
- 📍 **Location-aware** store listing with distance & ETA
- 🌙 **Dark mode** premium design (deep navy + emerald green)
- 🎯 **Press animations** on every interactive element
- ✨ **Shimmer skeleton** loading states on all screens
- 🎊 **Confetti burst** on add-to-cart
- 🔥 **Flash sale countdown** timer

## Screens (15 fully animated)

| Screen | Description |
|--------|-------------|
| `SplashScreen` | Animated logo reveal with particles |
| `OnboardingScreen` | 3-slide swipeable intro |
| `AuthScreen` | Login / Register with glassmorphism |
| `HomeScreen` | Hero with banners, categories, flash sale |
| `CategoryScreen` | Filtered store listing |
| `StoreScreen` | Store detail with sticky header |
| `ItemDetailScreen` | Product gallery + add to cart |
| `SearchScreen` | Real-time search with skeleton |
| `CartScreen` | Swipe-to-delete cart items |
| `CheckoutScreen` | 3-step checkout with success animation |
| `OrdersScreen` | Active & past orders |
| `OrderTrackingScreen` | Live tracking with animated rider |
| `ProfileScreen` | User profile with stats |
| `WalletScreen` | Balance + transaction history |
| `LoyaltyScreen` | Points, tiers, rewards |

## Tech Stack

- **React Native** 0.74 + **Expo** ~51
- **React Navigation** v6 (Stack + Bottom Tabs)
- **Reanimated** 3 — all animations
- **FlashList** — high-performance lists
- **LinearGradient** + **BlurView** — premium visual effects

## Brand Colors

| Token | Color | Use |
|-------|-------|-----|
| Primary | `#00C37B` | Buttons, active states, icons |
| Secondary | `#FF6B35` | CTAs, urgency, flash sale |
| Dark BG | `#0A0F1E` | Screen backgrounds |
| Surface | `#111827` | Cards, inputs |
| Gold | `#FFD700` | Loyalty, premium |
