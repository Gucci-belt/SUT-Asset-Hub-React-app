import React, { useState } from 'react';
import { 
  View, Text, TextInput, KeyboardAvoidingView, 
  Platform, TouchableOpacity, TouchableWithoutFeedback, 
  Keyboard, Pressable, PressableProps 
} from 'react-native';
import { ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff } from 'lucide-react-native';
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
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
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
// Main Screen
// ------------------------------------------------------------------

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState('');

  const handleLogin = () => {
    router.push('/home');
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          
          {/* Top Gradient Header Area */}
          <LinearGradient
            colors={['#2563EB', '#3B82F6', '#E0E8FF']}
            className="h-[40%] items-center justify-center"
          >
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 100 }}
            >
              {/* App Logo / SUT ASSET HUB - Clean & Soft */}
              <View className="px-6 py-4 bg-white/20 rounded-[32px] items-center justify-center shadow-lg backdrop-blur-md">
                <View className="px-6 py-4 bg-white rounded-[24px] items-center justify-center">
                  <Text className="text-[22px] font-black text-[#2563EB] tracking-wider leading-none">
                    SUT ASSET HUB
                  </Text>
                </View>
              </View>
            </MotiView>
          </LinearGradient>

          {/* Form Container */}
          <MotiView 
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 200 }}
            className="flex-1 bg-white -mt-10 rounded-t-[40px] px-8 pt-10 shadow-2xl shadow-blue-900/10"
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="flex-1"
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Title */}
                <Text className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                  Welcome back
                </Text>
                <Text className="text-slate-500 text-sm mb-8 font-medium">
                  Log in to your account to continue
                </Text>

                {/* Email Input */}
                <View className="mb-4">
                  <Text className="text-[13px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Username</Text>
                  <View className={`border-2 rounded-2xl bg-slate-50 ${isFocused === 'username' ? 'border-[#2563EB] bg-white' : 'border-transparent'}`}>
                    <TextInput
                      value={username}
                      onChangeText={setUsername}
                      placeholder="B67676767"
                      placeholderTextColor="#94A3B8"
                      className="px-5 py-4 text-slate-900 font-bold text-[15px]"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setIsFocused('email')}
                      onBlur={() => setIsFocused('')}
                    />
                  </View>
                </View>

                {/* Password Input */}
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

                {/* Forgot password */}
                <TouchableOpacity className="mb-8 self-end">
                  <Text className="text-[#2563EB] text-[13px] font-bold">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Log In Button */}
                <ScaleButton 
                  onPress={handleLogin}
                  className="bg-[#2563EB] py-5 rounded-2xl items-center justify-center mb-6 shadow-xl shadow-blue-600/30"
                >
                  <Text className="text-white font-bold text-lg">Log In</Text>
                </ScaleButton>

                {/* Create Account Link */}
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
