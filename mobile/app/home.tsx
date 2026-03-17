import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Image, StatusBar, Pressable, PressableProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// ------------------------------------------------------------------
// Micro-Interaction Components
// ------------------------------------------------------------------

interface ScaleButtonProps extends PressableProps {
  className?: string;
  style?: any;
  children: React.ReactNode;
}

function ScaleButton({ children, className, onPress, ...props }: ScaleButtonProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      {...props}
    >
      <Animated.View style={style} className={className}>
         {children}
      </Animated.View>
    </Pressable>
  );
}

// ------------------------------------------------------------------
// Dummy Data
// ------------------------------------------------------------------

const CATEGORIES = [
  { id: '1', name: 'IoT', icon: <Feather name="radio" size={24} color="#3b82f6" /> },
  { id: '2', name: 'Laptops', icon: <Feather name="monitor" size={24} color="#3b82f6" /> },
  { id: '3', name: 'Cameras', icon: <Feather name="camera" size={24} color="#3b82f6" /> },
  { id: '4', name: 'Sensors', icon: <MaterialCommunityIcons name="leak" size={24} color="#3b82f6" /> },
  { id: '5', name: 'Lab Gear', icon: <MaterialCommunityIcons name="microscope" size={24} color="#3b82f6" /> },
  { id: '6', name: 'Tablets', icon: <Feather name="smartphone" size={24} color="#3b82f6" /> },
  { id: '7', name: 'Audio', icon: <Feather name="headphones" size={24} color="#3b82f6" /> },
  { id: '8', name: 'Drones', icon: <MaterialCommunityIcons name="quadcopter" size={24} color="#3b82f6" /> }
];

const NEW_ARRIVALS = [
  { id: '1', title: 'Sony Alpha IV\nCinema Kit', subtitle: 'Lab 402 • Available', bg: 'bg-blue-600', tag: 'NEW' },
  { id: '2', title: 'DJI Matrice 300\nRTK Drone', subtitle: 'Hangar 1 • Limited', bg: 'bg-indigo-800', tag: 'LIMITED' }
];

// ------------------------------------------------------------------
// Main Screen
// ------------------------------------------------------------------

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-blue-600">
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScrollView 
          className="flex-1 bg-white" 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 140 }}
          bounces={false}
        >
          
          {/* Blue Header Section that scrolls with content */}
          <MotiView 
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 100 }}
            className="bg-blue-600 pt-2 pb-14 px-6 rounded-b-[40px]"
          >
            {/* Header Top Row */}
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-blue-100 font-medium text-sm mb-0.5">Welcome back,</Text>
                <Text className="text-white text-2xl font-bold tracking-wide">Hello, Nick</Text>
              </View>
              <View className="flex-row items-center">
                {/* Admin Button (Temporary for easy access) */}
                <ScaleButton onPress={() => router.push('/admin')} className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                  <Feather name="shield" size={18} color="white" />
                </ScaleButton>

                {/* Notification Bell */}
                <ScaleButton className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3 relative">
                  <Feather name="bell" size={20} color="white" />
                  <View className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full" />
                </ScaleButton>

                {/* Profile Avatar */}
                <ScaleButton onPress={() => router.push('/profile')}>
                  <View className="w-11 h-11 bg-orange-400 rounded-full border-2 border-orange-200 items-center justify-center shadow-lg">
                     <Text className="text-black font-bold text-lg">N</Text>
                  </View>
                </ScaleButton>
              </View>
            </View>

            {/* Search Bar inside Header */}
            <View>
              <ScaleButton className="flex-row items-center bg-white rounded-[24px] px-5 py-4 shadow-xl shadow-blue-900/20">
                <Feather name="search" size={20} color="#94a3b8" className="mr-3" />
                <TextInput
                  placeholder="Search equipment..."
                  placeholderTextColor="#94a3b8"
                  className="flex-1 ml-3 text-slate-800 font-medium text-base"
                />
              </ScaleButton>
            </View>
          </MotiView>

          {/* Active Borrowings Card (Pulled up to overlap the curve) */}
          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 300 }}
            className="px-6 mb-8 -mt-6"
          >
            <ScaleButton className="bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-50">
              
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-slate-400 font-bold text-xs tracking-widest uppercase">Active Borrowings</Text>
                <View className="bg-red-50 px-2.5 py-1 rounded-md">
                  <Text className="text-red-500 font-bold text-[10px] uppercase">Urgent</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-5">
                <View>
                  <Text className="text-slate-800 font-bold text-lg mb-0.5">MacBook Pro 14"</Text>
                  <Text className="text-slate-500 text-xs">Due Tomorrow, 10:00 AM</Text>
                </View>
                <View className="w-12 h-12 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                  <Feather name="monitor" size={20} color="#3b82f6" />
                </View>
              </View>

              {/* Progress Bar + Footer */}
              <View>
                <View className="w-full h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                  <MotiView 
                    from={{ width: '0%' }}
                    animate={{ width: '80%' }}
                    transition={{ type: 'timing', duration: 1000, delay: 500 }}
                    className="h-full bg-orange-500 rounded-full" 
                  />
                </View>
                <Text className="text-right text-red-500 font-semibold text-[10px]">Return in 18 hours</Text>
              </View>
            </ScaleButton>
          </MotiView>

          {/* Categories Grid */}
          <View className="px-6 mb-8">
            <MotiView 
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 400 }}
              className="flex-row justify-between items-end mb-5"
            >
              <Text className="text-slate-900 text-xl font-bold">Categories</Text>
              <ScaleButton>
                <Text className="text-blue-600 font-bold text-sm">See All</Text>
              </ScaleButton>
            </MotiView>
            
            <View className="flex-row flex-wrap justify-between">
              {CATEGORIES.map((cat, index) => (
                <MotiView
                  key={cat.id} 
                  from={{ opacity: 0, translateX: 50 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', delay: 500 + index * 50 }}
                  style={{ width: '25%' }}
                  className="items-center mb-6"
                >
                  <ScaleButton className="items-center mb-6 w-full">
                    <View className="w-[60px] h-[60px] bg-slate-50 rounded-full items-center justify-center mb-2">
                      {cat.icon}
                    </View>
                    <Text className="text-slate-500 text-xs font-medium text-center">{cat.name}</Text>
                  </ScaleButton>
                </MotiView>
              ))}
            </View>
          </View>

          {/* New Arrivals */}
          <View className="mb-8">
            <MotiView 
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 600 }}
              className="flex-row justify-between items-end px-6 mb-5"
            >
              <Text className="text-slate-900 text-xl font-bold">New Arrivals</Text>
              <ScaleButton>
                <Text className="text-blue-600 font-bold text-sm">View New</Text>
              </ScaleButton>
            </MotiView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6">
              {NEW_ARRIVALS.map((item, index) => (
                <MotiView 
                  key={item.id} 
                  from={{ opacity: 0, translateX: 100 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', delay: 700 + index * 150 }}
                  className={`${item.bg} w-[260px] h-[300px] rounded-[32px] p-6 mr-4 relative justify-end overflow-hidden shadow-lg shadow-blue-900/20`}
                >
                  <ScaleButton className="flex-1 w-full h-full relative p-0 absolute inset-0 z-0 border-0 m-0">
                    <View className="w-full h-full p-6 pb-6 relative flex-col justify-end">
                      {/* Decorative placeholder */}
                      <View className="absolute inset-0 items-center justify-center mt-[-40px]">
                         <MaterialCommunityIcons name="camera-outline" size={140} color="rgba(255,255,255,0.15)" />
                      </View>

                      {/* Absolute Tag */}
                      <View className="absolute top-6 left-6" style={{ zIndex: 10 }}>
                         <View className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                            <Text className="text-blue-600 text-[10px] font-bold tracking-widest">{item.tag}</Text>
                         </View>
                      </View>

                      {/* Content Over Gradient */}
                      <View className="mt-auto">
                        <Text className="text-white font-bold text-2xl mb-2 leading-tight">{item.title}</Text>
                        <Text className="text-white/80 text-xs">{item.subtitle}</Text>
                      </View>
                    </View>
                  </ScaleButton>
                </MotiView>
              ))}
              <View className="pr-6" /> {/* Spacer */}
            </ScrollView>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Massive Floating Scan Button (FAB) */}
      <View className="absolute bottom-[55px] self-center z-50 shadow-2xl shadow-blue-600/50">
        <ScaleButton 
          className="w-[90px] h-[90px] bg-blue-600 rounded-full items-center justify-center border-4 border-white"
          onPress={() => router.push('/scanner')}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={32} color="white" />
        </ScaleButton>
      </View>

      {/* Modern Bottom Navigation */}
      <MotiView 
        from={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', delay: 800 }}
        className="absolute bottom-0 w-full bg-white flex-row justify-between px-2 pt-3 pb-8 border-t-[0.5px] border-slate-200" 
        style={{ zIndex: 40 }}
      >
        <ScaleButton className="items-center flex-1">
          <View className="w-10 h-10 bg-blue-600 rounded-lg items-center justify-center mb-1">
             <Feather name="home" size={20} color="white" />
          </View>
          <Text className="text-blue-600 text-[10px] font-bold">HOME</Text>
        </ScaleButton>
        
        <ScaleButton className="items-center flex-1 mt-1 opacity-50">
          <View className="mb-1 mt-1">
            <Feather name="search" size={22} color="#475569" />
          </View>
          <Text className="text-slate-600 text-[10px] font-bold mt-1">SEARCH</Text>
        </ScaleButton>
        
        {/* Spacer for FAB */}
        <View className="flex-1" />
        
        <ScaleButton className="items-center flex-1 mt-1 opacity-50">
          <View className="mb-1 mt-1">
            <Feather name="clock" size={22} color="#475569" />
          </View>
          <Text className="text-slate-600 text-[10px] font-bold mt-1">HISTORY</Text>
        </ScaleButton>
        
        <ScaleButton className="items-center flex-1 mt-1 opacity-50" onPress={() => router.push('/profile')}>
          <View className="mb-1 mt-1">
            <Feather name="user" size={22} color="#475569" />
          </View>
          <Text className="text-slate-600 text-[10px] font-bold mt-1">PROFILE</Text>
        </ScaleButton>
      </MotiView>

    </View>
  );
}
