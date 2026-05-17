import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  API_BASE_URL = `http://${debuggerHost.split(':')[0]}:3000/api`;
}

export default function StudentVerifyScreen() {
  const router = useRouter();
  const { assetId, dueDate } = useLocalSearchParams<{ assetId: string; dueDate: string }>();

  const [step, setStep] = useState<1 | 2>(1);
  const [assetScanned, setAssetScanned] = useState(false);
  const [studentScanned, setStudentScanned] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-white">
        <Text className="text-center mb-4 text-base text-slate-700">We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-blue-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleConfirmBorrow = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_BASE_URL}/transactions/borrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assetId: Number(assetId),
          dueDate: dueDate,
          reason: '',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit');
      }
      Alert.alert(
        '📋 Request Submitted',
        'Your borrow request has been sent.\nPlease wait for admin approval.',
        [{ text: 'OK', onPress: () => router.replace('/history') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit borrow request.');
    } finally {
      setLoading(false);
    }
  };

  const currentScanned = step === 1 ? assetScanned : studentScanned;

  return (
    <View className="flex-1 bg-slate-50 pt-12">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-white mb-2" style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }}>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center">
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-bold text-slate-900 mr-10">Verify Identity</Text>
      </View>

      <View className="flex-1 px-6 pt-6">
        {/* Progress Indicator */}
        <View className="flex-row items-center justify-center mb-10">
          <View className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-300'}`} />
          <View className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-300'}`} />
          <View className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-300'}`} />
        </View>

        <Text className="text-2xl font-extrabold text-slate-900 text-center mb-2">
          {step === 1 ? 'Scan Asset QR' : 'Scan Student ID'}
        </Text>
        <Text className="text-sm font-medium text-slate-500 text-center mb-10">
          {step === 1 ? 'Scan the QR code on the equipment' : 'Scan the QR code on your student card'}
        </Text>

        {/* Camera Container */}
        <View className="h-64 rounded-3xl overflow-hidden bg-black mb-10 relative">
          <CameraView 
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (scanned) return;
              setScanned(true);
              if (step === 1) setAssetScanned(true);
              else setStudentScanned(true);
            }}
          />
          
          {/* Overlay */}
          {!currentScanned && (
            <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
              <View className="w-48 h-48 border-2 border-white rounded-2xl opacity-50" />
            </View>
          )}

          {currentScanned && (
            <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: 'rgba(0,200,0,0.2)' }}>
              <Ionicons name="checkmark-circle" size={64} color="#4ADE80" />
              <Text className="text-white text-xl font-bold mt-2">
                {step === 1 ? 'QR Scanned!' : 'ID Scanned!'}
              </Text>
            </View>
          )}
        </View>

        {/* Buttons */}
        <View className="flex-row gap-4 mt-auto mb-10">
          <TouchableOpacity 
            onPress={() => {
              if (step === 1) {
                setAssetScanned(false);
                setStep(2);
                setScanned(false);
              } else {
                setStudentScanned(false);
                handleConfirmBorrow();
              }
            }}
            disabled={loading}
            className="flex-1 bg-slate-200 py-4 rounded-2xl items-center"
          >
            <Text className="text-slate-600 font-bold text-base">Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              if (step === 1) {
                setStep(2);
                setScanned(false);
              } else {
                handleConfirmBorrow();
              }
            }}
            disabled={loading || (step === 1 && !assetScanned)}
            className={`flex-1 py-4 rounded-2xl items-center ${
              (step === 1 && !assetScanned) ? 'bg-blue-300' : 'bg-blue-600'
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                {step === 1 ? 'Next' : 'Confirm Borrow'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
