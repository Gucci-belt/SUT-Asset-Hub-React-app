import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StatusBar, ActivityIndicator, Alert, Modal, Image,
  RefreshControl, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { ChevronLeft, Search, Pencil, Trash2, Image as ImageIcon } from 'lucide-react-native';

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
interface Asset {
  id: number;
  name: string;
  serialNumber: string;
  category: string;
  status: 'available' | 'borrowed' | 'maintenance';
  imagePath: string | null;
  description: string | null;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'IoT', 'Laptops', 'Cameras', 'Sensors', 'Network', 'Audio'] as const;
const STATUSES = ['available', 'borrowed', 'maintenance'] as const;

// ─── Helper Components ────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: Asset['status'] }) => {
  let bg = 'bg-slate-100';
  let text = 'text-slate-600';

  if (status === 'available') {
    bg = 'bg-emerald-100';
    text = 'text-emerald-700';
  } else if (status === 'borrowed') {
    bg = 'bg-blue-100';
    text = 'text-blue-700';
  } else if (status === 'maintenance') {
    bg = 'bg-orange-100';
    text = 'text-orange-700';
  }

  return (
    <View className={`px-2.5 py-1 rounded-full ${bg} self-start`}>
      <Text className={`text-[10px] font-bold capitalize ${text}`}>{status}</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function InventoryScreen() {
  const router = useRouter();

  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Edit Modal State
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    description: '',
    status: 'available' as Asset['status'],
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────
  const fetchAssets = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_BASE_URL}/assets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAssets(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load assets', err);
      setError('Failed to load assets');
    }
  };

  const initialFetch = useCallback(async () => {
    setLoading(true);
    await fetchAssets();
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      initialFetch();
    }, [initialFetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssets();
    setRefreshing(false);
  };

  // ─── Delete Asset ───────────────────────────────────────────────────────────
  const deleteAsset = async (id: number, name: string) => {
    Alert.alert(
      'Delete Asset',
      `Delete "${name}"? This will also delete all related transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await axios.delete(`${API_BASE_URL}/assets/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setAssets((prev) => prev.filter((a) => a.id !== id));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete asset');
            }
          },
        },
      ]
    );
  };

  // ─── Edit Asset ─────────────────────────────────────────────────────────────
  const openEditModal = (asset: Asset) => {
    setEditForm({
      name: asset.name,
      category: asset.category,
      description: asset.description || '',
      status: asset.status,
    });
    setEditingAsset(asset);
  };

  const closeEditModal = () => {
    setEditingAsset(null);
  };

  const updateAsset = async () => {
    if (!editingAsset) return;
    if (!editForm.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(
        `${API_BASE_URL}/assets/${editingAsset.id}`,
        {
          name: editForm.name.trim(),
          category: editForm.category,
          description: editForm.description.trim(),
          status: editForm.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAssets((prev) =>
        prev.map((a) => (a.id === editingAsset.id ? { ...a, ...editForm } : a))
      );
      setEditingAsset(null);
      Alert.alert('Success', 'Asset updated!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update asset');
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Filtered Data ──────────────────────────────────────────────────────────
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || a.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [assets, searchQuery, selectedCategory]);

  // ─── Render Item ────────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Asset }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 flex-row shadow-sm border border-slate-100">
      {/* Image */}
      <View className="w-16 h-16 rounded-xl bg-slate-100 items-center justify-center mr-4 overflow-hidden border border-slate-200">
        {item.imagePath ? (
          <Image
            source={{ uri: `${SERVER_URL}${item.imagePath}` }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <ImageIcon size={24} color="#94A3B8" />
        )}
      </View>

      {/* Info */}
      <View className="flex-1 justify-center">
        <Text className="text-slate-900 font-bold text-sm mb-1" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-slate-500 font-medium text-xs mb-2">
          {item.serialNumber}
        </Text>
        <View className="flex-row items-center gap-2 flex-wrap">
          <View className="bg-slate-100 px-2 py-1 rounded-md">
            <Text className="text-slate-600 text-[10px] font-bold">{item.category}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
      </View>

      {/* Actions */}
      <View className="justify-between items-center pl-2">
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mb-2"
        >
          <Pencil size={14} color="#2563EB" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteAsset(item.id, item.name)}
          className="w-8 h-8 rounded-full bg-red-50 items-center justify-center"
        >
          <Trash2 size={14} color="#EF4444" />
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
          <Text className="text-xl font-bold text-slate-900">Inventory</Text>
        </View>
        <View className="bg-blue-100 px-3 py-1 rounded-full">
          <Text className="text-blue-700 font-bold text-sm">{assets.length} Total</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="bg-white px-4 py-3 border-b border-slate-100">
        <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-2.5">
          <Search size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search by name or serial..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-slate-900 text-sm font-medium"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* Category Tabs */}
      <View className="bg-white border-b border-slate-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full border ${
                selectedCategory === cat
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedCategory === cat ? 'text-white' : 'text-slate-600'
                }`}
              >
                {cat}
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
          data={filteredAssets}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-slate-400 font-medium text-base">No assets found</Text>
            </View>
          }
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={!!editingAsset}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-center bg-black/50 p-4"
        >
          <View className="bg-white rounded-3xl overflow-hidden max-h-[90%]">
            <View className="p-5 border-b border-slate-100">
              <Text className="text-xl font-bold text-slate-900">Edit Asset</Text>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false} bounces={false}>
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Name
              </Text>
              <TextInput
                value={editForm.name}
                onChangeText={(v) => setEditForm({ ...editForm, name: v })}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium mb-4"
              />

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => {
                  const active = editForm.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setEditForm({ ...editForm, category: cat })}
                      className={`px-3 py-1.5 rounded-full border ${
                        active ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-600'}`}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Status
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {STATUSES.map((status) => {
                  const active = editForm.status === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setEditForm({ ...editForm, status })}
                      className={`px-3 py-1.5 rounded-full border ${
                        active ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold capitalize ${
                          active ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Description
              </Text>
              <TextInput
                value={editForm.description}
                onChangeText={(v) => setEditForm({ ...editForm, description: v })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium mb-6 min-h-[80px]"
              />
            </ScrollView>

            <View className="p-5 border-t border-slate-100 flex-row justify-end gap-3 bg-slate-50">
              <TouchableOpacity
                onPress={closeEditModal}
                disabled={isUpdating}
                className="px-6 py-3 rounded-xl bg-slate-200"
              >
                <Text className="text-slate-700 font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={updateAsset}
                disabled={isUpdating}
                className="px-6 py-3 rounded-xl bg-blue-600 flex-row items-center"
              >
                {isUpdating && <ActivityIndicator color="white" size="small" className="mr-2" />}
                <Text className="text-white font-bold">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
