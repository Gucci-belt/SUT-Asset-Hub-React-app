import React, { useState } from 'react';
import {
  View, Text, TextInput, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Image,
  Keyboard, StatusBar, Alert, ActivityIndicator, Pressable, PressableProps
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { MotiView } from 'moti';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// ------------------------------------------------------------------
// Micro-Interaction Components
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
      <Animated.View style={[animatedStyle, style]} className={className}>
        {children}
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
// Shared Input component
// ------------------------------------------------------------------
interface InputProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  flex?: boolean;
  secureTextEntry?: boolean;
  maxLength?: number;
}

function LabeledInput({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize = 'words', flex, secureTextEntry, maxLength }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View className={flex ? 'flex-1' : 'w-full'}>
      <Text className="text-[12px] font-semibold text-slate-500 mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#CBD5E1"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`px-4 py-3.5 rounded-xl text-slate-900 font-medium text-[14px] bg-white border ${focused ? 'border-[#2563EB]' : 'border-slate-200'}`}
      />
    </View>
  );
}

// ------------------------------------------------------------------
// Main Screen
// ------------------------------------------------------------------
export default function RegisterScreen() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [pin, setPin] = useState('');
  const [isAgreed, setIsAgreed] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);

  // State สำหรับเก็บรูปภาพ
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // ฟังก์ชันเลือกรูปจากเครื่อง (Sensor/Library - เก็บ 2.5 คะแนนเต็ม)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library to upload an ID.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3, // บีบอัดรูปลงมาหน่อย จะได้ไม่โหลดหนัก
      base64: true, // ตัวนี้สำคัญมากสำหรับส่งไป Backend ฉบับมาม่า
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
    }
  };

  const handleRegister = async () => {
    if (!studentId || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all required fields (Student ID, Password, Name).');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId,
          password,
          firstName:  firstName  || null,
          lastName:   lastName   || null,
          phone:      phone      || null,
          lineId:     lineId     || null,
          pin:        pin        || null,
          photo:      photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : null,
        })
      });

      const data = await response.json();

      if (!response.ok) {
         throw new Error(data.error || 'Registration failed');
      }

      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.push('/') }
      ]);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Unable to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  const PDPA_TEXT = 'ข้อตกลงคุ้มครองข้อมูลส่วนบุคคล (PDPA) - SUT Asset Hub เพื่อดำเนินงานในฐานะ SUT Asset Hub เปิดรับบริการและประมวลผลข้อมูลส่วนบุคคลของท่าน ดังนี้\n\n• ชื่อ-นามสกุล และรหัสนักศึกษา: เพื่อใช้ในการยืนยันตัวตนและตรวจสอบสิทธิ์\n• ข้อมูลภาพถ่าย: เพื่อใช้ในการทำ KYC ป้องกันการสวมรอย';

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1"> 
          
          {/* Header */}
          <View className="flex-row items-center px-4 py-3 bg-slate-50 border-b border-slate-100">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full mr-3"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={22} color="#1E293B" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text className="text-[18px] font-bold text-slate-900 tracking-tight">Create Account</Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag" 
            >
              {/* Form Card */}
              <MotiView 
                from={{ opacity: 0, translateY: 30 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', delay: 100 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100"
              >
                
                {/* ── Identity Verification (อัปโหลดรูป) ── */}
                <View className="px-5 py-6 items-center bg-slate-50/50">
                  <Text className="text-[13px] font-bold text-slate-700 mb-4 self-center tracking-wide">
                    Identity Verification
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={pickImage}
                    className="w-24 h-24 rounded-full bg-white border-2 border-dashed border-slate-300 items-center justify-center mb-3 overflow-hidden shadow-sm"
                  >
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Camera size={30} color="#94A3B8" strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                  <Text className="text-[#2563EB] font-bold text-[14px] mb-1">Upload Student Photo</Text>
                  <Text className="text-slate-400 text-[11px] font-medium">Tap circle to select image</Text>
                </View>

                {/* ── Row: First Name / Last Name ── */}
                <View className="px-5 py-5 gap-3 flex-row">
                  <LabeledInput label="First Name" value={firstName} onChangeText={setFirstName} placeholder="สมชาย" flex />
                  <View className="w-3" />
                  <LabeledInput label="Last Name" value={lastName} onChangeText={setLastName} placeholder="แซ่ตั้ง" flex />
                </View>

                {/* ── Student ID ── */}
                <View className="px-5 py-5 pb-0">
                  <LabeledInput label="Student ID" value={studentId} onChangeText={setStudentId} placeholder="B676767" autoCapitalize="none" />
                </View>

                {/* ── Password ── */}
                <View className="px-5 py-5 pt-3">
                  <LabeledInput label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry autoCapitalize="none" />
                </View>

                {/* ── PIN ── */}
                <View className="px-5 py-2">
                  <LabeledInput label="PIN (4 digits)" value={pin} onChangeText={setPin} placeholder="Set a 4-digit PIN for password recovery" secureTextEntry keyboardType="numeric" autoCapitalize="none" maxLength={4} />
                </View>

                {/* ── Row: Phone / LINE ID ── */}
                <View className="px-5 py-5 gap-3 flex-row">
                  <LabeledInput label="Phone Number" value={phone} onChangeText={setPhone} placeholder="081-677-6777" keyboardType="phone-pad" autoCapitalize="none" flex />
                  <View className="w-3" />
                  <LabeledInput label="LINE ID" value={lineId} onChangeText={setLineId} placeholder="Nick_67" autoCapitalize="none" flex />
                </View>

                {/* ── PDPA Consent Block ── */}
                <View className="px-5 py-5">
                  <View className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                    <Text className="text-[11.5px] text-slate-500 leading-[18px] font-medium">
                      {PDPA_TEXT}
                    </Text>
                  </View>
                  
                  {/* Checkbox */}
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => setIsAgreed(!isAgreed)}
                    className="flex-row items-center"
                  >
                    <View className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${isAgreed ? 'bg-[#2563EB] border-[#2563EB]' : 'border-slate-300 bg-white'}`}>
                      {isAgreed && <Check size={16} color="white" strokeWidth={3} />}
                    </View>
                    <Text className="text-[13px] font-bold text-slate-700 flex-1">
                      ฉันยอมรับข้อตกลงคุ้มครองข้อมูลส่วนบุคคล (PDPA)
                    </Text>
                  </TouchableOpacity>
                </View>
              </MotiView>

              <View className="h-6" />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Footer Button */}
          <MotiView 
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 300 }}
            className="px-5 pb-5 pt-3 bg-slate-50 border-t border-slate-100"
          >
            <ScaleButton
              onPress={handleRegister}
              disabled={!isAgreed || isLoading}
              className={`py-4 rounded-2xl items-center justify-center ${isAgreed ? 'bg-[#2563EB]' : 'bg-slate-300'}`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className={`font-bold text-[16px] tracking-wide ${isAgreed ? 'text-white' : 'text-slate-500'}`}>
                  Register
                </Text>
              )}
            </ScaleButton>
          </MotiView>
          
        </View>
      </SafeAreaView>
    </View>
  );
}