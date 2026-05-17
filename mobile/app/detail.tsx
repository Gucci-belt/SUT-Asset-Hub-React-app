import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'lucide-react-native';
import { globalAuthToken, setAuthToken } from '../globalAuth';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';
import BottomTabBar from '../components/BottomTabBar';

// ─── API ──────────────────────────────────────────────────────────────────────
const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  API_BASE_URL = `http://${debuggerHost.split(':')[0]}:3000/api`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type AssetStatus = 'available' | 'borrowed' | 'maintenance';

interface Asset {
  id: number;
  name: string;
  serialNumber: string;
  category: string;
  description?: string;
  status: AssetStatus;
  imagePath?: string;
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<AssetStatus, { label: string; bg: string; text: string }> = {
  available:   { label: 'Available',   bg: '#e6f4ea', text: '#008a2e' },
  borrowed:    { label: 'Borrowed',    bg: '#fff3e0', text: '#e67c00' },
  maintenance: { label: 'Maintenance', bg: '#ffdad6', text: '#ba1a1a' },
};

const BORROW_LABEL: Record<AssetStatus, string> = {
  available:   'Borrow Now',
  borrowed:    'Currently Unavailable',
  maintenance: 'Under Maintenance',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View className="flex-1 bg-slate-50 rounded-xl p-3 mx-1">
    <Text className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</Text>
    <Text className="text-sm font-semibold text-slate-800">{value}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  const getToken = useCallback(async (): Promise<string | null> => {
    if (globalAuthToken) return globalAuthToken;
    try {
      const stored = await SecureStore.getItemAsync('token');
      if (stored) setAuthToken(stored);
      return stored;
    } catch {
      return null;
    }
  }, []);

  const fetchAsset = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/assets/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: Asset = await res.json();
      setAsset(data);
    } catch {
      setError('Failed to load asset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  const imageUri = asset?.imagePath
    ? `${API_BASE_URL.replace('/api', '')}${asset.imagePath}`
    : null;

  const statusCfg = asset ? STATUS_CONFIG[asset.status] : null;

  if (isLoading) return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );

  if (error) return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-red-500">{error}</Text>
      <TouchableOpacity onPress={fetchAsset} className="mt-4">
        <Text className="text-blue-600 font-semibold">Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (!asset) return null;

  return (
    <View className="flex-1">
      <View className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
            >
              {/* ── Hero Image ── */}
              <View className="w-full bg-slate-100 relative" style={{ height: 280 }}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
                  </View>
                )}

                {/* Dark Gradient Overlay */}
                <View 
                  className="absolute bottom-0 left-0 right-0 h-32" 
                  style={{ backgroundImage: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))' } as any}
                />

                {/* Back Button */}
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white items-center justify-center z-10"
                  style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 }}
                >
                  <Ionicons name="chevron-back" size={22} color="#0F172A" />
                </TouchableOpacity>

                {/* Status Badge (Top-Right) */}
                {statusCfg && (
                  <View
                    className="absolute top-12 right-4 px-3 py-1.5"
                    style={{ backgroundColor: statusCfg.bg, borderRadius: 9999 }}
                  >
                    <Text className="text-xs font-bold" style={{ color: statusCfg.text }}>
                      {statusCfg.label}
                    </Text>
                  </View>
                )}

                {/* Asset Name (Bottom-Left on image) */}
                <View style={{ position: 'absolute', bottom: 32, left: 20, right: 20 }}>
                  <Text 
                    className="text-white text-xl font-bold"
                    style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }}
                  >
                    {asset?.name}
                  </Text>
                </View>
              </View>

              {/* ── Content Panel ── */}
              <View className="bg-white" style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, paddingTop: 24, paddingHorizontal: 20 }}>
                {/* Info Grid */}
                <View className="flex-row mb-6 mx-[-4px]">
                  <InfoRow label="Category" value={asset?.category as string} />
                  <InfoRow label="Serial No." value={asset?.serialNumber as string} />
                </View>

                {/* Description */}
                {asset?.description ? (
                  <View className="mb-6">
                    <Text className="text-sm font-semibold text-slate-400 tracking-wide mb-2">Description</Text>
                    <Text className="text-base text-slate-700 leading-relaxed capitalize">{asset?.description}</Text>
                  </View>
                ) : null}

                {/* Error banner (borrow failure) */}
                {error && asset && (
                  <View className="bg-[#ffdad6] rounded-2xl px-4 py-3 flex-row items-center mb-4">
                    <Ionicons name="alert-circle" size={20} color="#ba1a1a" />
                    <Text className="text-sm font-bold ml-2" style={{ color: '#ba1a1a' }}>
                      {error}
                    </Text>
                  </View>
                )}

                {/* ── Borrow CTA ── */}
                <View className="mt-4 pb-4 bg-white">
                  {asset?.status === 'available' && (
                    <>
                      <View className="mb-4">
                        <Text className="text-sm font-semibold text-slate-700 mb-2">Return Date</Text>
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(true)}
                          className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-3"
                        >
                          <Calendar size={20} color="#2563EB" />
                          <Text className="text-gray-800 font-medium flex-1 ml-3">
                            {dueDate.toLocaleDateString('th-TH', { 
                              day: 'numeric', month: 'long', year: 'numeric' 
                            })}
                          </Text>
                          <Text className="text-blue-600 font-medium">Change</Text>
                        </TouchableOpacity>
                      </View>

                      {showDatePicker && (
                        <DateTimePicker
                          value={dueDate}
                          mode="date"
                          minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // min: tomorrow
                          onChange={(event, date) => {
                            setShowDatePicker(false);
                            if (date) setDueDate(date);
                          }}
                        />
                      )}
                    </>
                  )}

                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '/student-verify',
                      params: {
                        assetId: String(asset.id),
                        dueDate: dueDate.toISOString(),
                      }
                    })}
                    disabled={asset?.status !== 'available'}
                    className={`py-4 rounded-2xl items-center ${
                      asset?.status === 'available'
                        ? 'bg-[#2563EB]'
                        : 'bg-slate-200'
                    }`}
                    style={
                      asset?.status === 'available'
                        ? { shadowColor: '#2563EB', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 }
                        : {}
                    }
                  >
                    <Text
                      className={`text-base font-bold ${
                        asset?.status === 'available'
                          ? 'text-white'
                          : 'text-slate-400'
                      }`}
                    >
                      {asset?.status !== 'available' ? 'Not Available' : 'Borrow Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </>
      </View>

      <BottomTabBar activeTab="home" />
    </View>
  );
}
