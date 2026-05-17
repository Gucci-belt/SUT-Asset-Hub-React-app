import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StatusBar, ActivityIndicator, Alert, Image,
  RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';
import { ChevronLeft, Search, Trash2, Shield, User, ArrowRightLeft } from 'lucide-react-native';

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
interface AppUser {
  id: number;
  studentId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  lineId: string | null;
  role: 'student' | 'admin';
  photo: string | null;
  createdAt: string;
  _count: { transactions: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_FILTERS = ['All', 'student', 'admin'] as const;

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UsersScreen() {
  const router = useRouter();

  // State
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<typeof ROLE_FILTERS[number]>('All');

  // ─── Fetch Data ─────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load users', err);
      setError('Failed to load users');
    }
  };

  const initialFetch = useCallback(async () => {
    setLoading(true);
    await fetchUsers();
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      initialFetch();
    }, [initialFetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  // ─── Change Role ────────────────────────────────────────────────────────────
  const changeRole = async (user: AppUser) => {
    const newRole = user.role === 'student' ? 'admin' : 'student';
    Alert.alert(
      'Change Role',
      `Change ${user.studentId} to ${newRole.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('token');
              await axios.patch(
                `${API_BASE_URL}/users/${user.id}/role`,
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
              );
            } catch (err) {
              Alert.alert('Error', 'Failed to change role');
            }
          },
        },
      ]
    );
  };

  // ─── Delete User ────────────────────────────────────────────────────────────
  const deleteUser = async (user: AppUser) => {
    Alert.alert(
      'Delete User',
      `Delete "${user.studentId}"? All their transactions will be deleted too.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('token');
              await axios.delete(`${API_BASE_URL}/users/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
            } catch (err: any) {
              const msg = err.response?.data?.error || 'Failed to delete user';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  // ─── Filtered Data ──────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const nameMatch =
        u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q);
      const idMatch = u.studentId.toLowerCase().includes(q);
      const matchesSearch = nameMatch || idMatch;

      const matchesRole = selectedRole === 'All' || u.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRole]);

  // ─── Helper ─────────────────────────────────────────────────────────────────
  const getInitials = (u: AppUser) => {
    if (u.firstName) return u.firstName.charAt(0).toUpperCase();
    return u.studentId.charAt(0).toUpperCase();
  };

  const getFullName = (u: AppUser) => {
    if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
    if (u.firstName) return u.firstName;
    return u.studentId;
  };

  // ─── Render Item ────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: AppUser }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100 flex-row items-center">
      {/* Avatar */}
      <View className="w-12 h-12 rounded-full bg-slate-200 items-center justify-center mr-4 overflow-hidden border border-slate-300">
        {item.photo ? (
          <Image
            source={{ uri: `${SERVER_URL}${item.photo}` }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-slate-500 font-bold text-lg">{getInitials(item)}</Text>
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
            {getFullName(item)}
          </Text>
        </View>

        <Text className="text-slate-500 text-xs font-medium mb-1">{item.studentId}</Text>
        
        <View className="flex-row items-center gap-2">
          {item.role === 'admin' ? (
            <View className="bg-blue-100 px-2 py-0.5 rounded-full flex-row items-center">
              <Shield size={10} color="#1D4ED8" className="mr-1" />
              <Text className="text-blue-700 text-[10px] font-bold uppercase">ADMIN</Text>
            </View>
          ) : (
            <View className="bg-slate-100 px-2 py-0.5 rounded-full flex-row items-center">
              <User size={10} color="#475569" className="mr-1" />
              <Text className="text-slate-600 text-[10px] font-bold uppercase">STUDENT</Text>
            </View>
          )}

          <Text className="text-slate-400 text-[10px] font-medium">
            • {item._count?.transactions || 0} borrowed
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row items-center gap-2 ml-2">
        <TouchableOpacity
          onPress={() => changeRole(item)}
          className="bg-slate-100 px-3 py-2 rounded-xl flex-row items-center"
        >
          <ArrowRightLeft size={14} color="#475569" />
          <Text className="text-slate-600 text-xs font-bold ml-1">
            {item.role === 'admin' ? 'Make Student' : 'Make Admin'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => deleteUser(item)}
          className="w-9 h-9 rounded-xl bg-red-50 items-center justify-center"
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
          <Text className="text-xl font-bold text-slate-900">Users</Text>
        </View>
        <View className="bg-blue-100 px-3 py-1 rounded-full">
          <Text className="text-blue-700 font-bold text-sm">{users.length} Total</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="bg-white px-4 py-3 border-b border-slate-100">
        <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-2.5">
          <Search size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search by ID or name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-slate-900 text-sm font-medium"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* Role Tabs */}
      <View className="bg-white border-b border-slate-100 px-4 py-3 flex-row gap-2">
        {ROLE_FILTERS.map((role) => (
          <TouchableOpacity
            key={role}
            onPress={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded-full border ${
              selectedRole === role
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-slate-200'
            }`}
          >
            <Text
              className={`text-xs font-bold capitalize ${
                selectedRole === role ? 'text-white' : 'text-slate-600'
              }`}
            >
              {role}
            </Text>
          </TouchableOpacity>
        ))}
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
          data={filteredUsers}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-slate-400 font-medium text-base">No users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
