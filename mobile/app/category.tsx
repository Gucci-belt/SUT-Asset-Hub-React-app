import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StatusBar, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from 'lucide-react-native';
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

// ─── Category Icon Map ────────────────────────────────────────────────────────
const CATEGORY_COLORS: { [key: string]: string } = {
  'IoT': '#60A5FA',
  'Laptops': '#34D399',
  'Cameras': '#FBBF24',
  'Sensors': '#F87171',
  'Network': '#818CF8',
  'Audio': '#EC4899',
};

export default function CategoryScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssetsByCategory = useCallback(async () => {
    if (!name) return;
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_BASE_URL}/assets?category=${encodeURIComponent(name)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch assets');
      const data: Asset[] = await res.json();
      setAssets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    fetchAssetsByCategory();
  }, [fetchAssetsByCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssetsByCategory();
    setRefreshing(false);
  };

  const bgColor = CATEGORY_COLORS[name || ''] || '#2563EB';

  if (!name) {
    return (
      <View className="flex-1 bg-white pt-12 items-center justify-center">
        <Text className="text-slate-400 text-sm">Invalid category</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-12">
      <StatusBar barStyle="light-content" backgroundColor={bgColor} />

      {/* Header */}
      <View className="flex-row items-center px-6 py-4" style={{ backgroundColor: bgColor }}>
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">{name}</Text>
          <Text className="text-white/70 text-xs mt-0.5">
            {assets.length} {assets.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      {/* Loading State */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500 text-sm font-medium text-center mb-4">
            {error}
          </Text>
          <TouchableOpacity
            className="bg-[#2563EB] px-6 py-3 rounded-lg"
            onPress={fetchAssetsByCategory}
          >
            <Text className="text-white font-semibold text-sm">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : assets.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-slate-400 text-sm font-medium text-center">
            No assets in {name}
          </Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={true}
          ItemSeparatorComponent={() => <View className="h-2" />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
            />
          }
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
              {/* Image */}
              {item.imagePath ? (
                <Image
                  source={{
                    uri: item.imagePath?.startsWith('http')
                      ? item.imagePath
                      : `${API_BASE_URL.replace('/api', '')}${item.imagePath}`,
                  }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    marginRight: 16,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="rounded-xl items-center justify-center mr-4"
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: '#EFF6FF',
                  }}
                >
                  <Text className="text-[#2563EB] text-xs font-bold text-center">
                    {item.category.slice(0, 3).toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Info */}
              <View className="flex-1">
                <Text className="text-slate-900 text-sm font-bold mb-0.5" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-slate-400 text-xs font-medium" numberOfLines={1}>
                  {item.serialNumber}
                </Text>
              </View>

              {/* Status Badge */}
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

      <BottomTabBar activeTab="home" />
    </View>
  );
}
