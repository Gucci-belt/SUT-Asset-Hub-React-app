import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabName = 'home' | 'search' | 'scanner' | 'history' | 'profile';

interface TabItem {
  name: TabName;
  label: string;
  route: '/home' | '/search' | '/history' | '/scanner' | '/profile';
  activeIcon: keyof typeof Ionicons.glyphMap | null;
  inactiveIcon: keyof typeof Ionicons.glyphMap | null;
}

interface Props {
  activeTab: TabName;
}

// ─── Tab Config ───────────────────────────────────────────────────────────────
const TABS: TabItem[] = [
  {
    name: 'home',
    label: 'HOME',
    route: '/home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  {
    name: 'search',
    label: 'SEARCH',
    route: '/search',
    activeIcon: 'search',
    inactiveIcon: 'search-outline',
  },
  {
    name: 'scanner',
    label: 'SCAN',
    route: '/scanner',
    activeIcon: null,
    inactiveIcon: null,
  },
  {
    name: 'history',
    label: 'HISTORY',
    route: '/history',
    activeIcon: 'time',
    inactiveIcon: 'time-outline',
  },
  {
    name: 'profile',
    label: 'PROFILE',
    route: '/profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
];

const ACTIVE_COLOR = '#3B6BF8';
const INACTIVE_COLOR = '#9CA3AF';

// ─── Component ────────────────────────────────────────────────────────────────
const BottomTabBar: React.FC<Props> = ({ activeTab }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white flex-row justify-between items-center px-2"
      style={{
        borderTopWidth: 0.5,
        borderTopColor: '#E5E7EB',
        paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
        height: 64 + (insets.bottom > 0 ? insets.bottom : 12),
        overflow: 'visible',
      }}
    >
      {TABS.map((tab) => {
        if (tab.name === 'scanner') {
          return (
            <TouchableOpacity
              key="scanner"
              onPress={() => router.push('/scanner')}
              className="items-center justify-center flex-1"
              style={{ marginTop: -20 }}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#3B6BF8',
                  elevation: 4,
                  shadowColor: '#3B6BF8',
                  shadowOpacity: 0.4,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                }}
                className="items-center justify-center"
              >
                <Ionicons name="qr-code-outline" size={28} color="white" />
              </View>
            </TouchableOpacity>
          );
        }

        const isActive = activeTab === tab.name;
        const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
        const iconName = isActive ? tab.activeIcon! : tab.inactiveIcon!;

        return (
          <TouchableOpacity
            key={tab.name}
            className="flex-1 items-center justify-center pt-2"
            onPress={() => tab.name === 'search' ? router.push('/search') : router.push(tab.route)}
            activeOpacity={0.7}
          >
            <Ionicons name={iconName} size={24} color={color} />
            <Text
              className="text-[10px] font-bold mt-1 tracking-wide"
              style={{ color }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomTabBar;
