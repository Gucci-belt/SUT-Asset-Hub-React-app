import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, RefreshControl,
  Image, Alert, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import {
  ChevronLeft, Clock, KeyRound, HelpCircle,
  LogOut, ChevronRight, Package,
} from 'lucide-react-native';
import { globalAuthToken, setAuthToken } from '../globalAuth';
import BottomTabBar from '../components/BottomTabBar';

// ─── API ──────────────────────────────────────────────────────────────────────
const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  API_BASE_URL = `http://${debuggerHost.split(':')[0]}:3000/api`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile {
  id:        number;
  studentId: string;
  firstName: string | null;
  lastName:  string | null;
  phone:     string | null;
  lineId:    string | null;
  photo:     string | null;
  role:      'student' | 'admin';
  createdAt: string;
  _count:    { transactions: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitial = (firstName?: string | null, studentId?: string): string => {
  if (firstName && firstName.length > 0) return firstName.charAt(0).toUpperCase();
  if (studentId && studentId.length > 0) return studentId.charAt(0).toUpperCase();
  return '?';
};

const getDisplayName = (u: UserProfile): string => {
  if (u.firstName || u.lastName) {
    return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  }
  return u.studentId;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  value: number;
  label: string;
  icon: React.ReactElement;
}
const StatCard: React.FC<StatCardProps> = ({ value, label, icon }) => (
  <View
    className="flex-1 bg-white rounded-2xl py-4 px-3 items-center mx-1"
    style={{ shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}
  >
    <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-2">
      {icon}
    </View>
    <Text className="text-2xl font-extrabold text-slate-900">{value}</Text>
    <Text className="text-xs font-semibold text-slate-400 text-center mt-1">{label}</Text>
  </View>
);

// ─── Info Row ─────────────────────────────────────────────────────────────────
interface InfoRowProps {
  label: string;
  value: string;
  showDivider?: boolean;
}
const InfoRow: React.FC<InfoRowProps> = ({ label, value, showDivider = true }) => (
  <>
    <View className="py-3 px-4">
      <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">{label}</Text>
      <Text className="text-sm font-semibold text-slate-800">{value}</Text>
    </View>
    {showDivider && <View className="h-px bg-slate-50 mx-4" />}
  </>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLineId, setEditLineId] = useState('');
  const [editPhotoUri, setEditPhotoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    try {
      let token = globalAuthToken;
      if (!token) {
        try {
          token = await AsyncStorage.getItem('userToken');
          if (token) setAuthToken(token);
        } catch {
          console.warn('AsyncStorage unavailable');
        }
      }
      if (!token) { router.replace('/'); return; }

      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) { setErrorMsg('Failed to fetch profile. Please log in again.'); return; }

      const data: UserProfile = await res.json();
      setUserData(data);
      setEditFirstName(data.firstName ?? '');
      setEditLastName(data.lastName ?? '');
      setEditPhone(data.phone ?? '');
      setEditLineId(data.lineId ?? '');
      setEditPhotoUri(null);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Network error or server is unreachable.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => { setIsRefreshing(true); fetchUserData(); };

  const handleLogout = async () => {
    try {
      setAuthToken(null);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
    } catch { /* silent */ }
    router.replace('/');
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setEditPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let token = globalAuthToken;
      if (!token) token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      let uploadedPhotoPath = userData?.photo ?? null;

      // Upload photo if changed
      if (editPhotoUri) {
        const formData = new FormData();
        formData.append('image', {
          uri: editPhotoUri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
        const uploadRes = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload`, {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        uploadedPhotoPath = uploadData.imagePath;
      }

      // Update profile
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editFirstName,
          lastName: editLastName,
          phone: editPhone,
          lineId: editLineId,
          photo: uploadedPhotoPath,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      Alert.alert('Success', 'Profile updated!');
      setIsEditing(false);
      fetchUserData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const photoUri = userData?.photo
    ? userData.photo.startsWith('data:') || userData.photo.startsWith('http')
      ? userData.photo
      : `${API_BASE_URL.replace('/api', '')}${userData.photo}`
    : null;

  return (
    <View className="flex-1">
      <View className="flex-1 bg-slate-50 pt-12">
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        {/* ── Header ── */}
        <View className="flex-row items-center px-6 py-4 bg-transparent mb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center"
            style={{ shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 }}
          >
            <ChevronLeft color="#334155" size={24} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-slate-800">My Profile</Text>
          <TouchableOpacity
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className="w-10 h-10 bg-white rounded-full items-center justify-center"
            style={{ shadowColor: '#94A3B8', shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Text className="text-blue-600 text-xs font-bold">{isEditing ? 'Save' : 'Edit'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── States ── */}
        {isLoading && !isRefreshing ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#2563EB" />
          </View>

        ) : errorMsg ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-red-500 text-center font-medium text-base mb-6">{errorMsg}</Text>
            <TouchableOpacity
              onPress={fetchUserData}
              className="bg-white px-6 py-3 rounded-full border border-red-200 mb-3"
            >
              <Text className="text-red-600 font-bold">Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} className="py-2">
              <Text className="text-slate-400 font-medium text-sm">Return to Login</Text>
            </TouchableOpacity>
          </View>

        ) : userData ? (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#2563EB']} />
            }
          >
            {/* ── Profile Card ── */}
            <View
              className="bg-white rounded-[28px] p-6 items-center mb-5 mt-4"
              style={{ shadowColor: '#94A3B8', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }}
            >
              {/* Avatar */}
              <TouchableOpacity onPress={isEditing ? pickPhoto : undefined} activeOpacity={isEditing ? 0.7 : 1}>
                {photoUri || editPhotoUri ? (
                  <Image
                    source={{ uri: editPhotoUri ?? photoUri ?? undefined }}
                    className="w-24 h-24 rounded-full mb-4 border-4 border-blue-50"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4 border-4 border-blue-50">
                    <Text className="text-blue-600 font-extrabold text-4xl">
                      {getInitial(userData.firstName, userData.studentId)}
                    </Text>
                  </View>
                )}
                {isEditing && (
                  <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: '#2563EB', borderRadius: 12, padding: 4 }}>
                    <Text style={{ color: 'white', fontSize: 10 }}>📷</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Display name */}
              <Text className="text-2xl font-bold text-slate-900 text-center mb-1">
                {getDisplayName(userData)}
              </Text>

              {/* Student ID sub-label (always shown) */}
              {(userData.firstName || userData.lastName) && (
                <Text className="text-xs text-slate-400 font-medium mb-1">{userData.studentId}</Text>
              )}

              {/* Role badge */}
              <View
                className="px-4 py-1 rounded-full mt-1 mb-3"
                style={{ backgroundColor: userData.role === 'admin' ? '#EFF6FF' : '#F0FDF4' }}
              >
                <Text
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: userData.role === 'admin' ? '#1D4ED8' : '#15803D' }}
                >
                  {userData.role}
                </Text>
              </View>

              <Text className="text-xs font-medium text-slate-400">
                {`Member since ${formatDate(userData.createdAt)}`}
              </Text>
            </View>

            {/* ── Stats Row ── */}
            <View className="flex-row mb-5">
              <StatCard
                value={userData._count?.transactions ?? 0}
                label="Total Borrowed"
                icon={<Package size={18} color="#2563EB" />}
              />
            </View>

            {/* ── Info Section ── */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
              Personal Info
            </Text>
            {isEditing ? (
              <View className="bg-white rounded-[24px] overflow-hidden mb-5"
                style={{ shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}>
                
                <View className="py-3 px-4 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">First Name</Text>
                  <TextInput
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="First name"
                    placeholderTextColor="#94A3B8"
                    className="text-sm font-semibold text-slate-800"
                  />
                </View>

                <View className="py-3 px-4 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Last Name</Text>
                  <TextInput
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="Last name"
                    placeholderTextColor="#94A3B8"
                    className="text-sm font-semibold text-slate-800"
                  />
                </View>

                <View className="py-3 px-4 border-b border-slate-50">
                  <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Phone</Text>
                  <TextInput
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Phone number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    className="text-sm font-semibold text-slate-800"
                  />
                </View>

                <View className="py-3 px-4">
                  <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">LINE ID</Text>
                  <TextInput
                    value={editLineId}
                    onChangeText={setEditLineId}
                    placeholder="LINE ID"
                    placeholderTextColor="#94A3B8"
                    className="text-sm font-semibold text-slate-800"
                  />
                </View>
              </View>
            ) : (
              <View
                className="bg-white rounded-[24px] overflow-hidden mb-5"
                style={{ shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}
              >
                <InfoRow label="Student ID" value={userData.studentId} />
                <InfoRow
                  label="Phone"
                  value={userData.phone ?? '—'}
                />
                <InfoRow
                  label="LINE ID"
                  value={userData.lineId ?? '—'}
                  showDivider={false}
                />
              </View>
            )}

            {/* ── Account Settings ── */}
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
              Account Settings
            </Text>
            <View
              className="bg-white rounded-[24px] overflow-hidden mb-5"
              style={{ shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}
            >
              <TouchableOpacity
                onPress={() => router.push('/history')}
                className="flex-row items-center p-4 border-b border-slate-50"
              >
                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-4">
                  <Clock color="#2563EB" size={20} />
                </View>
                <Text className="flex-1 text-slate-700 font-semibold text-sm">Borrowing History</Text>
                <ChevronRight color="#CBD5E1" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/reset')}
                className="flex-row items-center p-4 border-b border-slate-50"
              >
                <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center mr-4">
                  <KeyRound color="#10B981" size={20} />
                </View>
                <Text className="flex-1 text-slate-700 font-semibold text-sm">Change PIN</Text>
                <ChevronRight color="#CBD5E1" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Alert.alert('Help Center', 'Contact admin at admin@sut.ac.th')}
                className="flex-row items-center p-4"
              >
                <View className="w-10 h-10 bg-orange-50 rounded-full items-center justify-center mr-4">
                  <HelpCircle color="#F97316" size={20} />
                </View>
                <Text className="flex-1 text-slate-700 font-semibold text-sm">Help Center</Text>
                <ChevronRight color="#CBD5E1" size={20} />
              </TouchableOpacity>
            </View>

            {/* ── Logout ── */}
            {isEditing && (
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(false);
                  setEditFirstName(userData.firstName ?? '');
                  setEditLastName(userData.lastName ?? '');
                  setEditPhone(userData.phone ?? '');
                  setEditLineId(userData.lineId ?? '');
                  setEditPhotoUri(null);
                }}
                className="flex-row items-center justify-center bg-slate-100 py-4 rounded-2xl mb-3"
              >
                <Text className="text-slate-500 font-bold text-base">Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-center bg-red-50 py-4 rounded-2xl border border-red-100"
            >
              <LogOut color="#EF4444" size={20} />
              <Text className="text-red-500 font-bold text-base ml-2">Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : null}
      </View>
      <BottomTabBar activeTab="profile" />
    </View>
  );
}
