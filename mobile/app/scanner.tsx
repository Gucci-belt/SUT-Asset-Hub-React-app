import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { ChevronLeft } from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScannerProps {
  onScanSuccess: (assetId: string) => void;
}

// ─── Corner Bracket Overlay ───────────────────────────────────────────────────
const ScanFrame: React.FC = () => {
  const cornerSize = 24;
  const borderWidth = 3;
  const cornerColor = 'white';
  const frameSize = 220;

  return (
    <View
      style={{
        width: frameSize,
        height: frameSize,
        position: 'relative',
      }}
    >
      {/* Top-left */}
      <View style={{ position: 'absolute', top: 0, left: 0 }}>
        <View style={{ width: cornerSize, height: borderWidth, backgroundColor: cornerColor, borderTopLeftRadius: 4 }} />
        <View style={{ width: borderWidth, height: cornerSize, backgroundColor: cornerColor }} />
      </View>
      {/* Top-right */}
      <View style={{ position: 'absolute', top: 0, right: 0, alignItems: 'flex-end' }}>
        <View style={{ width: cornerSize, height: borderWidth, backgroundColor: cornerColor, borderTopRightRadius: 4 }} />
        <View style={{ width: borderWidth, height: cornerSize, backgroundColor: cornerColor, alignSelf: 'flex-end' }} />
      </View>
      {/* Bottom-left */}
      <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
        <View style={{ width: borderWidth, height: cornerSize, backgroundColor: cornerColor }} />
        <View style={{ width: cornerSize, height: borderWidth, backgroundColor: cornerColor, borderBottomLeftRadius: 4 }} />
      </View>
      {/* Bottom-right */}
      <View style={{ position: 'absolute', bottom: 0, right: 0, alignItems: 'flex-end' }}>
        <View style={{ width: borderWidth, height: cornerSize, backgroundColor: cornerColor, alignSelf: 'flex-end' }} />
        <View style={{ width: cornerSize, height: borderWidth, backgroundColor: cornerColor, borderBottomRightRadius: 4 }} />
      </View>
    </View>
  );
};

// ─── Permission Screens ───────────────────────────────────────────────────────
const PermissionLoading: React.FC = () => (
  <View className="flex-1 items-center justify-center bg-slate-900">
    <Text className="text-white text-base font-medium">Requesting camera permission…</Text>
  </View>
);

const PermissionDenied: React.FC<{ onRequest: () => void }> = ({ onRequest }) => (
  <View className="flex-1 items-center justify-center bg-slate-900 px-8">
    <Text className="text-white text-xl font-bold mb-3 text-center">Camera Access Required</Text>
    <Text className="text-slate-400 text-sm text-center mb-8 leading-6">
      Please allow camera access to scan QR codes on lab equipment.
    </Text>
    <TouchableOpacity
      onPress={onRequest}
      className="bg-[#2563EB] px-8 py-4 rounded-2xl"
    >
      <Text className="text-white font-bold text-base">Grant Permission</Text>
    </TouchableOpacity>
  </View>
);


// ─── Scanner Screen ───────────────────────────────────────────────────────────
const ScannerScreen: React.FC<ScannerProps> = ({ onScanSuccess }) => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    onScanSuccess(result.data);
  };

  const handleSubmit = () => {
    setScanned(false);
  };

  if (!permission) return <PermissionLoading />;
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-white pt-12">
        <StatusBar barStyle="dark-content" />
        <View className="flex-row items-center px-6 py-4 border-b border-slate-100">
          <TouchableOpacity onPress={() => router.back()} className="w-8 h-8 items-center justify-center">
            <ChevronLeft color="#0F172A" size={24} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-lg font-bold text-slate-900 mr-8">Scan Asset</Text>
        </View>
        <PermissionDenied onRequest={requestPermission} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-12">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-50">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-8 h-8 items-center justify-center"
        >
          <ChevronLeft color="#0F172A" size={24} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-slate-900 mr-8">
          Scan Asset
        </Text>
      </View>

      {/* ── Camera Viewfinder ───────────────────────────────────────────── */}
      <View className="mx-6 mt-6 rounded-3xl overflow-hidden" style={{ height: 300, backgroundColor: '#1E1E1E' }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          {/* Dark overlay with centered scan frame */}
          <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <ScanFrame />
          </View>
        </CameraView>
      </View>

      {/* ── Instructions ────────────────────────────────────────────────── */}
      <View className="px-8 mt-8 items-center">
        <Text className="text-slate-500 text-sm text-center leading-6">
          {scanned
            ? 'QR code scanned! Press Submit to continue.'
            : "Align the asset's QR code within the frame\nto\nborrow or return."}
        </Text>
      </View>

      {/* ── Submit / Scan Again ──────────────────────────────────────────── */}
      <View className="px-6 mt-8">
        <TouchableOpacity
          onPress={scanned ? handleSubmit : undefined}
          className={`py-4 rounded-2xl items-center ${scanned ? 'bg-[#2563EB]' : 'bg-slate-200'}`}
          style={scanned ? { shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 } : {}}
        >
          <Text className={`text-base font-bold ${scanned ? 'text-white' : 'text-slate-400'}`}>
            {scanned ? 'Submit' : 'Submit'}
          </Text>
        </TouchableOpacity>

        {scanned && (
          <TouchableOpacity
            onPress={() => setScanned(false)}
            className="py-3 items-center mt-3"
          >
            <Text className="text-[#2563EB] text-sm font-bold">Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Spacer ─────────────────────────────────────────────────────── */}
      <View className="flex-1" />
    </View>
  );
};

// ─── Route Wrapper ────────────────────────────────────────────────────────────
export default function ScannerRoute() {
  const router = useRouter();

  const handleScanSuccess = (assetId: string) => {
    router.push(`/asset/${assetId}`);
  };

  return <ScannerScreen onScanSuccess={handleScanSuccess} />;
}
