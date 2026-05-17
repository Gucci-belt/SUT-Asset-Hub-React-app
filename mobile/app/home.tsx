import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StatusBar, RefreshControl, FlatList, Image, ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  Bell, Search, Router as RouterIcon, Laptop, Camera, Radio,
  Microscope, Headphones,
} from 'lucide-react-native';
import BottomTabBar from '../components/BottomTabBar';

// ─── API ──────────────────────────────────────────────────────────────────────
const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  API_BASE_URL = `http://${debuggerHost.split(':')[0]}:3000/api`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Asset {
  id: number;
  name: string;
  serialNumber: string;
  category: string;
  status: string;
  description: string | null;
  imagePath: string | null;
  createdAt: string;
}

// ─── Category config ──────────────────────────────────────────────────────────
const CATS = [
  { name: 'IoT',      icon: RouterIcon },
  { name: 'Laptops',  icon: Laptop },
  { name: 'Cameras',  icon: Camera },
  { name: 'Sensors',  icon: Radio },
  { name: 'Network',  icon: Microscope },
  { name: 'Audio',    icon: Headphones },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const Header = ({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const firstName = await AsyncStorage.getItem('firstName');
        const studentId = await AsyncStorage.getItem('studentId');
        setDisplayName(firstName || studentId || 'User');
      } catch {
        setDisplayName('User');
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/transactions/my-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const count = data.filter((t: any) =>
          t.status === 'pending' || t.status === 'approved'
        ).length;
        setBadgeCount(count);
      } catch {}
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View className="bg-[#2563EB] pt-8 pb-8 px-6 rounded-b-[40px] shadow-lg">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-blue-100 font-medium text-[13px] mb-1">Welcome back,</Text>
          <Text className="text-white text-2xl font-bold tracking-wide">{`Hello, ${displayName}`}</Text>
        </View>
        <TouchableOpacity
          className="w-10 h-10 bg-white/20 rounded-full items-center justify-center relative"
          onPress={() => router.push('/history')}
        >
          <Bell color="white" size={20} />
          {badgeCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1 border-2 border-[#2563EB]">
              <Text className="text-white text-[10px] font-bold">
                {badgeCount > 9 ? '9+' : badgeCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View className="bg-white flex-row items-center rounded-full px-5 py-3.5 shadow-lg shadow-blue-900/20">
        <Search color="#94A3B8" size={20} />
        <TextInput
          placeholder="Search equipment..."
          placeholderTextColor="#94A3B8"
          className="flex-1 ml-3 text-slate-800 text-[15px] font-medium"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();

  const [assets, setAssets]                   = useState<Asset[]>([]);
  const [filtered, setFiltered]               = useState<Asset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [refreshing, setRefreshing]           = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAssets = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_BASE_URL}/assets`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data: Asset[] = await res.json();
        setAssets(data);
      }
    } catch (err) {
      console.error('fetchAssets error:', err);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssets();
    setRefreshing(false);
  };

  // ── Reactive Filtering logic for Search & Category ───────────────────────
  useEffect(() => {
    let result = assets;
    if (selectedCategory) {
      result = result.filter(
        (a) => a.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.serialNumber.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [assets, selectedCategory, searchQuery]);

  // ── Category filter ───────────────────────────────────────────────────────
  const onCategoryPress = (catName: string) => {
    if (selectedCategory === catName) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(catName);
    }
  };

  // ── New Arrivals (horizontal strip — first 4) ─────────────────────────────
  const newArrivals = assets.slice(0, 4);

  return (
    <View className="flex-1 bg-white pt-12">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {/* ── Header ── */}
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* ── Categories (hidden when searching) ── */}
        {!searchQuery && (
          <View className="px-6 mt-8">
            <Text className="text-slate-800 text-[17px] font-bold mb-5 tracking-tight">Categories</Text>
            <View className="flex-row flex-wrap">
              {CATS.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={{ width: '30%', marginRight: '3%', marginBottom: 20 }}
                    className="items-center bg-white rounded-2xl py-4"
                    onPress={() => router.push(`/category?name=${encodeURIComponent(cat.name)}`)}
                    activeOpacity={0.7}
                  >
                    <View
                      className={`w-14 h-14 rounded-full items-center justify-center mb-2 ${
                        isActive ? 'bg-[#2563EB]' : 'bg-[#EFF6FF]'
                      }`}
                    >
                      <cat.icon color={isActive ? '#FFFFFF' : '#2563EB'} size={24} />
                    </View>
                    <Text
                      className={`text-[11px] font-bold text-center ${
                        isActive ? 'text-[#2563EB]' : 'text-slate-500'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── New Arrivals (shown only when no category filter and not searching) ── */}
        {!selectedCategory && !searchQuery && (
          <View className="mt-2">
            <View className="flex-row justify-between items-end px-6 mb-4">
              <Text className="text-slate-800 text-[17px] font-bold tracking-tight">
                New Equipment Arrivals
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6">
              {newArrivals.length > 0 ? (
                newArrivals.map((asset, index) => {
                  const isBlue = index % 2 === 1;
                  const bgClass    = isBlue ? 'bg-[#60A5FA]' : 'bg-[#10B981]';
                  const shadowClass = isBlue ? 'shadow-blue-900/20' : 'shadow-emerald-900/20';
                  const textClass  = isBlue ? 'text-blue-100' : 'text-emerald-100';
                  return (
                    <TouchableOpacity
                      key={asset.id}
                      onPress={() => router.push(`/detail?id=${asset.id}`)}
                      className={`w-[280px] h-[160px] ${bgClass} rounded-[24px] p-5 mr-4 justify-between overflow-hidden relative shadow-md ${shadowClass}`}
                    >
                      <ImageBackground
                        source={
                          asset.imagePath
                            ? {
                                uri: asset.imagePath.startsWith('http')
                                  ? asset.imagePath
                                  : `${API_BASE_URL.replace('/api', '')}${asset.imagePath}`,
                              }
                            : undefined
                        }
                        className="w-full h-full rounded-[24px] overflow-hidden justify-between p-5"
                        imageStyle={{ borderRadius: 24, opacity: 0.35 }}
                      >
                        <View className="bg-white/30 self-start px-3 py-1 rounded-full mb-2">
                          <Text className="text-white text-[9px] font-bold tracking-widest">NEW</Text>
                        </View>
                        <View className="z-10 mt-2">
                          <Text className="text-white font-bold text-[22px] leading-tight" numberOfLines={2}>
                            {asset.name}
                          </Text>
                        </View>
                        <Text className="text-white/80 text-[11px] mt-auto z-10 font-medium" numberOfLines={1}>
                          {asset.description || 'New equipment arrival'}
                        </Text>
                      </ImageBackground>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View className="w-[280px] h-[160px] bg-slate-100 rounded-[24px] items-center justify-center mr-4">
                  <Text className="text-slate-400 font-medium">No new arrivals</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* ── Filtered Asset List ── */}
        <View className="px-6 mt-6 mb-4">
          <Text className="text-slate-800 text-[17px] font-bold tracking-tight mb-4">
            {selectedCategory
              ? `${selectedCategory} (${filtered.length})`
              : `All Assets (${assets.length})`}
          </Text>

          {filtered.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-slate-400 text-sm font-medium">
                {selectedCategory ? `No assets in "${selectedCategory}"` : 'No assets available'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View className="h-3" />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/detail?id=${item.id}`)}
                  className="bg-white rounded-2xl p-4 flex-row items-center"
                  style={{
                    shadowColor: '#94A3B8',
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                  activeOpacity={0.7}
                >
                  {/* Color-coded category strip */}
                  {item.imagePath ? (
                    <Image
                      source={{ uri: item.imagePath?.startsWith('http') 
                        ? item.imagePath 
                        : `${API_BASE_URL.replace('/api', '')}${item.imagePath}` 
                      }}
                      style={{ width: 48, height: 48, borderRadius: 12, marginRight: 16 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: '#EFF6FF' }}
                    >
                      <Text
                        className="text-[#2563EB] text-xs font-bold text-center"
                        numberOfLines={1}
                      >
                        {item.category.slice(0, 3).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* Info */}
                  <View className="flex-1">
                    <Text className="text-slate-900 text-sm font-bold mb-0.5" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-slate-400 text-xs font-medium">
                      {item.serialNumber}
                    </Text>
                  </View>

                  {/* Status badge */}
                  <View
                    className={`px-2 py-1 rounded-full ${
                      item.status === 'available' ? 'bg-emerald-50' : 'bg-orange-50'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold capitalize ${
                        item.status === 'available' ? 'text-emerald-600' : 'text-orange-500'
                      }`}
                    >
                      {item.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </ScrollView>

      <BottomTabBar activeTab="home" />
    </View>
  );
}