import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Search as SearchIcon, X } from 'lucide-react-native';
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
}

type FilterStatus = 'All' | 'Available' | 'Borrowed' | 'Maintenance';
const STATUS_FILTERS: FilterStatus[] = ['All', 'Available', 'Borrowed', 'Maintenance'];

export default function SearchScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/assets`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setAssets(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'All' || asset.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available': return 'bg-emerald-500';
      case 'borrowed': return 'bg-blue-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-slate-400';
    }
  };

  const renderAsset = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      onPress={() => router.push(`/detail?id=${item.id}`)}
      activeOpacity={0.7}
      className="bg-white rounded-2xl flex-1 m-2"
      style={{ shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}
    >
      <View className="w-full aspect-[4/3] bg-slate-100 rounded-t-2xl overflow-hidden relative border-b border-slate-50">
        {item.imagePath ? (
          <Image
            source={{ 
              uri: item.imagePath.startsWith('http') 
                ? item.imagePath 
                : `${API_BASE_URL.replace('/api', '')}${item.imagePath}` 
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl">📦</Text>
          </View>
        )}
        <View className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(item.status)}`} style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }} />
      </View>
      <View className="p-3">
        <Text className="text-slate-900 font-bold text-sm mb-1" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-slate-400 text-xs font-semibold tracking-wide" numberOfLines={1}>
          {item.category.toUpperCase()} • {item.serialNumber}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-50 pt-12">
      <StatusBar barStyle="dark-content" />
      
      {/* Sticky Header */}
      <View className="bg-white px-4 pb-3 pt-2 shadow-sm border-b border-slate-100 z-10" style={{ shadowColor: '#94A3B8', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
        <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 py-3 mb-4">
          <SearchIcon size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or serial..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-slate-800 text-[15px] font-bold"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="bg-slate-200 rounded-full p-1">
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item: filter }) => {
            const isActive = statusFilter === filter;
            return (
              <TouchableOpacity
                onPress={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-full border mr-2 ${
                  isActive ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Asset Grid */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filteredAssets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAsset}
          numColumns={2}
          contentContainerStyle={{ padding: 8, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24 px-8">
              <Text className="text-6xl mb-4">🔍</Text>
              <Text className="text-lg font-bold text-slate-800 mb-2">No Assets Found</Text>
              <Text className="text-sm text-slate-400 text-center leading-5">
                Try adjusting your search or filters to find what you're looking for.
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Navigation */}
      <BottomTabBar activeTab="search" />
    </View>
  );
}
