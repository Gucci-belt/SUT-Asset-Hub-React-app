import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StatusBar, ActivityIndicator, RefreshControl, ScrollView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';
import { ChevronLeft, ClipboardList } from 'lucide-react-native';

// ─── API ──────────────────────────────────────────────────────────────────────
const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  const host = debuggerHost.split(':')[0];
  API_BASE_URL = `http://${host}:3000/api`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id: number;
  status: 'pending' | 'approved' | 'returned' | 'rejected';
  borrowDate: string;
  returnDate: string | null;
  dueDate: string | null;
  user: { id: number; studentId: string; firstName: string | null; lastName: string | null };
  asset: { id: number; name: string; serialNumber: string; category: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = ['All', 'pending', 'approved', 'returned', 'rejected'] as const;
type TabType = typeof TABS[number];

// ─── Helper ───────────────────────────────────────────────────────────────────
const getStatusColors = (status: string) => {
  switch (status) {
    case 'pending': return { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', border: 'bg-amber-400' };
    case 'approved': return { bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]', border: 'bg-blue-500' };
    case 'returned': return { bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', border: 'bg-green-500' };
    case 'rejected': return { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', border: 'bg-red-500' };
    default: return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'bg-slate-300' };
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const getInitials = (user: Transaction['user']) => {
  if (user.firstName) return user.firstName.charAt(0).toUpperCase();
  return user.studentId.charAt(0).toUpperCase();
};

const getUserName = (user: Transaction['user']) => {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return user.studentId;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TransactionLogsScreen() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<TabType>('All');

  // ─── Fetch Data ─────────────────────────────────────────────────────────────
  const fetchLogs = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await axios.get(`${API_BASE_URL}/admin/transactions/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load transaction logs', err);
      setError('Failed to load transaction logs');
    }
  };

  const initialFetch = useCallback(async () => {
    setLoading(true);
    await fetchLogs();
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      initialFetch();
    }, [initialFetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  // ─── Filtered Data ──────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    if (selectedTab === 'All') return transactions;
    return transactions.filter(t => t.status === selectedTab);
  }, [transactions, selectedTab]);

  // ─── Render Item ────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Transaction }) => {
    const colors = getStatusColors(item.status);
    
    return (
      <View className="bg-white rounded-2xl mb-3 flex-row overflow-hidden shadow-sm border border-slate-100">
        {/* Left Status Bar */}
        <View className={`w-1 ${colors.border}`} />

        <View className="flex-1 p-4 flex-row">
          {/* Avatar */}
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 mt-1 ${colors.bg}`}>
            <Text className={`font-bold text-base ${colors.text}`}>{getInitials(item.user)}</Text>
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row justify-between items-start mb-1">
              <View className="flex-1 pr-2">
                <Text className="text-slate-900 font-bold text-base" numberOfLines={1}>
                  {item.asset.name}
                </Text>
                <Text className="text-slate-400 text-xs font-medium">
                  ID: {item.asset.serialNumber}
                </Text>
              </View>
              
              {/* Status Pill */}
              <View className={`px-2 py-1 rounded-md ${colors.bg}`}>
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View className="h-[1px] w-full bg-slate-100 my-2" />

            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-slate-700 text-xs font-medium mb-1">
                  User: <Text className="font-bold">{getUserName(item.user)}</Text>
                </Text>
                <Text className="text-slate-500 text-[10px]">
                  Borrow: {formatDate(item.borrowDate)}
                </Text>
              </View>
              <View className="items-end">
                {item.returnDate && (
                  <Text className="text-slate-500 text-[10px]">
                    Returned: {formatDate(item.returnDate)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-4 flex-row items-center justify-between border-b border-slate-200 z-10">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3"
          >
            <ChevronLeft size={22} color="#334155" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900">Transaction Logs</Text>
        </View>
        <View className="bg-blue-100 px-3 py-1 rounded-full">
          <Text className="text-blue-700 font-bold text-sm">{filteredLogs.length} Total</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white border-b border-slate-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-full border ${
                selectedTab === tab
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-bold capitalize ${
                  selectedTab === tab ? 'text-white' : 'text-slate-600'
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-red-500 font-medium mb-4 text-center">{error}</Text>
          <TouchableOpacity
            onPress={initialFetch}
            className="bg-blue-600 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <ClipboardList size={40} color="#CBD5E1" className="mb-4" />
              <Text className="text-slate-400 font-medium text-base">No transactions found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
