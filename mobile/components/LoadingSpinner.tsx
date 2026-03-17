import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <View className="flex-1 justify-center items-center bg-white/80 absolute inset-0 z-50">
      <View className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 items-center">
        <ActivityIndicator size="large" color="#ea580c" />
        <Text className="mt-4 text-slate-600 font-medium">{text}</Text>
      </View>
    </View>
  );
}
