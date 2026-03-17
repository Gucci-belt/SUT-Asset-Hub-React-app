import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, StatusBar, Pressable, PressableProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, Bell, AlertCircle, Clock, Plus, QrCode, 
  FileText, Users, Box, MonitorSpeaker, ShieldAlert,
  ChevronRight
} from 'lucide-react-native';
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
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); }}
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

function AnimatedNumber({ value, className }: { value: number, className?: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrame: number;
    const duration = 1200; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo for dramatic slowdown at the end
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCurrent(Math.floor(easeProgress * value));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };
    animationFrame = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [value]);

  return <Text className={className}>{current}</Text>;
}

// ------------------------------------------------------------------
// Data
// ------------------------------------------------------------------

const ADMIN_STATS = [
  { id: '1', title: 'Total Assets', value: 450, icon: Box, color: '#2563EB', bgColor: '#EFF6FF', progress: '100%' },
  { id: '2', title: 'Borrowed', value: 124, icon: MonitorSpeaker, color: '#D97706', bgColor: '#FEF3C7', progress: '45%' },
  { id: '3', title: 'Overdue', value: 12, icon: ShieldAlert, color: '#DC2626', bgColor: '#FEE2E2', progress: '15%', isAlert: true }
];

const AUDIT_LOGS = [
  { id: '1', user: 'Somchai Sae Tang', action: 'borrowed', item: 'MacBook Pro 14"', assetId: 'SUT-001', time: '10 mins ago', status: 'borrow' },
  { id: '2', user: 'Nadia S.', action: 'returned', item: 'Sony Alpha Camera', assetId: 'SUT-059', time: '1 hour ago', status: 'return' },
  { id: '3', user: 'Admin', action: 'added', item: 'DJI Drone RTK', assetId: 'SUT-120', time: '3 hours ago', status: 'system' },
];

// ------------------------------------------------------------------
// Main Screen
// ------------------------------------------------------------------

export default function AdminDashboardScreen() {
  return (
    <View className="flex-1 bg-[#F1F5F9]">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Absolute view to color safe area of iOS/Android top header */}
      <View className="absolute top-0 w-full h-[150px] bg-white z-0" />

      <SafeAreaView className="flex-1" edges={['top']}>
        
        {/* Integrated Clean Header */}
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100 }}
          className="bg-white px-6 pb-6 pt-2 z-10 rounded-b-[32px] shadow-sm shadow-slate-200 border-b border-slate-100"
        >
          <View className="flex-row justify-between items-center mb-5">
            <View>
              <Text className="text-slate-500 text-[11px] font-bold tracking-widest uppercase mb-1">Control Center</Text>
              <Text className="text-slate-900 text-2xl font-black tracking-tight">Admin Hub</Text>
            </View>
            <ScaleButton className="w-10 h-10 border border-slate-200 rounded-full items-center justify-center relative bg-slate-50 shadow-sm shadow-slate-100">
              <Bell size={20} color="#475569" />
              <View className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </ScaleButton>
          </View>
          
          <View className="flex-row items-center bg-slate-100/80 rounded-full px-5 py-3.5 border border-slate-200">
            <Search size={18} color="#64748b" className="mr-3" />
            <TextInput
              placeholder="Search assets, IDs, or users..."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 text-slate-800 text-[15px] font-medium"
            />
          </View>
        </MotiView>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 120 }}
          bounces={true}
        >
          
          {/* Priority / Pending Actions Carousel */}
          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 200 }}
            className="mt-8 mb-8"
          >
            <View className="px-6 flex-row justify-between items-center mb-4">
              <Text className="text-slate-900 text-lg font-bold">Pending Actions</Text>
              <AlertCircle size={18} color="#94a3b8" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
              <ScaleButton className="bg-red-50 border border-red-100 p-5 rounded-[24px] w-[220px] shadow-sm shadow-red-100">
                <AlertCircle color="#EF4444" size={24} className="mb-4" />
                <Text className="text-red-900 font-bold text-lg mb-1 tracking-tight">3 Items Overdue</Text>
                <Text className="text-red-700/80 text-xs font-medium">Requires immediate action</Text>
              </ScaleButton>
              
              <ScaleButton className="bg-orange-50 border border-orange-100 p-5 rounded-[24px] w-[220px] shadow-sm shadow-orange-100">
                <Clock color="#F59E0B" size={24} className="mb-4" />
                <Text className="text-orange-900 font-bold text-lg mb-1 tracking-tight">5 New Requests</Text>
                <Text className="text-orange-700/80 text-xs font-medium">Pending manual approval</Text>
              </ScaleButton>
            </ScrollView>
          </MotiView>

          {/* Modern Stats Grid */}
          <View className="px-6 mb-8">
            <Text className="text-slate-900 text-lg font-bold mb-4">Quick Stats</Text>
            <View className="flex-row justify-between space-x-3">
              {ADMIN_STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <MotiView 
                    key={stat.id} 
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', delay: 300 + (i * 100) }}
                    className="flex-1 bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm shadow-slate-200/50"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="w-8 h-8 rounded-full items-center justify-center mb-1" style={{ backgroundColor: stat.bgColor }}>
                        <Icon size={16} color={stat.color} />
                      </View>
                    </View>
                    <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.title}</Text>
                    
                    <AnimatedNumber 
                      value={stat.value} 
                      className={`text-2xl font-black tracking-tighter mb-4 ${stat.isAlert ? 'text-red-600' : 'text-slate-800'}`} 
                    />

                    {/* Animated Progress Bar */}
                    <View className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <MotiView 
                        from={{ width: '0%' }}
                        animate={{ width: stat.progress as any }}
                        transition={{ type: 'timing', duration: 1000, delay: 500 }}
                        className="h-full rounded-full" 
                        style={{ backgroundColor: stat.color }} 
                      />
                    </View>
                  </MotiView>
                );
              })}
            </View>
          </View>

          {/* Action Hub */}
          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 400 }}
            className="px-6 mb-8"
          >
            <Text className="text-slate-900 text-lg font-bold mb-4">Action Hub</Text>
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] mb-4">
                <ScaleButton className="bg-blue-600 p-4 rounded-[20px] shadow-sm shadow-blue-200 flex-row items-center border border-blue-500">
                  <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                    <Plus size={20} color="white" />
                  </View>
                  <Text className="text-white font-bold text-[13px] tracking-wide">Add Asset</Text>
                </ScaleButton>
              </View>
              
              <View className="w-[48%] mb-4">
                <ScaleButton className="bg-white p-4 rounded-[20px] shadow-sm shadow-slate-200/50 flex-row items-center border border-slate-100">
                  <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center mr-3 border border-slate-100">
                    <QrCode size={20} color="#2563EB" />
                  </View>
                  <Text className="text-slate-800 font-bold text-[13px] tracking-wide">Scan</Text>
                </ScaleButton>
              </View>
              
              <View className="w-[48%] mb-4">
                <ScaleButton className="bg-white p-4 rounded-[20px] shadow-sm shadow-slate-200/50 flex-row items-center border border-slate-100">
                  <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center mr-3 border border-slate-100">
                    <FileText size={20} color="#475569" />
                  </View>
                  <Text className="text-slate-800 font-bold text-[13px] tracking-wide">Reports</Text>
                </ScaleButton>
              </View>
              
              <View className="w-[48%] mb-4">
                <ScaleButton className="bg-white p-4 rounded-[20px] shadow-sm shadow-slate-200/50 flex-row items-center border border-slate-100">
                  <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center mr-3 border border-slate-100">
                    <Users size={20} color="#475569" />
                  </View>
                  <Text className="text-slate-800 font-bold text-[13px] tracking-wide">Users</Text>
                </ScaleButton>
              </View>
            </View>
          </MotiView>

          {/* Audit Log List (Staggered Entrance) */}
          <View className="px-6 mb-6">
            <MotiView 
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 500 }}
              className="flex-row justify-between items-center mb-4"
            >
              <Text className="text-slate-900 text-lg font-bold">Audit Log</Text>
              <ScaleButton className="flex-row items-center">
                <Text className="text-blue-600 font-bold text-[13px] mr-1">View All</Text>
                <ChevronRight size={16} color="#2563EB" />
              </ScaleButton>
            </MotiView>

            <View className="bg-white rounded-[24px] shadow-sm shadow-slate-200/50 border border-slate-100 p-2">
              {AUDIT_LOGS.map((log, index) => (
                <MotiView 
                  key={log.id} 
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', delay: 600 + (index * 150) }}
                  className="flex-row justify-between items-center p-4 border-b border-slate-50 overflow-hidden" 
                  style={{ borderBottomWidth: index === AUDIT_LOGS.length - 1 ? 0 : 1 }}
                >
                  <View className="flex-1 flex-row items-center">
                    <View className="w-9 h-9 bg-slate-100 rounded-full items-center justify-center mr-3 border border-slate-200">
                      <Text className="text-slate-600 font-black text-xs">{log.user.charAt(0)}</Text>
                    </View>
                    <View className="flex-1 pr-2">
                      <Text className="text-slate-900 font-bold text-[13px]" numberOfLines={1}>{log.user}</Text>
                      <Text className="text-slate-500 font-bold text-[10px] tracking-widest uppercase mt-0.5" numberOfLines={1}>
                        {log.assetId} • {log.item}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end pl-2">
                    <Text className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 ${
                      log.status === 'borrow' ? 'text-amber-600' : 
                      log.status === 'return' ? 'text-blue-600' : 'text-slate-600'
                    }`}>
                      {log.action}
                    </Text>
                    <Text className="text-slate-400 font-medium text-[10px]">{log.time}</Text>
                  </View>
                </MotiView>
              ))}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
