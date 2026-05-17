import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ChevronLeft, User, Calendar } from 'lucide-react-native';
import Constants from 'expo-constants';
import axios from 'axios';

const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  API_BASE_URL = `http://${debuggerHost.split(':')[0]}:3000/api`;
}

interface Asset {
  id: number;
  name: string;
  serialNumber: string;
  category: string;
  status: string;
  imagePath?: string;
}

interface Transaction {
  id: number;
  assetId: number;
  studentId: string;
  dueDate: string;
  status: string;
}

export default function AssetStatusScreen() {
  const { filter } = useLocalSearchParams<{ filter: 'all' | 'borrowed' | 'maintenance' }>();
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      const url = filter === 'all' || !filter 
        ? `${API_BASE_URL}/assets`
        : `${API_BASE_URL}/assets?status=${filter}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let fetchedAssets = Array.isArray(res.data) ? res.data : [];
      // Fallback: forcefully filter on client side in case backend ignores ?status
      if (filter && filter !== 'all') {
        fetchedAssets = fetchedAssets.filter((a: any) => a.status === filter);
      }
      setAssets(fetchedAssets);

      if (filter === 'borrowed' || filter === 'all') {
        const txRes = await axios.get(`${API_BASE_URL}/admin/transactions/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (txRes.data) {
          // Keep only approved ones since those are actively borrowed
          setTransactions(txRes.data.filter((t: any) => t.status === 'approved'));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getHeaderTitle = () => {
    switch (filter) {
      case 'all': return `All Assets (${assets.length})`;
      case 'borrowed': return `Currently Borrowed (${assets.length})`;
      case 'maintenance': return `Under Maintenance (${assets.length})`;
      default: return `Assets (${assets.length})`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'borrowed': return 'bg-blue-100 text-blue-700';
      case 'maintenance': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renderItem = ({ item }: { item: Asset }) => {
    const activeTx = item.status === 'borrowed' 
      ? transactions.find(t => t.assetId === item.id)
      : null;

    const imageUrl = item.imagePath 
      ? (item.imagePath.startsWith('http') ? item.imagePath : `${API_BASE_URL.replace('/api', '')}${item.imagePath}`)
      : null;

    return (
      <View className="bg-white p-4 rounded-2xl mb-4" style={{ shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
        <View className="flex-row items-start">
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              className="w-16 h-16 rounded-xl mr-4" 
              resizeMode="cover" 
            />
          ) : (
            <View className="w-16 h-16 rounded-xl bg-slate-100 mr-4 items-center justify-center">
              <Text className="text-slate-400 text-xs text-center">No Image</Text>
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <Text className="text-base font-bold text-slate-800 flex-1 mr-2">{item.name}</Text>
              <View className={`px-2 py-1 rounded-full ${getStatusColor(item.status).split(' ')[0]}`}>
                <Text className={`text-[10px] font-bold uppercase ${getStatusColor(item.status).split(' ')[1]}`}>
                  {item.status}
                </Text>
              </View>
            </View>

            <Text className="text-sm text-slate-500 mt-1">Serial: {item.serialNumber}</Text>
            <Text className="text-xs text-slate-400 mt-1">{item.category}</Text>

            {item.status === 'borrowed' && activeTx && (
              <View className="mt-3 pt-3 border-t border-slate-100">
                <View className="flex-row items-center mb-1">
                  <User size={14} color="#64748B" className="mr-2" />
                  <Text className="text-sm text-slate-600 font-medium">{activeTx.studentId}</Text>
                </View>
                <View className="flex-row items-center">
                  <Calendar size={14} color="#64748B" className="mr-2" />
                  <Text className="text-sm text-slate-600 font-medium">
                    Due: {new Date(activeTx.dueDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 pt-12">
      <View className="flex-row items-center px-4 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-800 ml-2">{getHeaderTitle()}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="items-center justify-center py-10">
              <Text className="text-slate-400 text-base">No assets in this category</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
