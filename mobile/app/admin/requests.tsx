import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StatusBar, ActivityIndicator, RefreshControl, ScrollView, Image, Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';
import { ChevronLeft, Check, X, RotateCcw, ClipboardList, Package } from 'lucide-react-native';

// ─── API ──────────────────────────────────────────────────────────────────────
const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
let SERVER_URL = 'http://10.0.2.2:3000';
if (debuggerHost) {
  const host = debuggerHost.split(':')[0];
  API_BASE_URL = `http://${host}:3000/api`;
  SERVER_URL = `http://${host}:3000`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id: number;
  status: 'pending' | 'approved' | 'returned' | 'rejected' | 'return_requested';
  borrowDate: string;
  returnDate: string | null;
  dueDate: string | null;
  reason: string | null;
  user: { id: number; studentId: string; firstName: string | null; lastName: string | null };
  asset: { id: number; name: string; serialNumber: string; category: string; imagePath?: string | null };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = ['pending', 'approved', 'rejected', 'returned'] as const;
type TabType = typeof TABS[number];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BorrowRequestsScreen() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<TabType>('pending');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────
  const fetchRequests = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await axios.get(`${API_BASE_URL}/admin/transactions/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load borrow requests', err);
      setError('Failed to load borrow requests');
    }
  };

  const initialFetch = useCallback(async () => {
    setLoading(true);
    await fetchRequests();
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      initialFetch();
    }, [initialFetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  // ─── Actions ────────────────────────────────────────────────────────────────
  const approve = async (id: number) => {
    setActionLoadingId(id);
    try {
      const token = await SecureStore.getItemAsync('token');
      await axios.patch(`${API_BASE_URL}/admin/transactions/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to approve request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const reject = async (id: number) => {
    setActionLoadingId(id);
    try {
      const token = await SecureStore.getItemAsync('token');
      await axios.patch(`${API_BASE_URL}/admin/transactions/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchRequests();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to reject request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const markReturned = async (id: number) => {
    Alert.alert('Confirm Return', 'Mark this item as returned?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoadingId(id);
          try {
            const token = await SecureStore.getItemAsync('token');
            await axios.patch(`${API_BASE_URL}/admin/transactions/${id}/return`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            await fetchRequests();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to mark as returned');
          } finally {
            setActionLoadingId(null);
          }
        }
      }
    ]);
  };

  const handleConfirmReturn = async (id: number) => {
    Alert.alert(
      'Confirm Return',
      'Confirm that the equipment has been physically returned?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('token');
              const res = await fetch(`${API_BASE_URL}/transactions/${id}/confirm-return`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error('Failed');
              Alert.alert('Success', 'Return confirmed!');
              fetchRequests();
            } catch {
              Alert.alert('Error', 'Could not confirm return.');
            }
          }
        }
      ]
    );
  };

  // ─── Filtered Data ──────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    if (selectedTab === 'pending') {
      return transactions.filter(t => t.status === 'pending' || t.status === 'return_requested');
    }
    return transactions.filter(t => t.status === selectedTab);
  }, [transactions, selectedTab]);

  const pendingCount = useMemo(() => transactions.filter(t => t.status === 'pending' || t.status === 'return_requested').length, [transactions]);

  // ─── Helper ─────────────────────────────────────────────────────────────────
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getUserName = (user: Transaction['user']) => {
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.studentId;
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-600';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'return_requested': return 'bg-purple-100 text-purple-700';
      case 'returned': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // ─── Render Item ────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Transaction }) => {
    const isActionLoading = actionLoadingId === item.id;
    const badgeColor = getBadgeColor(item.status);
    const badgeClasses = badgeColor.split(' ');

    return (
      <View className="bg-white rounded-2xl mb-4 shadow-sm border border-slate-100 overflow-hidden">
        {/* Top Info */}
        <View className="p-4 flex-row">
          <View className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden items-center justify-center mr-4">
            {item.asset.imagePath ? (
              <Image 
                source={{ uri: `${SERVER_URL}${item.asset.imagePath}` }} 
                className="w-full h-full" 
                resizeMode="cover" 
              />
            ) : (
              <Package size={24} color="#94A3B8" />
            )}
          </View>
          
          <View className="flex-1">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-slate-900 font-bold text-base flex-1 pr-2" numberOfLines={2}>
                {item.asset.name}
              </Text>
              <View className={`px-2 py-1 rounded-md ${badgeClasses[0]}`}>
                <Text className={`text-[10px] font-extrabold uppercase tracking-widest ${badgeClasses[1]}`}>
                  {item.status === 'return_requested' ? 'Return Request' : item.status}
                </Text>
              </View>
            </View>
            
            <Text className="text-slate-500 text-xs font-medium mb-1">
              Serial: <Text className="text-slate-700">{item.asset.serialNumber}</Text>
            </Text>
            <Text className="text-slate-500 text-xs font-medium mb-1">
              Student: <Text className="text-slate-700">{getUserName(item.user)}</Text>
            </Text>
            <Text className="text-slate-500 text-xs font-medium mb-1">
              Due: <Text className="text-slate-700">{formatDate(item.dueDate)}</Text>
            </Text>
            
            {item.reason && (
              <Text className="text-slate-500 text-xs font-medium italic mt-1">
                Reason: "{item.reason}"
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {item.status === 'pending' && (
          <View className="flex-row border-t border-slate-100">
            <TouchableOpacity 
              onPress={() => approve(item.id)}
              disabled={isActionLoading}
              className="flex-1 py-3 flex-row items-center justify-center bg-green-50"
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <>
                  <Check size={16} color="#059669" />
                  <Text className="text-green-700 font-bold ml-2">Approve</Text>
                </>
              )}
            </TouchableOpacity>
            
            <View className="w-px bg-slate-100" />
            
            <TouchableOpacity 
              onPress={() => reject(item.id)}
              disabled={isActionLoading}
              className="flex-1 py-3 flex-row items-center justify-center bg-red-50"
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <X size={16} color="#DC2626" />
                  <Text className="text-red-600 font-bold ml-2">Reject</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'return_requested' && (
          <View className="px-4 pb-4">
            <TouchableOpacity
              onPress={() => handleConfirmReturn(item.id)}
              className="bg-green-600 rounded-xl py-3 items-center mt-2"
            >
              <Text className="text-white font-bold">Confirm Return</Text>
            </TouchableOpacity>
          </View>
        )}

        {(item.status === 'approved' || item.status === 'rejected') && (
          <View className="border-t border-slate-100 bg-slate-50">
            <TouchableOpacity 
              onPress={() => markReturned(item.id)}
              disabled={isActionLoading}
              className="py-3 flex-row items-center justify-center"
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <>
                  <RotateCcw size={16} color="#2563EB" />
                  <Text className="text-blue-600 font-bold ml-2">Mark Returned</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
          <Text className="text-xl font-bold text-slate-900">Borrow Requests</Text>
          {pendingCount > 0 && (
            <View className="bg-red-500 rounded-full px-2 py-0.5 ml-3">
              <Text className="text-white text-xs font-bold">{pendingCount}</Text>
            </View>
          )}
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
              className={`px-5 py-2 rounded-full border ${
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
              <Text className="text-slate-400 font-medium text-base">No requests found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
