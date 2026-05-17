import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import axios from 'axios';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  API_BASE_URL = `http://${debuggerHost.split(':')[0]}:3000/api`;
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const checkStudentId = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password/check`, { studentId });
      setStep(2);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Student ID not found');
    } finally {
      setLoading(false);
    }
  };

  const verifyPin = async () => {
    if (!pin || pin.length !== 4) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password/verify-pin`, { studentId, pin });
      setStep(3);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password/reset`, { studentId, pin, newPassword });
      Alert.alert('Success', 'Password reset!', [{ text: 'Login', onPress: () => router.replace('/') }]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const renderIndicator = () => (
    <View className="flex-row items-center justify-center mb-8">
      <View className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200 border border-slate-300'}`} />
      <View className={`w-8 h-[2px] ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
      <View className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200 border border-slate-300'}`} />
      <View className={`w-8 h-[2px] ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />
      <View className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200 border border-slate-300'}`} />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View className="px-4 py-3 flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  if (step === 3) setStep(2);
                  else if (step === 2) setStep(1);
                  else router.back();
                }}
                className="w-10 h-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 mr-3"
              >
                <ChevronLeft size={22} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <View className="flex-1 px-8 pt-8">
              {renderIndicator()}

              {step === 1 && (
                <View>
                  <Text className="text-3xl font-black text-slate-900 mb-2">Forgot Password</Text>
                  <Text className="text-slate-500 font-medium mb-8">Enter your Student ID to continue</Text>
                  
                  <Text className="text-[12px] font-semibold text-slate-500 mb-1.5">Student ID</Text>
                  <TextInput
                    value={studentId}
                    onChangeText={setStudentId}
                    placeholder="e.g. B6700000"
                    placeholderTextColor="#CBD5E1"
                    className="w-full px-4 py-4 rounded-xl text-slate-900 font-bold text-[15px] bg-slate-50 border border-slate-200 mb-8"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    onPress={checkStudentId}
                    disabled={loading || !studentId}
                    className={`w-full py-4 rounded-xl items-center justify-center shadow-md ${loading || !studentId ? 'bg-blue-400' : 'bg-blue-600'}`}
                  >
                    {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Continue</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {step === 2 && (
                <View>
                  <Text className="text-3xl font-black text-slate-900 mb-2">Enter PIN</Text>
                  <Text className="text-slate-500 font-medium mb-8">Enter the PIN you set during registration</Text>
                  
                  <Text className="text-[12px] font-semibold text-slate-500 mb-1.5">PIN (4 digits)</Text>
                  <TextInput
                    value={pin}
                    onChangeText={setPin}
                    placeholder="••••"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    className="w-full px-4 py-4 rounded-xl text-slate-900 font-bold text-[24px] tracking-[10px] text-center bg-slate-50 border border-slate-200 mb-8"
                  />

                  <TouchableOpacity
                    onPress={verifyPin}
                    disabled={loading || pin.length !== 4}
                    className={`w-full py-4 rounded-xl items-center justify-center shadow-md ${loading || pin.length !== 4 ? 'bg-blue-400' : 'bg-blue-600'}`}
                  >
                    {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Verify PIN</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {step === 3 && (
                <View>
                  <Text className="text-3xl font-black text-slate-900 mb-2">New Password</Text>
                  <Text className="text-slate-500 font-medium mb-8">Enter your new password</Text>
                  
                  <Text className="text-[12px] font-semibold text-slate-500 mb-1.5">New Password</Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#CBD5E1"
                    secureTextEntry
                    className="w-full px-4 py-4 rounded-xl text-slate-900 font-bold text-[15px] bg-slate-50 border border-slate-200 mb-4"
                  />

                  <Text className="text-[12px] font-semibold text-slate-500 mb-1.5">Confirm Password</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#CBD5E1"
                    secureTextEntry
                    className="w-full px-4 py-4 rounded-xl text-slate-900 font-bold text-[15px] bg-slate-50 border border-slate-200 mb-8"
                  />

                  <TouchableOpacity
                    onPress={resetPassword}
                    disabled={loading || !newPassword || !confirmPassword}
                    className={`w-full py-4 rounded-xl items-center justify-center shadow-md ${loading || !newPassword || !confirmPassword ? 'bg-blue-400' : 'bg-blue-600'}`}
                  >
                    {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Reset Password</Text>}
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
