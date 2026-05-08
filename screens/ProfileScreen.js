import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Switch, Dimensions, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withDelay, interpolate, Extrapolation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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

const { width: W, height: H } = Dimensions.get('window');

// ─── FAKE DATA ────────────────────────────────────────────────────────────────────
const USER = {
  name: 'Ahmed El-Sayed',
  email: 'ahmed.elsayed@gmail.com',
  phone: '+20 10 9876 5432',
  avatar: 'https://ui-avatars.com/api/?name=Ahmed+El-Sayed&background=3D2B00&color=FFF8E1&size=256',
  loyaltyTier: 'Gold',
  points: 4850,
  totalOrders: 47,
  walletBalance: 1250,
  memberSince: 'Jan 2024',
};

const TIER_COLORS = {
  Bronze: [['#CD7F32', '#A0522D'], COLORS.warningLight],
  Silver: [['#9E9E9E', '#757575'], COLORS.surfaceAlt],
  Gold: [['#B8975A', '#7A5C2E'], COLORS.primaryLight],
  Platinum: [['#5C3D00', '#3D2B00'], COLORS.secondaryLight],
};

// ─── SHEET CONFIGS — every action maps to a sheet definition ─────────────────────
const SHEET_DEFS = {
  EditProfile: {
    title: 'Edit Profile',
    icon: 'person-outline',
    accentColor: COLORS.success,
    fields: [
      { key: 'name', label: 'Full Name', icon: 'person-outline', placeholder: 'Ahmed El-Sayed', initialValue: USER.name, keyboard: 'default' },
      { key: 'email', label: 'Email', icon: 'mail-outline', placeholder: 'ahmed@gmail.com', initialValue: USER.email, keyboard: 'email-address' },
      { key: 'phone', label: 'Phone Number', icon: 'call-outline', placeholder: '+20 10 0000 0000', initialValue: USER.phone, keyboard: 'phone-pad' },
    ],
    cta: 'Save Changes',
    ctaIcon: 'checkmark-circle-outline',
  },
  Addresses: {
    title: 'Saved Addresses',
    icon: 'location-outline',
    accentColor: COLORS.info,
    addresses: [
      { id: 'A1', label: 'Home', icon: 'home-outline', address: '12 Nile Corniche, Cairo 11511', isDefault: true },
      { id: 'A2', label: 'Work', icon: 'briefcase-outline', address: '45 Tahrir Square, Cairo 11511', isDefault: false },
    ],
    fields: [
      { key: 'label', label: 'Label (Home / Work)', icon: 'bookmark-outline', placeholder: 'e.g. Home', keyboard: 'default' },
      { key: 'street', label: 'Street Address', icon: 'location-outline', placeholder: '12 Nile Corniche', keyboard: 'default' },
      { key: 'city', label: 'City', icon: 'business-outline', placeholder: 'Cairo', keyboard: 'default' },
      { key: 'zip', label: 'Postal Code', icon: 'map-outline', placeholder: '11511', keyboard: 'numeric' },
    ],
    cta: 'Add Address',
    ctaIcon: 'add-circle-outline',
  },
  Payments: {
    title: 'Payment Methods',
    icon: 'card-outline',
    accentColor: COLORS.secondaryDark,
    cards: [
      { id: 'C1', brand: 'Visa', last4: '4321', expiry: '08/27', isDefault: true },
      { id: 'C2', brand: 'Mastercard', last4: '9988', expiry: '03/26', isDefault: false },
    ],
    fields: [
      { key: 'number', label: 'Card Number', icon: 'card-outline', placeholder: '•••• •••• •••• ••••', keyboard: 'numeric' },
      { key: 'name', label: 'Name on Card', icon: 'person-outline', placeholder: 'Ahmed El-Sayed', keyboard: 'default' },
      { key: 'expiry', label: 'Expiry', icon: 'calendar-outline', placeholder: 'MM / YY', keyboard: 'numeric' },
      { key: 'cvv', label: 'CVV', icon: 'lock-closed-outline', placeholder: '•••', keyboard: 'numeric', secure: true },
    ],
    cta: 'Add Card',
    ctaIcon: 'add-circle-outline',
  },
  WalletScreen: {
    title: 'My Wallet',
    icon: 'wallet-outline',
    accentColor: COLORS.warning,
    walletBalance: USER.walletBalance,
    topUpAmounts: [100, 200, 500, 1000],
    fields: [],
    cta: 'Top Up',
    ctaIcon: 'add-circle-outline',
    isWallet: true,
  },
  LoyaltyScreen: {
    title: 'Loyalty Points',
    icon: 'trophy-outline',
    accentColor: COLORS.secondaryDark,
    isLoyalty: true,
    points: USER.points,
    tier: USER.loyaltyTier,
    rewards: [
      { id: 'R1', label: '10% Off Next Order', cost: 500, icon: 'pricetag-outline' },
      { id: 'R2', label: 'Free Delivery × 3', cost: 750, icon: 'bicycle-outline' },
      { id: 'R3', label: 'QAR 25 Wallet Credit', cost: 1000, icon: 'wallet-outline' },
      { id: 'R4', label: 'VIP Early Access', cost: 2000, icon: 'star-outline' },
    ],
    fields: [],
    cta: 'Redeem',
    ctaIcon: 'gift-outline',
  },
  Referral: {
    title: 'Referral Program',
    icon: 'gift-outline',
    accentColor: COLORS.error,
    isReferral: true,
    code: 'AHMED2024',
    perks: ['Earn QAR 20 per friend who orders', 'Your friend gets QAR 10 off first order', 'No limit on referrals'],
    fields: [],
    cta: 'Share Code',
    ctaIcon: 'share-social-outline',
  },
  Notifications: {
    title: 'Notifications',
    icon: 'notifications-outline',
    accentColor: COLORS.warning,
    isToggles: true,
    toggles: [
      { key: 'orders', label: 'Order Updates', sub: 'Status changes & delivery alerts', icon: 'receipt-outline', defaultOn: true },
      { key: 'promos', label: 'Promotions & Deals', sub: 'Exclusive offers & discounts', icon: 'pricetag-outline', defaultOn: true },
      { key: 'loyalty', label: 'Loyalty Rewards', sub: 'Point milestones & tier changes', icon: 'trophy-outline', defaultOn: false },
      { key: 'chat', label: 'Support Messages', sub: 'Replies from our team', icon: 'chatbubble-outline', defaultOn: true },
    ],
    fields: [],
    cta: 'Save Preferences',
    ctaIcon: 'checkmark-circle-outline',
  },
  Language: {
    title: 'Language',
    icon: 'language-outline',
    accentColor: COLORS.info,
    isLanguage: true,
    languages: [
      { code: 'en', label: 'English', native: 'English', flag: '🇬🇧', selected: true },
      { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦', selected: false },
      { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷', selected: false },
    ],
    fields: [],
    cta: 'Apply Language',
    ctaIcon: 'checkmark-circle-outline',
  },
  Privacy: {
    title: 'Privacy & Security',
    icon: 'shield-checkmark-outline',
    accentColor: COLORS.textSub,
    isToggles: true,
    toggles: [
      { key: 'biometric', label: 'Biometric Login', sub: 'Face ID / fingerprint unlock', icon: 'finger-print-outline', defaultOn: true },
      { key: 'twofactor', label: 'Two-Factor Auth', sub: 'Extra security on sign in', icon: 'shield-outline', defaultOn: false },
      { key: 'location', label: 'Location Access', sub: 'Used for address & delivery', icon: 'location-outline', defaultOn: true },
      { key: 'analytics', label: 'Usage Analytics', sub: 'Help us improve the app', icon: 'bar-chart-outline', defaultOn: false },
    ],
    changePassword: true,
    fields: [
      { key: 'current', label: 'Current Password', icon: 'lock-closed-outline', placeholder: '••••••••', keyboard: 'default', secure: true },
      { key: 'new', label: 'New Password', icon: 'lock-open-outline', placeholder: '••••••••', keyboard: 'default', secure: true },
      { key: 'confirm', label: 'Confirm Password', icon: 'lock-closed-outline', placeholder: '••••••••', keyboard: 'default', secure: true },
    ],
    cta: 'Update Password',
    ctaIcon: 'checkmark-circle-outline',
  },
  Help: {
    title: 'Help Center',
    icon: 'help-circle-outline',
    accentColor: COLORS.textMuted,
    isHelp: true,
    faqs: [
      { q: 'How do I track my order?', a: 'Go to Orders → select your order → tap Track. Live GPS updates refresh every 30 seconds.' },
      { q: 'Can I cancel after placing?', a: "Yes, within 2 minutes of placing. After that contact Live Chat and we'll try to help." },
      { q: 'How do loyalty points work?', a: 'Earn 1 pt per QAR 1 spent. Redeem from Profile → Loyalty Points.' },
      { q: 'What payment methods are accepted?', a: 'Visa, Mastercard, Quick Wallet, and Cash on Delivery.' },
    ],
    fields: [],
    cta: 'Contact Support',
    ctaIcon: 'mail-outline',
  },
  Chat: {
    title: 'Live Chat',
    icon: 'chatbubble-ellipses-outline',
    accentColor: COLORS.success,
    isChat: true,
    agentName: 'Nour — Support',
    agentStatus: 'Online now',
    messages: [{ id: 'M1', from: 'agent', text: 'Hi Ahmed! How can I help you today? 👋', time: '10:02 AM' }],
    fields: [{ key: 'message', label: 'Message', icon: 'chatbubble-outline', placeholder: 'Type your message…', keyboard: 'default' }],
    cta: 'Send Message',
    ctaIcon: 'send-outline',
  },
  Rate: {
    title: 'Rate the App',
    icon: 'star-outline',
    accentColor: COLORS.secondaryDark,
    isRating: true,
    fields: [{ key: 'review', label: 'Write a Review', icon: 'create-outline', placeholder: 'Tell us what you think…', keyboard: 'default', multiline: true }],
    cta: 'Submit Review',
    ctaIcon: 'send-outline',
  },
};

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline', label: 'Edit Profile', sheetKey: 'EditProfile', accent: COLORS.success },
      { icon: 'location-outline', label: 'Saved Addresses', sheetKey: 'Addresses', accent: COLORS.info },
      { icon: 'card-outline', label: 'Payment Methods', sheetKey: 'Payments', accent: COLORS.secondaryDark },
    ],
  },
  {
    title: 'Rewards',
    items: [
      { icon: 'wallet-outline', label: 'My Wallet', sheetKey: 'WalletScreen', navTarget: 'Wallet', badge: `QAR ${USER.walletBalance.toLocaleString()}`, accent: COLORS.warning },
      { icon: 'trophy-outline', label: 'Loyalty Points', sheetKey: 'LoyaltyScreen', navTarget: 'Loyalty', badge: `${USER.points.toLocaleString()} pts`, accent: COLORS.secondaryDark },
      { icon: 'gift-outline', label: 'Referral Program', sheetKey: 'Referral', accent: COLORS.error },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'notifications-outline', label: 'Notifications', sheetKey: 'Notifications', accent: COLORS.warning },
      { icon: 'language-outline', label: 'Language', sheetKey: 'Language', value: 'English', accent: COLORS.info },
      { icon: 'shield-checkmark-outline', label: 'Privacy & Security', sheetKey: 'Privacy', accent: COLORS.textSub },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: 'help-circle-outline', label: 'Help Center', sheetKey: 'Help', accent: COLORS.textMuted },
      { icon: 'chatbubble-ellipses-outline', label: 'Live Chat', sheetKey: 'Chat', accent: COLORS.success },
      { icon: 'star-outline', label: 'Rate the App', sheetKey: 'Rate', accent: COLORS.secondaryDark },
    ],
  },
];

// ─── usePress HOOK ────────────────────────────────────────────────────────────────
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

// ─── FORM FIELD ───────────────────────────────────────────────────────────────────
const FormField = ({ field, value, onChange, isLast }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[ff.wrap, !isLast && ff.border]}>
      <View style={ff.iconWrap}>
        <Ionicons name={field.icon} size={16} color={focused ? COLORS.secondaryDark : COLORS.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ff.label}>{field.label}</Text>
        <TextInput style={[ff.input, field.multiline && ff.multilineInput]} value={value} onChangeText={onChange} placeholder={field.placeholder} placeholderTextColor={COLORS.textMuted} keyboardType={field.keyboard || 'default'} secureTextEntry={field.secure || false} multiline={field.multiline || false} numberOfLines={field.multiline ? 3 : 1} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      </View>
    </View>
  );
};

// ─── GENERIC BOTTOM SHEET ─────────────────────────────────────────────────────────
const ActionSheet = ({ sheetKey, onClose }) => {
  const def = SHEET_DEFS[sheetKey];
  const translateY = useSharedValue(H);
  const backdropOp = useSharedValue(0);

  // Form state
  const initValues = {};
  (def?.fields || []).forEach(f => {
    initValues[f.key] = f.initialValue || '';
  });
  const [formValues, setFormValues] = useState(initValues);

  // Wallet top-up
  const [selectedTopUp, setSelectedTopUp] = useState(null);

  // Loyalty reward selection
  const [selectedReward, setSelectedReward] = useState(null);

  // Language selection
  const [selectedLang, setSelectedLang] = useState(def?.isLanguage ? def.languages.find(l => l.selected)?.code : null);

  // Toggle states
  const initToggles = {};
  (def?.toggles || []).forEach(t => {
    initToggles[t.key] = t.defaultOn;
  });
  const [toggleValues, setToggleValues] = useState(initToggles);

  // Star rating
  const [starRating, setStarRating] = useState(0);

  // Chat messages
  const [chatMessages, setChatMessages] = useState(def?.isChat ? def.messages : []);

  // FAQ open state
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    translateY.value = withSpring(0, ANIM.springSlow);
    backdropOp.value = withTiming(1, { duration: ANIM.duration.normal });
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));

  const close = () => {
    translateY.value = withTiming(H, { duration: ANIM.duration.normal });
    backdropOp.value = withTiming(0, { duration: ANIM.duration.fast });
    setTimeout(onClose, ANIM.duration.normal);
  };

  const handleCta = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    close();
  };

  if (!def) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='box-none'>
      <Animated.View style={[sh.backdrop, backdropStyle]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={close} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[sh.sheet, sheetStyle]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Handle */}
          <View style={sh.handle} />

          {/* Sheet header */}
          <View style={sh.headerRow}>
            <View style={[sh.sheetIconBox, { backgroundColor: def.accentColor + '18' }]}>
              <Ionicons name={def.icon} size={20} color={def.accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={sh.sheetTitle}>{def.title}</Text>
            </View>
            <TouchableOpacity style={sh.closeBtn} onPress={close}>
              <Ionicons name='close' size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xxl }} keyboardShouldPersistTaps='handled'>
            {/* ── WALLET ──────────────────────────────────────────── */}
            {def.isWallet && (
              <View style={sh.section}>
                <View style={sh.walletBalanceBox}>
                  <LinearGradient colors={['#1C1A10', '#2A2418', '#33291C']} style={sh.walletGrad}>
                    <Text style={sh.walletLabel}>Current Balance</Text>
                    <Text style={sh.walletAmt}>QAR {def.walletBalance.toLocaleString()}</Text>
                    <View style={sh.walletPill}>
                      <Ionicons name='flash' size={11} color={COLORS.primary} />
                      <Text style={sh.walletPillTxt}>Quick Wallet · Gold Tier</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={sh.subLabel}>Select Top-Up Amount</Text>
                <View style={sh.topUpGrid}>
                  {def.topUpAmounts.map(amt => (
                    <TouchableOpacity
                      key={amt}
                      style={[sh.topUpBtn, selectedTopUp === amt && sh.topUpBtnSelected]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedTopUp(amt);
                      }}
                      activeOpacity={0.8}>
                      {selectedTopUp === amt && (
                        <View style={sh.topUpCheck}>
                          <Ionicons name='checkmark' size={9} color={COLORS.text} />
                        </View>
                      )}
                      <Text style={[sh.topUpAmt, selectedTopUp === amt && sh.topUpAmtSelected]}>QAR {amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* ── LOYALTY ─────────────────────────────────────────── */}
            {def.isLoyalty && (
              <View style={sh.section}>
                <View style={sh.loyaltyHero}>
                  <LinearGradient colors={['#1C1A10', '#2A2418']} style={sh.loyaltyGrad}>
                    <Ionicons name='trophy' size={28} color={COLORS.primary} />
                    <Text style={sh.loyaltyPts}>{def.points.toLocaleString()}</Text>
                    <Text style={sh.loyaltyPtsLabel}>Points Available</Text>
                    <View style={sh.walletPill}>
                      <Ionicons name='star' size={11} color={COLORS.primary} />
                      <Text style={sh.walletPillTxt}>{def.tier} Tier</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Text style={sh.subLabel}>Redeem a Reward</Text>
                {def.rewards.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[sh.rewardRow, selectedReward === r.id && sh.rewardRowSelected]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedReward(r.id);
                    }}
                    activeOpacity={0.85}>
                    <View style={[sh.rewardIconBox, { backgroundColor: COLORS.primaryLight }]}>
                      <Ionicons name={r.icon} size={18} color={COLORS.secondaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={sh.rewardLabel}>{r.label}</Text>
                      <Text style={sh.rewardCost}>{r.cost.toLocaleString()} pts required</Text>
                    </View>
                    {selectedReward === r.id ? <Ionicons name='checkmark-circle' size={20} color={COLORS.success} /> : <Ionicons name='chevron-forward' size={15} color={COLORS.border} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── REFERRAL ─────────────────────────────────────────── */}
            {def.isReferral && (
              <View style={sh.section}>
                <View style={sh.referralBox}>
                  <LinearGradient colors={['#1C1A10', '#2A2418']} style={sh.referralGrad}>
                    <Ionicons name='gift' size={28} color={COLORS.error} style={{ marginBottom: SPACING.sm }} />
                    <Text style={sh.referralCode}>{def.code}</Text>
                    <Text style={sh.referralCodeLabel}>Your Referral Code</Text>
                  </LinearGradient>
                </View>
                <Text style={sh.subLabel}>How it works</Text>
                {def.perks.map((perk, i) => (
                  <View key={i} style={sh.perkRow}>
                    <View style={sh.perkDot}>
                      <Text style={sh.perkDotTxt}>{i + 1}</Text>
                    </View>
                    <Text style={sh.perkTxt}>{perk}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── ADDRESSES — saved list ───────────────────────────── */}
            {def.addresses && (
              <View style={sh.section}>
                <Text style={sh.subLabel}>Saved Addresses</Text>
                {def.addresses.map(addr => (
                  <View key={addr.id} style={sh.addressRow}>
                    <View style={[sh.rewardIconBox, { backgroundColor: COLORS.infoLight }]}>
                      <Ionicons name={addr.icon} size={17} color={COLORS.info} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                        <Text style={sh.addrLabel}>{addr.label}</Text>
                        {addr.isDefault && (
                          <View style={sh.defaultBadge}>
                            <Text style={sh.defaultBadgeTxt}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={sh.addrSub}>{addr.address}</Text>
                    </View>
                    <TouchableOpacity style={sh.editBtn}>
                      <Ionicons name='create-outline' size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
                <Text style={[sh.subLabel, { marginTop: SPACING.md }]}>Add New Address</Text>
              </View>
            )}

            {/* ── PAYMENT — saved cards ────────────────────────────── */}
            {def.cards && (
              <View style={sh.section}>
                <Text style={sh.subLabel}>Saved Cards</Text>
                {def.cards.map(card => (
                  <View key={card.id} style={sh.cardRow}>
                    <View style={[sh.rewardIconBox, { backgroundColor: COLORS.surfaceAlt }]}>
                      <Ionicons name='card' size={17} color={COLORS.secondaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                        <Text style={sh.addrLabel}>
                          {card.brand} •••• {card.last4}
                        </Text>
                        {card.isDefault && (
                          <View style={sh.defaultBadge}>
                            <Text style={sh.defaultBadgeTxt}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={sh.addrSub}>Expires {card.expiry}</Text>
                    </View>
                    <TouchableOpacity style={sh.deleteBtn}>
                      <Ionicons name='trash-outline' size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <Text style={[sh.subLabel, { marginTop: SPACING.md }]}>Add New Card</Text>
              </View>
            )}

            {/* ── TOGGLES (Notifications / Privacy) ────────────────── */}
            {def.isToggles && (
              <View style={sh.section}>
                <View style={sh.togglesCard}>
                  {def.toggles.map((t, i) => (
                    <View key={t.key} style={[sh.toggleRow, i < def.toggles.length - 1 && sh.toggleBorder]}>
                      <View style={[sh.rewardIconBox, { backgroundColor: def.accentColor + '15' }]}>
                        <Ionicons name={t.icon} size={17} color={def.accentColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={sh.toggleLabel}>{t.label}</Text>
                        <Text style={sh.toggleSub}>{t.sub}</Text>
                      </View>
                      <Switch
                        value={toggleValues[t.key]}
                        onValueChange={v => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setToggleValues(prev => ({ ...prev, [t.key]: v }));
                        }}
                        trackColor={{ false: COLORS.border, true: COLORS.secondaryDark }}
                        thumbColor={COLORS.surface}
                      />
                    </View>
                  ))}
                </View>
                {def.changePassword && (
                  <>
                    <Text style={[sh.subLabel, { marginTop: SPACING.md }]}>Change Password</Text>
                  </>
                )}
              </View>
            )}

            {/* ── LANGUAGE ─────────────────────────────────────────── */}
            {def.isLanguage && (
              <View style={sh.section}>
                <Text style={sh.subLabel}>Select Language</Text>
                {def.languages.map(lang => {
                  const active = selectedLang === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[sh.langRow, active && sh.langRowActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedLang(lang.code);
                      }}
                      activeOpacity={0.85}>
                      <Text style={sh.langFlag}>{lang.flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={sh.langLabel}>{lang.label}</Text>
                        <Text style={sh.langNative}>{lang.native}</Text>
                      </View>
                      {active ? <Ionicons name='checkmark-circle' size={20} color={COLORS.success} /> : <View style={sh.langRadio} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ── HELP / FAQ ────────────────────────────────────────── */}
            {def.isHelp && (
              <View style={sh.section}>
                <Text style={sh.subLabel}>Frequently Asked Questions</Text>
                {def.faqs.map((faq, i) => (
                  <TouchableOpacity key={i} style={[sh.faqRow, i < def.faqs.length - 1 && sh.toggleBorder]} onPress={() => setOpenFaq(openFaq === i ? null : i)} activeOpacity={0.85}>
                    <View style={{ flex: 1 }}>
                      <Text style={sh.faqQ}>{faq.q}</Text>
                      {openFaq === i && <Text style={sh.faqA}>{faq.a}</Text>}
                    </View>
                    <Ionicons name={openFaq === i ? 'chevron-up' : 'chevron-down'} size={15} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── LIVE CHAT ─────────────────────────────────────────── */}
            {def.isChat && (
              <View style={sh.section}>
                <View style={sh.chatAgentRow}>
                  <View style={sh.chatAvatar}>
                    <Ionicons name='person' size={20} color={COLORS.bg} />
                    <View style={sh.chatOnline} />
                  </View>
                  <View>
                    <Text style={sh.chatAgentName}>{def.agentName}</Text>
                    <Text style={sh.chatAgentStatus}>{def.agentStatus}</Text>
                  </View>
                </View>
                <View style={sh.chatBubble}>
                  <Text style={sh.chatBubbleTxt}>{def.messages[0].text}</Text>
                  <Text style={sh.chatBubbleTime}>{def.messages[0].time}</Text>
                </View>
              </View>
            )}

            {/* ── STAR RATING ───────────────────────────────────────── */}
            {def.isRating && (
              <View style={sh.section}>
                <Text style={sh.subLabel}>How was your experience?</Text>
                <View style={sh.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setStarRating(star);
                      }}
                      activeOpacity={0.8}>
                      <Ionicons name={star <= starRating ? 'star' : 'star-outline'} size={36} color={star <= starRating ? COLORS.primary : COLORS.border} />
                    </TouchableOpacity>
                  ))}
                </View>
                {starRating > 0 && <Text style={sh.ratingLabel}>{['', 'Needs Work 😕', 'Okay 😐', 'Good 🙂', 'Great 😄', 'Excellent! 🎉'][starRating]}</Text>}
              </View>
            )}

            {/* ── FORM FIELDS ───────────────────────────────────────── */}
            {def.fields.length > 0 && (
              <View style={sh.fieldsCard}>
                {def.fields.map((field, i) => (
                  <FormField key={field.key} field={field} value={formValues[field.key] || ''} onChange={v => setFormValues(prev => ({ ...prev, [field.key]: v }))} isLast={i === def.fields.length - 1} />
                ))}
              </View>
            )}

            {/* ── CTA BUTTON ────────────────────────────────────────── */}
            <TouchableOpacity style={sh.ctaBtn} onPress={handleCta} activeOpacity={0.9}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={sh.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name={def.ctaIcon} size={20} color={COLORS.text} />
                <Text style={sh.ctaTxt}>{def.cta}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, accent, prefix = '', suffix = '', index = 0 }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 40;
    const id = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(id);
      } else setDisplay(Math.floor(start));
    }, 35);
    return () => clearInterval(id);
  }, []);

  const scale = useSharedValue(0.82);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(index * 80, withSpring(1, ANIM.springSlow));
    opacity.value = withDelay(index * 80, withTiming(1, { duration: ANIM.duration.normal }));
  }, []);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  return (
    <Animated.View style={[stat.card, cardStyle]}>
      <View style={[stat.iconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Text style={stat.value}>
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </Text>
      <Text style={stat.label}>{label}</Text>
    </Animated.View>
  );
};

// ─── AVATAR RING ──────────────────────────────────────────────────────────────────
const AvatarRing = ({ tier }) => {
  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withRepeat(withTiming(360, { duration: 5000 }), -1, false);
  }, []);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const [[g1, g2]] = TIER_COLORS[tier] ?? TIER_COLORS.Gold;

  return (
    <View style={av.wrap}>
      <Animated.View style={[av.ring, ringStyle]}>
        <LinearGradient colors={[g1, g2, COLORS.bg, g1]} style={av.ringInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      </Animated.View>
      <Image source={{ uri: USER.avatar }} style={av.img} />
      <View style={[av.tierBadge, { backgroundColor: g1 }]}>
        <Ionicons name='trophy' size={9} color={COLORS.bg} />
        <Text style={av.tierTxt}>{tier}</Text>
      </View>
    </View>
  );
};

// ─── MENU ITEM ────────────────────────────────────────────────────────────────────
const MenuItem = ({ item, onPress, isLast, index }) => {
  const p = usePress();
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: withDelay(index * 40, withTiming(1, { duration: ANIM.duration.normal })),
    transform: [{ translateX: withDelay(index * 40, withSpring(0, ANIM.springSlow)) }],
  }));

  return (
    <Animated.View style={[{ opacity: 0, transform: [{ translateX: 16 }] }, entranceStyle, p.animStyle]}>
      <TouchableOpacity
        style={[menu.row, !isLast && menu.rowBorder]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={p.onPressIn}
        onPressOut={p.onPressOut}
        activeOpacity={1}>
        <View style={[menu.iconBox, { backgroundColor: item.accent + '16' }]}>
          <Ionicons name={item.icon} size={19} color={item.accent} />
        </View>
        <Text style={menu.label}>{item.label}</Text>
        <View style={menu.trailing}>
          {item.value && <Text style={menu.value}>{item.value}</Text>}
          {item.badge && (
            <View style={menu.badge}>
              <Text style={menu.badgeTxt}>{item.badge}</Text>
            </View>
          )}
          <Ionicons name='chevron-forward' size={15} color={COLORS.border} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const [darkMode, setDarkMode] = useState(true);
  const [notifs, setNotifs] = useState(true);
  const [activeSheetKey, setActiveSheetKey] = useState(null);

  const headerOp = useSharedValue(0);
  useEffect(() => {
    headerOp.value = withTiming(1, { duration: ANIM.duration.slow });
  }, []);
  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOp.value }));

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setActiveSheetKey('Privacy')}>
            <Ionicons name='settings-outline' size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xxl }}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <LinearGradient colors={['#1C1A10', '#2A2418', '#33291C']} style={StyleSheet.absoluteFill} />
          <AvatarRing tier={USER.loyaltyTier} />
          <Text style={styles.userName}>{USER.name}</Text>
          <Text style={styles.userEmail}>{USER.email}</Text>
          <View style={styles.memberPill}>
            <Ionicons name='calendar-outline' size={12} color={'rgba(250,247,242,0.55)'} />
            <Text style={styles.memberSince}>Member since {USER.memberSince}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label='Orders' value={USER.totalOrders} icon='receipt-outline' accent={COLORS.success} index={0} />
          <StatCard label='Points' value={USER.points} icon='trophy-outline' accent={COLORS.secondaryDark} index={1} />
          <StatCard label='Wallet' value={USER.walletBalance} icon='wallet-outline' accent={COLORS.warning} index={2} prefix='QAR ' />
        </View>

        {/* Menu sections */}
        {MENU_SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, i) => (
                <MenuItem
                  key={item.label}
                  item={item}
                  index={i}
                  isLast={i === section.items.length - 1}
                  onPress={() => item.navTarget ? navigation.navigate(item.navTarget) : setActiveSheetKey(item.sheetKey)}
                />
              ))}
            </View>
          </View>
        ))}

        {/* Quick Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick Settings</Text>
          <View style={styles.sectionCard}>
            <View style={[menu.row, menu.rowBorder]}>
              <View style={[menu.iconBox, { backgroundColor: COLORS.infoLight }]}>
                <Ionicons name='moon-outline' size={19} color={COLORS.info} />
              </View>
              <Text style={menu.label}>Dark Mode</Text>
              <Switch
                value={darkMode}
                onValueChange={v => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDarkMode(v);
                }}
                trackColor={{ false: COLORS.border, true: COLORS.secondaryDark }}
                thumbColor={COLORS.surface}
              />
            </View>
            <View style={menu.row}>
              <View style={[menu.iconBox, { backgroundColor: COLORS.warningLight }]}>
                <Ionicons name='notifications-outline' size={19} color={COLORS.warning} />
              </View>
              <Text style={menu.label}>Push Notifications</Text>
              <Switch
                value={notifs}
                onValueChange={v => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNotifs(v);
                }}
                trackColor={{ false: COLORS.border, true: COLORS.secondaryDark }}
                thumbColor={COLORS.surface}
              />
            </View>
          </View>
        </View>

        {/* Log Out */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('Auth');
          }}
          activeOpacity={0.85}>
          <Ionicons name='log-out-outline' size={19} color={COLORS.error} />
          <Text style={styles.logoutTxt}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Active bottom sheet */}
      {activeSheetKey && (
        <ActionSheet
          sheetKey={activeSheetKey}
          onClose={() => setActiveSheetKey(null)} // Clear the sheet when closed
        />
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  headerTitle: { color: COLORS.text, fontSize: 26, fontWeight: '900' },
  settingsBtn: { width: 38, height: 38, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', ...SHADOW.card },
  heroCard: { marginHorizontal: SPACING.md, borderRadius: RADIUS.xl, alignItems: 'center', paddingVertical: SPACING.lg, paddingHorizontal: SPACING.md, overflow: 'hidden', gap: SPACING.xs, borderWidth: 1, borderColor: 'rgba(250,247,242,0.08)', ...SHADOW.card },
  userName: { color: COLORS.bg, fontSize: 21, fontWeight: '900', marginTop: SPACING.sm },
  userEmail: { color: 'rgba(250,247,242,0.55)', fontSize: 13 },
  memberPill: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: 'rgba(250,247,242,0.08)', borderWidth: 1, borderColor: 'rgba(250,247,242,0.12)', paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, marginTop: SPACING.xs },
  memberSince: { color: 'rgba(250,247,242,0.55)', fontSize: 12, fontWeight: '500' },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.sm, marginTop: SPACING.md, marginBottom: SPACING.xs },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm },
  sectionCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOW.card },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginHorizontal: SPACING.md, marginTop: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.errorLight, backgroundColor: COLORS.errorLight },
  logoutTxt: { color: COLORS.error, fontSize: 15, fontWeight: '700' },
});

const stat = StyleSheet.create({
  card: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.sm + SPACING.xs, alignItems: 'center', gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  iconWrap: { width: 36, height: 36, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xs },
  value: { color: COLORS.text, fontSize: 17, fontWeight: '900' },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600' },
});

const av = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 104, height: 104 },
  ring: { position: 'absolute', width: 104, height: 104, borderRadius: RADIUS.full },
  ringInner: { flex: 1, borderRadius: RADIUS.full },
  img: { width: 90, height: 90, borderRadius: RADIUS.full, borderWidth: 3, borderColor: '#1C1A10' },
  tierBadge: { position: 'absolute', bottom: -SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.sm + SPACING.xs, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  tierTxt: { color: COLORS.bg, fontSize: 10, fontWeight: '800' },
});

const menu = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconBox: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '600' },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  value: { color: COLORS.textMuted, fontSize: 13 },
  badge: { backgroundColor: COLORS.surfaceAlt, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs - 1, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  badgeTxt: { color: COLORS.textSub, fontSize: 11, fontWeight: '700' },
});

// Sheet styles
const sh = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(28,26,16,0.58)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: H * 0.88, backgroundColor: COLORS.surface, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border, ...SHADOW.card },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: RADIUS.full, alignSelf: 'center', marginTop: SPACING.md, marginBottom: SPACING.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sheetIconBox: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  closeBtn: { width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  section: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  subLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm },

  // Wallet
  walletBalanceBox: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden' },
  walletGrad: { padding: SPACING.lg, alignItems: 'center', gap: SPACING.xs, borderRadius: RADIUS.lg },
  walletLabel: { color: 'rgba(250,247,242,0.55)', fontSize: 12 },
  walletAmt: { color: COLORS.bg, fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  walletPill: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: 'rgba(255,193,7,0.12)', paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,193,7,0.22)', marginTop: SPACING.xs },
  walletPillTxt: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  topUpGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  topUpBtn: { width: (W - SPACING.md * 2 - SPACING.sm) / 2, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bg, position: 'relative', overflow: 'hidden' },
  topUpBtnSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  topUpCheck: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, width: 18, height: 18, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  topUpAmt: { color: COLORS.textMuted, fontSize: 16, fontWeight: '800' },
  topUpAmtSelected: { color: COLORS.text },

  // Loyalty
  loyaltyHero: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden' },
  loyaltyGrad: { padding: SPACING.lg, alignItems: 'center', gap: SPACING.xs, borderRadius: RADIUS.lg },
  loyaltyPts: { color: COLORS.bg, fontSize: 40, fontWeight: '900', letterSpacing: -1 },
  loyaltyPtsLabel: { color: 'rgba(250,247,242,0.55)', fontSize: 13 },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm + SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, backgroundColor: COLORS.bg },
  rewardRowSelected: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  rewardIconBox: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  rewardLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  rewardCost: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },

  // Referral
  referralBox: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden' },
  referralGrad: { padding: SPACING.lg, alignItems: 'center', borderRadius: RADIUS.lg },
  referralCode: { color: COLORS.bg, fontSize: 28, fontWeight: '900', letterSpacing: 4, marginBottom: SPACING.xs },
  referralCodeLabel: { color: 'rgba(250,247,242,0.55)', fontSize: 12 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  perkDot: { width: 24, height: 24, borderRadius: RADIUS.full, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  perkDotTxt: { color: COLORS.secondaryDark, fontSize: 11, fontWeight: '800' },
  perkTxt: { flex: 1, color: COLORS.textSub, fontSize: 14, fontWeight: '500' },

  // Addresses & Cards
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, backgroundColor: COLORS.bg },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, backgroundColor: COLORS.bg },
  addrLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  addrSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  defaultBadge: { backgroundColor: COLORS.successLight, paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  defaultBadgeTxt: { color: COLORS.success, fontSize: 10, fontWeight: '700' },
  editBtn: { width: 30, height: 30, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 30, height: 30, borderRadius: RADIUS.md, backgroundColor: COLORS.errorLight, alignItems: 'center', justifyContent: 'center' },

  // Toggles
  togglesCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOW.card },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md - 2 },
  toggleBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  toggleLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  toggleSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },

  // Language
  langRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm + SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm, backgroundColor: COLORS.bg },
  langRowActive: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  langFlag: { fontSize: 24 },
  langLabel: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  langNative: { color: COLORS.textMuted, fontSize: 12 },
  langRadio: { width: 20, height: 20, borderRadius: RADIUS.full, borderWidth: 2, borderColor: COLORS.border },

  // FAQ
  faqRow: { paddingVertical: SPACING.md, flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  faqQ: { color: COLORS.text, fontSize: 14, fontWeight: '700', flex: 1, lineHeight: 20 },
  faqA: { color: COLORS.textSub, fontSize: 13, marginTop: SPACING.sm, lineHeight: 19 },

  // Chat
  chatAgentRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.successLight, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.success + '30' },
  chatAvatar: { width: 44, height: 44, borderRadius: RADIUS.full, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  chatOnline: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: RADIUS.full, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.surface },
  chatAgentName: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  chatAgentStatus: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  chatBubble: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, borderTopLeftRadius: 4, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  chatBubbleTxt: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  chatBubbleTime: { color: COLORS.textMuted, fontSize: 11, marginTop: SPACING.xs, textAlign: 'right' },

  // Stars
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  ratingLabel: { color: COLORS.textSub, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.md },

  // Fields card
  fieldsCard: { marginHorizontal: SPACING.md, marginTop: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOW.card },

  // CTA
  ctaBtn: { marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden' },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  ctaTxt: { color: COLORS.text, fontSize: 16, fontWeight: '900', letterSpacing: -0.2 },
});

// Form field styles
const ff = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  border: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconWrap: { width: 32, height: 32, borderRadius: RADIUS.sm, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  input: { color: COLORS.text, fontSize: 15, fontWeight: '600', paddingVertical: SPACING.xs, borderBottomWidth: 1.5, borderBottomColor: COLORS.border },
  multilineInput: { height: 72, textAlignVertical: 'top' },
});
