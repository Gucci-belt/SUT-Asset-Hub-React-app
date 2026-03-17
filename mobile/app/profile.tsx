import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import CustomButton from '../components/CustomButton';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace('/'); // Go back to login
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-slate-800 font-bold text-xl">{'<'} Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-800">My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        {/* User Card */}
        <View className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 items-center mb-8">
          <View className="w-24 h-24 bg-orange-100 rounded-full items-center justify-center mb-4">
            <Text className="text-orange-500 font-bold text-4xl">S</Text>
          </View>
          <Text className="text-2xl font-bold text-slate-800 mb-1">Somchai Jaidee</Text>
          <Text className="text-slate-500 font-medium">Student ID: B6700000</Text>
        </View>

        {/* History Section */}
        <Text className="text-lg font-bold text-slate-800 mb-4">Borrowing History</Text>
        
        <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3 flex-row justify-between items-center">
           <View>
             <Text className="font-semibold text-slate-800">MacBook Air M2</Text>
             <Text className="text-slate-500 text-sm">Borrowed: 10 ต.ค. 2026</Text>
           </View>
           <Text className="text-green-600 font-bold text-sm">Returned</Text>
        </View>

        <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex-row justify-between items-center">
           <View>
             <Text className="font-semibold text-slate-800">Arduino Uno R3</Text>
             <Text className="text-slate-500 text-sm">Borrowed: วันนี้</Text>
           </View>
           <Text className="text-orange-600 font-bold text-sm">In Possession</Text>
        </View>

        <CustomButton 
          title="Logout" 
          variant="outline"
          onPress={handleLogout} 
        />

      </ScrollView>
    </SafeAreaView>
  );
}
