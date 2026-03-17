import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

export default function AssetCard({ asset, onBorrow }) {
  const isAvailable = asset.status === 'Available';

  return (
    <View className="bg-white border-2 border-black mb-6">
      <View className="flex-row p-3">
        {/* Image Placeholder */}
        <View className="w-24 h-24 bg-slate-100 border-2 border-black mr-4 overflow-hidden relative">
          {asset.imageUrl ? (
             <Image source={{ uri: asset.imageUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
             <View className="flex-1 items-center justify-center">
               <Text className="text-slate-400 font-bold text-[10px] uppercase">No Image</Text>
             </View>
          )}
        </View>

        {/* Info Section */}
        <View className="flex-1 justify-between py-1">
          <View className="flex-row justify-between items-start mb-1">
            <View>
              {/* Status Badge */}
              <View
                className={`px-2 py-0.5 border border-black self-start mb-2 ${
                  isAvailable ? 'bg-green-400' : 'bg-red-500'
                }`}
              >
                <Text className="text-[10px] font-black text-black uppercase tracking-wider">
                  {asset.status === 'Available' ? 'Available' : 'Borrowed'}
                </Text>
              </View>

              <Text className="text-black font-black text-sm leading-tight mb-1" numberOfLines={2}>
                {asset.name}
              </Text>
              <Text className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                ID: SUT-{asset.id.padStart(3, '0')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Button Area */}
      {isAvailable ? (
        <TouchableOpacity 
          onPress={onBorrow}
          className="border-t-2 border-black bg-blue-500 py-3 items-center justify-center mx-[2px] mb-[2px]"
          activeOpacity={0.8}
        >
          <Text className="text-black font-black text-xs tracking-widest uppercase">Borrow Asset</Text>
        </TouchableOpacity>
      ) : (
         <View className="border-t-2 border-black bg-slate-200 py-3 items-center justify-center mx-[2px] mb-[2px]">
            <Text className="text-slate-500 font-black text-xs tracking-widest uppercase">Currently Unavailable</Text>
         </View>
      )}
    </View>
  );
}
