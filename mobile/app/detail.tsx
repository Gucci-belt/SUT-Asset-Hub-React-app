import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import CustomButton from '../components/CustomButton';

// Mock data (Normally this would come from an API based on an ID passed from the Scanner)
const MOCK_ASSET_DETAIL = {
  id: '014',
  name: 'MacBook Air M2',
  category: 'Laptops',
  status: 'Available',
  description: '13.6-inch Liquid Retina display, M2 chip with 8-core CPU and 8-core GPU. Ideal for development and design tasks.',
  brand: 'Apple',
  imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=600&auto=format&fit=crop',
};

export default function AssetDetailScreen() {
  const router = useRouter();
  const asset = MOCK_ASSET_DETAIL; // Replace with fetched data later
  const isAvailable = asset.status === 'Available';

  const handleBorrowNow = () => {
    alert(`Successfully borrowed ${asset.name}!`);
    router.replace('/home'); // Go back to home after borrowing
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header overlaid on image */}
      <View className="absolute top-12 w-full px-4 z-10 flex-row justify-between items-center">
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold text-lg">{'<'}</Text>
        </TouchableOpacity>
        <Text className="text-white font-semibold text-lg drop-shadow-md">Asset Details</Text>
        <View className="w-10 h-10" /> {/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Media Section */}
        <View className="w-full h-80 bg-slate-100">
          <Image 
            source={{ uri: asset.imageUrl }} 
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Info Panel pulling up over the image */}
        <View className="bg-white rounded-t-3xl -mt-6 pt-8 px-6 min-h-[500px]">
          {/* Title & Status */}
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1 mr-4">
              <Text className="text-3xl font-bold text-slate-900 mb-1">{asset.name}</Text>
              <Text className="text-slate-500 font-medium">{asset.category}</Text>
            </View>
            <View
              className={`px-3 py-1.5 rounded-lg ${
                isAvailable ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isAvailable ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {asset.status}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-slate-800 mb-2">Description</Text>
            <Text className="text-slate-600 leading-relaxed">
              {asset.description}
            </Text>
          </View>

          {/* Specifications Grid */}
          <Text className="text-lg font-semibold text-slate-800 mb-3">Specifications</Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            <View className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
              <Text className="text-slate-500 text-xs mb-1">Asset ID</Text>
              <Text className="text-slate-800 font-medium">{asset.id}</Text>
            </View>
            <View className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
              <Text className="text-slate-500 text-xs mb-1">Brand</Text>
              <Text className="text-slate-800 font-medium">{asset.brand}</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      {isAvailable && (
        <View className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-6 py-4 pb-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <CustomButton 
            title="Borrow Now" 
            onPress={handleBorrowNow}
          />
        </View>
      )}
    </View>
  );
}
