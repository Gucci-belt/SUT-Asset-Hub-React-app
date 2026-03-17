import React, { useState } from 'react';
import {
  View, Text, TextInput, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, TouchableWithoutFeedback,
  Keyboard, Pressable, PressableProps, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera, Check } from 'lucide-react-native'; // เพิ่ม Check เข้ามา
import { MotiView } from 'moti';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// ------------------------------------------------------------------
// ScaleButton — spring press micro-interaction
// ------------------------------------------------------------------

interface ScaleButtonProps extends PressableProps {
  className?: string;
  style?: any;
  children: React.ReactNode;
}

function ScaleButton({ children, className, onPress, style, disabled, ...props }: ScaleButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => { if(!disabled) scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { if(!disabled) scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      {...props}
    >
      <Animated.View style={[animStyle, style]} className={className}>
        {children}
      </Animated.View>
    </Pressable>
  );
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
}
function LabeledInput({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize = 'words', flex }: InputProps) {
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
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [isAgreed, setIsAgreed] = useState(false); 

  const handleRegister = () => {
    // TODO: integrate backend
    router.back();
  };

  const PDPA_TEXT =
    'ข้อตกลงคุ้มครองข้อมูลส่วนบุคคล (PDPA) - SUT Asset Hub เพื่อดำเนินงานในฐานะ SUT Asset Hub เปิดรับบริการและประมวลผลข้อมูลส่วนบุคคลของท่าน ดังนี้\n\n• ชื่อ-นามสกุล และรหัสนักศึกษา: เพื่อใช้ในการยืนยันตัวตนและตรวจสอบสิทธิ์การใช้งานระบบ\n• ข้อมูลการติดต่อสื่อสาร (เบอร์โทรศัพท์, อีเมล, LINE ID): เพื่อการสื่อสารด้านการบริหารและสนับสนุนการดำเนินงาน\n• ข้อมูลภาพถ่าย/สำเนาบัตรประชาชนนักศึกษา รูปภาพ/สำเนาบัตรประชาชน: เพื่อใช้ในการทำ KYC ป้องกันการสวมรอย\n• ข้อมูลประวัติการการยืม-คืน: เพื่อการบันทึกสิทธิ์และบริหารจัดการ SUT Asset Hub ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล';

  return (
    <View className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1"> 
          
          
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
                from={{ opacity: 0, translateY: 40 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', delay: 100 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100"
              >
                {/* ── Row: First Name / Last Name ── */}
                <View className="px-5 py-5 gap-3 flex-row">
                  <LabeledInput
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="สมชาย"
                    flex
                  />
                  <View className="w-3" />
                  <LabeledInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="แซ่ตั้ง"
                    flex
                  />
                </View>

                {/* ── Student ID ── */}
                <View className="px-5 py-5">
                  <LabeledInput
                    label="Student ID"
                    value={studentId}
                    onChangeText={setStudentId}
                    placeholder="B676767"
                    autoCapitalize="none"
                  />
                </View>

                {/* ── Row: Phone / LINE ID ── */}
                <View className="px-5 py-5 gap-3 flex-row">
                  <LabeledInput
                    label="Phone Number"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="081-677-6777"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    flex
                  />
                  <View className="w-3" />
                  <LabeledInput
                    label="LINE ID"
                    value={lineId}
                    onChangeText={setLineId}
                    placeholder="Nick_67"
                    autoCapitalize="none"
                    flex
                  />
                </View>

                {/* ── Identity Verification ── */}
                <View className="px-5 py-6 items-center">
                  <Text className="text-[13px] font-bold text-slate-700 mb-4 self-center tracking-wide">
                    Identity Verification
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 items-center justify-center mb-3"
                  >
                    <Camera size={30} color="#94A3B8" strokeWidth={1.5} />
                  </TouchableOpacity>
                  <Text className="text-[#2563EB] font-bold text-[14px] mb-1">Upload Student ID Card</Text>
                  <Text className="text-slate-400 text-[11px] font-medium">JPG, PNG up to 5MB</Text>
                </View>

                {/* ── PDPA Consent Block ── */}
                <View className="px-5 py-5">
                  <View className="bg-slate-50 rounded-xl p-4 mb-4">
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

              {/* ── Spacer เผื่อด้านล่าง ── */}
              <View className="h-6" />

            </ScrollView>
          </KeyboardAvoidingView>

          
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 300 }}
            className="px-5 pb-5 pt-3 bg-slate-50 border-t border-slate-100"
          >
            <ScaleButton
              onPress={handleRegister}
              disabled={!isAgreed}
              className={`py-5 rounded-2xl items-center justify-center transition-all ${isAgreed ? 'bg-[#2563EB] shadow-xl shadow-blue-600/30' : 'bg-slate-300'}`}
            >
              <Text className={`font-bold text-[16px] tracking-wide ${isAgreed ? 'text-white' : 'text-slate-500'}`}>
                Register
              </Text>
            </ScaleButton>
          </MotiView>
          
        </View>
      </SafeAreaView>
    </View>
  );
}