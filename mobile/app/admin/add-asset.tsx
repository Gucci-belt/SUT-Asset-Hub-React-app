import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StatusBar, Alert, ActivityIndicator, Image,
} from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ChevronLeft, ImagePlus } from 'lucide-react-native';

// ─── API ──────────────────────────────────────────────────────────────────────
const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  API_BASE_URL = `http://${debuggerHost.split(':')[0]}:3000/api`;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['IoT', 'Laptops', 'Cameras', 'Sensors', 'Network', 'Audio'] as const;
type Category = typeof CATEGORIES[number];
type Status = 'available' | 'maintenance';

// ─── Sub-components ───────────────────────────────────────────────────────────
const FieldLabel: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
  <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
    {text}{required ? <Text className="text-red-500"> *</Text> : null}
  </Text>
);

const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View
    className="bg-white rounded-2xl px-4 py-4 mb-4"
    style={{ shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}
  >
    {children}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AddAssetScreen() {
  const [name, setName]               = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [category, setCategory]       = useState<Category | ''>('');
  const [description, setDescription] = useState('');
  const [status, setStatus]           = useState<Status>('available');
  const [imageUri, setImageUri]       = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(false);

  // ── Image picker ──────────────────────────────────────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name || !serialNumber || !category) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }
    setIsLoading(true)
    try {
      let imagePath = null

      // Step 1: Upload image if selected
      if (imageUri) {
        const formData = new FormData()
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'asset.jpg',
        } as any)

        const uploadRes = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload`, {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        imagePath = uploadData.imagePath
      }

      // Step 2: Create asset with imagePath
      const token = await SecureStore.getItemAsync('token')
      const res = await fetch(`${API_BASE_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, serialNumber, category, status, description, imagePath }),
      })
      if (!res.ok) throw new Error('Failed to create asset')
      Alert.alert('Success', 'Asset created!', [{ text: 'OK', onPress: () => router.back() }])
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setIsLoading(false)
    }
  };

  const canSubmit = name.trim().length > 0 && serialNumber.trim().length > 0 && category !== '' && !isLoading;

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Header ── */}
      <View
        className="bg-white flex-row items-center px-4 pt-14 pb-4"
        style={{ borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3"
        >
          <ChevronLeft size={22} color="#334155" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900">Add Asset</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Basic Info ── */}
        <SectionCard>
          <FieldLabel text="Asset Name" required />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. MacBook Pro 14"
            placeholderTextColor="#CBD5E1"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium mb-4"
            autoCapitalize="words"
          />
          <FieldLabel text="Serial Number" required />
          <TextInput
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="e.g. SUT-001"
            placeholderTextColor="#CBD5E1"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </SectionCard>

        {/* ── Category ── */}
        <SectionCard>
          <FieldLabel text="Category" required />
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full border ${
                    active ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-slate-200'
                  }`}
                >
                  <Text className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-600'}`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* ── Description ── */}
        <SectionCard>
          <FieldLabel text="Description" />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Optional — describe the asset's condition, specs, etc."
            placeholderTextColor="#CBD5E1"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
          />
        </SectionCard>

        {/* ── Status ── */}
        <SectionCard>
          <FieldLabel text="Initial Status" />
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setStatus('available')}
              className={`flex-1 py-3 rounded-xl border items-center ${
                status === 'available'
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`text-sm font-bold ${status === 'available' ? 'text-white' : 'text-slate-400'}`}>
                Available
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setStatus('maintenance')}
              className={`flex-1 py-3 rounded-xl border items-center ${
                status === 'maintenance'
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`text-sm font-bold ${status === 'maintenance' ? 'text-white' : 'text-slate-400'}`}>
                Maintenance
              </Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* ── Photo ── */}
        {/* ── Photo ── */}
        <TouchableOpacity onPress={pickImage} className="border-2 border-dashed border-gray-300 rounded-2xl h-40 items-center justify-center mb-4">
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="w-full h-full rounded-2xl" resizeMode="cover" />
          ) : (
            <View className="items-center">
              <Text className="text-4xl mb-2">📷</Text>
              <Text className="text-gray-400 text-sm">Tap to select image</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Submit ── */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          className={`py-4 rounded-2xl items-center ${canSubmit ? 'bg-[#2563EB]' : 'bg-slate-200'}`}
          style={canSubmit ? { shadowColor: '#2563EB', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 } : {}}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className={`font-bold text-base ${canSubmit ? 'text-white' : 'text-slate-400'}`}>
              Add Asset
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
