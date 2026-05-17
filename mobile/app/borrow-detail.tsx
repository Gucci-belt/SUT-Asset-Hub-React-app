import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { ChevronLeft } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// ─── API ──────────────────────────────────────────────────────────────────────
const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  API_BASE_URL = `http://${debuggerHost.split(':')[0]}:3000/api`;
}

interface TransactionDetail {
  id:         number
  status:     'pending' | 'approved' | 'returned' | 'rejected'
  borrowDate: string
  returnDate: string | null
  dueDate:    string | null
  reason:     string | null
  asset: {
    id:          number
    name:        string
    serialNumber: string
    category:    string
    imagePath:   string | null
  }
  user: {
    studentId: string
    firstName: string | null
  }
}

const fmtDate = (d?: string | null): string => {
  if (!d) return '—';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yy = String(dt.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

export default function BorrowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newDueDate, setNewDueDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));

  const fetchDetail = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/transactions/my-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data: TransactionDetail[] = await res.json();
      const found = data.find(t => String(t.id) === id);
      if (found) setTx(found);
    } catch (err) {
      Alert.alert('Error', 'Unable to load transaction details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleExtend = async (selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate || !tx) return;
    
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/transactions/${tx.id}/extend`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ newDueDate: selectedDate.toISOString() })
      });
      if (!res.ok) throw new Error('Failed to extend');
      Alert.alert('Extended!', 'Due date updated successfully.');
      fetchDetail();
    } catch (err) {
      Alert.alert('Error', 'Could not extend due date.');
      setLoading(false);
    }
  };

  const handleCancelBorrow = () => {
    Alert.alert(
      'Confirm Return?',
      'Do you want to send a return request to the admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, send request',
          style: 'destructive',
          onPress: async () => {
            if (!tx) return;
            try {
              const token = await SecureStore.getItemAsync('token');
              const res = await fetch(`${API_BASE_URL}/transactions/${tx.id}/request-return`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              if (!res.ok) throw new Error('Failed to request return');
              fetchDetail(); // refresh state
            } catch (err) {
              Alert.alert('Error', 'Could not send return request.');
            }
          }
        }
      ]
    );
  };

  const handleCancelRequest = async () => {
    if (!tx) return;
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/transactions/${tx.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to cancel request');
      router.replace('/history');
    } catch (err) {
      Alert.alert('Error', 'Could not cancel request.');
      setLoading(false);
    }
  };

  if (loading && !tx) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!tx) {
    return (
      <View className="flex-1 bg-slate-50 pt-12">
        <Text className="text-center mt-10">Transaction not found.</Text>
      </View>
    );
  }

  const isOverdue = tx.dueDate && new Date(tx.dueDate) < new Date() && tx.status === 'approved';

  const getBannerColor = () => {
    switch (tx?.status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'return_requested': return 'bg-purple-500';
      case 'returned': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getBannerText = () => {
    switch (tx?.status) {
      case 'pending': return '⏳ Waiting for Admin Approval';
      case 'approved': return '✅ Currently Borrowing';
      case 'return_requested': return '🔄 Return Pending Verification';
      case 'returned': return '📦 Returned';
      case 'rejected': return '❌ Request Rejected';
      default: return 'Status Unknown';
    }
  };

  const minExtend = new Date();
  minExtend.setDate(minExtend.getDate() + 1); // tomorrow

  return (
    <View className="flex-1 bg-slate-50 pt-12">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="bg-white flex-row items-center px-4 py-4 border-b border-slate-200">
        <TouchableOpacity
          onPress={() => router.replace('/history')}
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3"
        >
          <ChevronLeft size={22} color="#334155" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900">Borrow Detail</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Status Banner */}
        <View className={`${getBannerColor()} px-4 py-3 items-center justify-center`}>
          <Text className="text-white font-bold">{getBannerText()}</Text>
        </View>

        {/* Asset Info Card */}
        <View className="bg-white m-4 rounded-2xl p-4 flex-row shadow-sm border border-slate-100">
          <View className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden mr-4 border border-slate-200">
            {tx.asset.imagePath ? (
              <Image 
                source={{ 
                  uri: tx.asset.imagePath.startsWith('http') 
                    ? tx.asset.imagePath 
                    : `${API_BASE_URL.replace('/api', '')}${tx.asset.imagePath}` 
                }} 
                className="w-full h-full" 
                resizeMode="cover" 
              />
            ) : null}
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-xl font-bold text-slate-900 mb-1" numberOfLines={2}>
              {tx.asset.name}
            </Text>
            <Text className="text-sm text-slate-500 mb-2">Serial: {tx.asset.serialNumber}</Text>
            <View className="bg-blue-50 self-start px-2 py-1 rounded border border-blue-200">
              <Text className="text-blue-700 text-xs font-bold">{tx.asset.category}</Text>
            </View>
          </View>
        </View>

        {/* Borrow Details Card */}
        <View className="bg-white mx-4 rounded-2xl p-4 shadow-sm border border-slate-100">
          <Text className="text-base font-bold text-slate-800 mb-4">Transaction Details</Text>
          
          <View className="flex-row justify-between mb-3">
            <Text className="text-slate-500 font-medium">Transaction ID</Text>
            <Text className="text-slate-800 font-bold">#{tx.id}</Text>
          </View>
          
          <View className="flex-row justify-between mb-3">
            <Text className="text-slate-500 font-medium">Borrow Date</Text>
            <Text className="text-slate-800 font-bold">{fmtDate(tx.borrowDate)}</Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-slate-500 font-medium">Due Date</Text>
            <Text className={`font-bold ${isOverdue ? 'text-red-500' : 'text-slate-800'}`}>
              {fmtDate(tx.dueDate)}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-slate-500 font-medium">Return Date</Text>
            <Text className="text-slate-800 font-bold">{fmtDate(tx.returnDate)}</Text>
          </View>

          <View className="flex-row justify-between mt-2 pt-3 border-t border-slate-100">
            <Text className="text-slate-500 font-medium">Reason</Text>
            <Text className="text-slate-800 flex-1 text-right ml-4">
              {tx.reason || '—'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-4 mt-6 gap-3">
          {(tx?.status === 'approved' || tx?.status === 'return_requested') && (
            <>
              {tx?.status === 'approved' && (
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(true)}
                  className="bg-blue-600 rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-bold text-base">Extend Due Date</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={tx?.status === 'return_requested' ? undefined : handleCancelBorrow}
                disabled={tx?.status === 'return_requested'}
                className={`${tx?.status === 'return_requested' ? 'bg-gray-400' : 'bg-white border-2 border-red-500'} rounded-xl py-4 items-center`}
              >
                <Text className={`${tx?.status === 'return_requested' ? 'text-white' : 'text-red-500'} font-bold text-base`}>
                  {tx?.status === 'return_requested' ? 'Return Pending Verification' : 'Return Early / Cancel Borrow'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {tx?.status === 'pending' && (
            <TouchableOpacity 
              onPress={handleCancelRequest}
              className="bg-red-50 rounded-xl py-4 items-center border border-red-200"
            >
              <Text className="text-red-600 font-bold text-base">Cancel Request</Text>
            </TouchableOpacity>
          )}

          {(tx?.status === 'returned' || tx?.status === 'rejected') && (
            <View className="bg-slate-100 rounded-xl py-4 items-center">
              <Text className="text-slate-400 font-bold">No actions available</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={newDueDate}
          mode="date"
          display="default"
          minimumDate={minExtend}
          onChange={(event, date) => {
            if (event.type === 'set' && date) {
              handleExtend(date);
            } else {
              setShowDatePicker(false);
            }
          }}
        />
      )}
    </View>
  );
}
