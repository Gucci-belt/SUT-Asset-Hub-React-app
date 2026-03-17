import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [flashlight, setFlashlight] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({ type, data }) => {
    setScanned(true);
    // After scanning, navigate to the Asset Detail screen 
    // Usually we would pass 'data' (the ID) as a router parameter
    router.push('/detail');
  };

  const toggleFlashlight = () => {
    setFlashlight(prev => !prev);
  }

  if (hasPermission === null) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <Text className="text-white">Requesting for camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <Text className="text-white">No access to camera</Text>
        <TouchableOpacity className="mt-4 px-4 py-2 bg-orange-500 rounded-lg" onPress={() => router.back()}>
           <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Camera View */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        enableTorch={flashlight}
      />

      {/* Header Overlay */}
      <SafeAreaView edges={['top']} className="absolute top-0 w-full bg-black/40">
        <View className="flex-row items-center px-4 pb-4 pt-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Text className="text-white font-bold text-lg">{'<'} Back</Text>
          </TouchableOpacity>
          <View className="flex-1 items-center pr-12">
             <Text className="text-white font-semibold text-lg">Scan Asset QR</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Center Target Box */}
      <View className="absolute inset-0 justify-center items-center pointer-events-none">
        <View className="w-64 h-64 border-2 border-orange-500 rounded-2xl bg-transparent" />
      </View>

      {/* Bottom Panel */}
      <View className="absolute bottom-0 w-full bg-white rounded-t-3xl items-center px-6 py-8 pb-10">
        {/* Flashlight Button */}
        <TouchableOpacity 
          className="absolute -top-8 w-16 h-16 rounded-full items-center justify-center bg-orange-500 shadow-xl"
          style={{ elevation: 5, shadowColor: '#ea580c', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
          onPress={toggleFlashlight}
        >
          <Text className="text-white font-bold text-xs">{flashlight ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
        
        <Text className="text-slate-600 text-center mt-6 text-base px-4">
          Point camera at the QR code on the equipment to borrow
        </Text>

        {scanned && (
           <TouchableOpacity 
             className="mt-6 px-6 py-3 bg-slate-100 rounded-full"
             onPress={() => setScanned(false)}
           >
             <Text className="text-orange-600 font-bold">Tap to Scan Again</Text>
           </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
