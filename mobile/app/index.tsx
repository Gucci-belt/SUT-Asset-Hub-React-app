import React, { useState } from 'react';
import { 
  View, Text, TextInput, KeyboardAvoidingView, 
  Platform, TouchableOpacity, TouchableWithoutFeedback, 
  Keyboard, Pressable, PressableProps, ActivityIndicator, Alert 
} from 'react-native';
import { ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
import { MotiView } from 'moti';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, setUserRole } from '../globalAuth';
import * as SecureStore from 'expo-secure-store';

// ------------------------------------------------------------------
// Micro-Interaction Components (แก้บั๊ก NativeWind)
// ------------------------------------------------------------------
interface ScaleButtonProps extends PressableProps {
  className?: string;
  style?: any;
  children: React.ReactNode;
}

function ScaleButton({ children, className, onPress, disabled, style, ...props }: ScaleButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: scale.value }] };
  });
  
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => { if (!disabled) scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { if (!disabled) scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      {...props}
    >
      {/* 🔥 FIX จอแดง: ไม่ใส่ className ใน Animated.View แล้ว แต่สร้าง View เปล่าๆ มารับแทน */}
      <Animated.View style={[animatedStyle, style]}>
         <View className={className}>
           {children}
         </View>
      </Animated.View>
    </Pressable>
  );
}

// ------------------------------------------------------------------
// Setup API URL (Survival Mode)
// ------------------------------------------------------------------
const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = "http://10.0.2.2:3000/api";
if (debuggerHost) {
  const host = debuggerHost.split(":")[0];
  API_BASE_URL = `http://${host}:3000/api`;
}

// ------------------------------------------------------------------
// Main Screen
// ------------------------------------------------------------------
export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter your Student ID and Password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: username, password })
      });

      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error || 'Login failed');
      }

      // Global Auth State
      setAuthToken(data.token);
      setUserRole(data.role);

      // Try AsyncStorage as backup, catching potential native module errors
      try {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userRole', data.role);
        await AsyncStorage.setItem('studentId', data.studentId ?? '');
        await AsyncStorage.setItem('firstName', data.firstName ?? data.studentId ?? '');

        // SecureStore (เพิ่มให้หน้าอื่นใช้ได้)
        await SecureStore.setItemAsync('token', data.token);
        await SecureStore.setItemAsync('studentId', data.studentId ?? '');
        await SecureStore.setItemAsync('firstName', data.firstName ?? data.studentId ?? '');
      } catch (e) {
        console.warn('AsyncStorage is not available. Using purely in-memory token.');
      }
      
      // Role-based redirect
      if (data.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/home');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          
          
          <LinearGradient
            colors={['#2563EB', '#3B82F6', '#E0E8FF']}
            style={{ height: '40%', alignItems: 'center', justifyContent: 'center' }}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 100 }}
            >
              <View className="px-6 py-4 bg-white/20 rounded-[32px] items-center justify-center shadow-lg">
                <View className="px-6 py-4 bg-white rounded-[24px] items-center justify-center">
                  <Text className="text-[22px] font-black text-[#2563EB] tracking-wider leading-none">
                    SUT ASSET HUB
                  </Text>
                </View>
              </View>
            </MotiView>
          </LinearGradient>

          <MotiView 
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 100 }}
            style={{ flex: 1, backgroundColor: 'white', marginTop: -40, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 32, paddingTop: 40, elevation: 10 }}
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="flex-1"
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                  Welcome back
                </Text>
                <Text className="text-slate-500 text-sm mb-8 font-medium">
                  Log in to your account to continue
                </Text>

                <View className="mb-4">
                  <Text className="text-[13px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Student ID</Text>
                  <View className={`border-2 rounded-2xl bg-slate-50 ${isFocused === 'username' ? 'border-[#2563EB] bg-white' : 'border-transparent'}`}>
                    <TextInput
                      value={username}
                      onChangeText={setUsername}
                      placeholder="B67676767"
                      placeholderTextColor="#94A3B8"
                      className="px-5 py-4 text-slate-900 font-bold text-[15px]"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setIsFocused('username')}
                      onBlur={() => setIsFocused('')}
                    />
                  </View>
                </View>

                <View className="mb-2">
                  <Text className="text-[13px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Password</Text>
                  <View className={`border-2 rounded-2xl bg-slate-50 flex-row items-center ${isFocused === 'password' ? 'border-[#2563EB] bg-white' : 'border-transparent'}`}>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      className="flex-1 px-5 py-4 text-slate-900 font-bold text-[15px]"
                      onFocus={() => setIsFocused('password')}
                      onBlur={() => setIsFocused('')}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)} 
                      className="pr-5 py-4"
                    >
                      {showPassword ? (
                        <Eye size={20} color="#94A3B8" />
                      ) : (
                        <EyeOff size={20} color="#94A3B8" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  className="mb-8 self-end"
                  onPress={() => router.push('/reset')}
                >
                  <Text className="text-[#2563EB] text-[13px] font-bold">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', delay: 300 }}
                >
                  <ScaleButton 
                    onPress={handleLogin}
                    disabled={isLoading}
                    className={`py-5 rounded-2xl items-center justify-center mb-6 shadow-xl ${isLoading ? 'bg-blue-400' : 'bg-[#2563EB]'}`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg">Log In</Text>
                    )}
                  </ScaleButton>
                </MotiView>

                <View className="flex-row justify-center items-center pb-8">
                  <Text className="text-slate-500 text-[14px] font-medium">Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text className="text-[#2563EB] font-bold text-[14px]">
                      Create Account
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </MotiView>

        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}