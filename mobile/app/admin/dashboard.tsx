import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StatusBar, Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';
import {
  TriangleAlert, Users, ClipboardList, Timer,
  AlertCircle, Plus, ScanLine, LayoutGrid, UserCog, Bell,
} from 'lucide-react-native';

// ─── API ──────────────────────────────────────────────────────────────────────
const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  API_BASE_URL = `http://${debuggerHost.split(':')[0]}:3000/api`;
}
export { API_BASE_URL };

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactElement;
  value: number;
  label: string;
  barColor: string;
  barPercent: number;
}

interface AlertCardProps {
  icon: React.ReactElement;
  iconBg: string;
  count: number;
  title: string;
  subtitle: string;
  textColor: string;
}

interface AuditLogBadgeProps {
  label: string;
  color: string;
  textColor: string;
}

interface AuditLogItemProps {
  initial: string;
  avatarBg: string;
  description: React.ReactElement;
  assetName: string;
  assetId: string;
  timeAgo: string;
  badge: AuditLogBadgeProps;
}

interface AdminDashboardProps {
  totalAssets?: number;
  inUseCount?: number;
  criticalCount?: number;
  overdueCount?: number;
  newLeasesCount?: number;
  auditLogs?: AuditLogItemProps[];
  onAddAsset?: () => void;
  onScanQR?: () => void;
  onInventory?: () => void;
  onUsers?: () => void;
  onViewAllLogs?: () => void;
  onLogout?: () => void;
  pendingCount?: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, barColor, barPercent }) => {
  const widthPercent = Math.min(Math.max(barPercent, 2), 100);
  return (
    <View style={{
      width: '31%',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#94A3B8',
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <View className="mb-2">{icon}</View>
      <Text className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</Text>
      <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">{label}</Text>
      <View className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
        <View style={{ width: `${widthPercent}%`, height: 4, backgroundColor: barColor, borderRadius: 2 }} />
      </View>
    </View>
  );
};

const AlertCard: React.FC<AlertCardProps> = ({
  icon, iconBg, count, title, subtitle, textColor
}) => (
  <View style={{
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#94A3B8',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  }}>
    <View className={`w-11 h-11 rounded-full items-center justify-center ${iconBg}`}>
      {icon}
    </View>
    <View className="flex-1">
      <Text className={`text-base font-bold ${textColor}`}>{count} Items</Text>
      <Text className="text-xs text-slate-400 font-medium">{title}</Text>
    </View>
  </View>
);

const ActionButton: React.FC<{
  onPress: () => void;
  icon: React.ReactElement;
  label: string;
  primary?: boolean;
}> = ({ onPress, icon, label, primary = false }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      width: '47%',
      backgroundColor: primary ? '#2563EB' : '#FFFFFF',
      borderRadius: 16,
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: primary ? '#2563EB' : '#94A3B8',
      shadowOpacity: primary ? 0.35 : 0.07,
      shadowRadius: primary ? 12 : 8,
      elevation: primary ? 6 : 2,
    }}
  >
    {icon}
    <Text style={{
      marginTop: 8,
      fontSize: 14,
      fontWeight: '700',
      color: primary ? '#FFFFFF' : '#334155',
    }}>
      {label}
    </Text>
  </TouchableOpacity>
);

const AuditBadge: React.FC<AuditLogBadgeProps> = ({ label, color, textColor }) => (
  <View style={{ backgroundColor: color, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', color: textColor, letterSpacing: 0.5 }}>{label}</Text>
  </View>
);

const AuditItem: React.FC<AuditLogItemProps> = ({
  initial, avatarBg, description, assetName, assetId, timeAgo, badge
}) => (
  <View className="flex-row items-start py-4 border-b border-slate-50">
    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${avatarBg}`}>
      <Text className="text-white font-bold text-sm">{initial}</Text>
    </View>
    <View className="flex-1">
      <View className="flex-row flex-wrap items-center mb-1">
        {description}
      </View>
      <Text className="text-sm font-bold text-slate-800 mb-1">{assetName}</Text>
      <View className="flex-row items-center gap-2">
        <Text className="text-xs text-slate-400 font-medium">{assetId}</Text>
        <View className="w-1 h-1 rounded-full bg-slate-300" />
        <AuditBadge {...badge} />
      </View>
    </View>
    <Text className="text-xs text-slate-400 font-medium ml-2">{timeAgo}</Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  totalAssets = 0,
  inUseCount = 0,
  criticalCount = 0,
  overdueCount = 0,
  newLeasesCount = 0,
  auditLogs = [],
  onAddAsset = () => {},
  onScanQR = () => {},
  onInventory = () => {},
  onUsers = () => {},
  onViewAllLogs = () => {},
  onLogout,
  pendingCount = 0,
}) => {
  const router = useRouter();

  const total = totalAssets || 1; // avoid division by zero
  const inUsePercent = Math.round((inUseCount / total) * 100);
  const maintenancePercent = Math.round((criticalCount / total) * 100);

  return (
  <View style={{ flex: 1, backgroundColor: '#F1F5F9', paddingTop: 48 }}>
    <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Control Center</Text>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A' }}>Admin Hub</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/admin/requests')}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#94A3B8', shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 }}
        >
          <Bell size={22} color="#334155" />
          {pendingCount > 0 && (
            <View style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Alert Cards */}
      <Text style={{ marginHorizontal: 24, marginBottom: 12, fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase' }}>Attention Required</Text>
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
            <TriangleAlert size={20} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#EF4444' }}>{overdueCount} Items</Text>
            <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500' }}>Overdue Returns</Text>
          </View>
        </View>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="#F97316" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#F97316' }}>{pendingCount} Items</Text>
            <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '500' }}>Borrow Requests</Text>
          </View>
        </View>
      </View>

      {/* Stat Cards */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, gap: 10 }}>
        <TouchableOpacity
          onPress={() => router.push('/admin/inventory')}
          activeOpacity={0.7}
          style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}
        >
          <View style={{ marginBottom: 8 }}><ClipboardList size={20} color="#2563EB" /></View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>{totalAssets}</Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>ASSETS</Text>
          <View style={{ width: '100%', height: 4, backgroundColor: '#F1F5F9', borderRadius: 2 }}>
            <View style={{ width: '100%', height: 4, backgroundColor: '#2563EB', borderRadius: 2 }} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/admin/asset-status?filter=borrowed')}
          activeOpacity={0.7}
          style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}
        >
          <View style={{ marginBottom: 8 }}><Timer size={20} color="#F97316" /></View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>{inUseCount}</Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>IN USE</Text>
          <View style={{ width: '100%', height: 4, backgroundColor: '#F1F5F9', borderRadius: 2 }}>
            <View style={{ width: `${Math.min(Math.max(inUsePercent, 2), 100)}%`, height: 4, backgroundColor: '#F97316', borderRadius: 2 }} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/admin/asset-status?filter=maintenance')}
          activeOpacity={0.7}
          style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}
        >
          <View style={{ marginBottom: 8 }}><AlertCircle size={20} color="#EF4444" /></View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A' }}>{criticalCount}</Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>CRITICAL</Text>
          <View style={{ width: '100%', height: 4, backgroundColor: '#F1F5F9', borderRadius: 2 }}>
            <View style={{ width: `${Math.min(Math.max(maintenancePercent, 2), 100)}%`, height: 4, backgroundColor: '#EF4444', borderRadius: 2 }} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={{ marginHorizontal: 20, marginBottom: 12, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={onAddAsset} style={{ flex: 1, backgroundColor: '#2563EB', borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 }}>
            <Plus size={26} color="white" />
            <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Add Asset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onScanQR} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}>
            <ScanLine size={26} color="#334155" />
            <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '700', color: '#334155' }}>Scan QR</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={onInventory} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}>
            <LayoutGrid size={24} color="#334155" />
            <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '700', color: '#334155' }}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onUsers} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}>
            <UserCog size={24} color="#334155" />
            <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '700', color: '#334155' }}>Users</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Audit Log */}
      <View style={{ marginHorizontal: 24, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase' }}>Recent Audit Log</Text>
          <TouchableOpacity onPress={onViewAllLogs}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#2563EB' }}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, paddingTop: 8, shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}>
          {auditLogs.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <ClipboardList size={32} color="#CBD5E1" />
              <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '500', marginTop: 12 }}>No recent activity</Text>
            </View>
          ) : (
            auditLogs.map((log, idx) => <AuditItem key={idx} {...log} />)
          )}
        </View>
      </View>

      {/* Logout */}
      {onLogout && (
        <TouchableOpacity
          onPress={onLogout}
          style={{ marginHorizontal: 24, marginTop: 24, marginBottom: 16, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 0.5, borderColor: '#FECACA' }}
        >
          <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 14 }}>Log Out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  </View>
  );
};

// ─── Route Wrapper ────────────────────────────────────────────────────────────
export default function AdminDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalAssets: 0, inUseCount: 0, criticalCount: 0,
    overdueCount: 0, newLeasesCount: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogItemProps[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const fetchStats = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await axios.get(`${API_BASE_URL}/assets/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats({
        totalAssets:    res.data.total      ?? 0,
        inUseCount:     res.data.inUse      ?? 0,
        criticalCount:  res.data.maintenance ?? 0,
        overdueCount:   res.data.overdue    ?? 0,
        newLeasesCount: res.data.newLeases  ?? 0,
      });
    } catch (err) {
      console.error('Stats fetch failed', err);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const [allRes, pendingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/transactions/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/admin/transactions/pending`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const returnRequested = allRes.data.filter((t: any) => t.status === 'return_requested').length;
      setPendingCount(pendingRes.data.length + returnRequested);
      const res = allRes;
      // take only first 5 for dashboard preview
      const logs = res.data.slice(0, 5).map((t: any) => ({
        id: t.id,
        initial: t.user?.firstName?.charAt(0) ?? t.user?.studentId?.charAt(0) ?? '?',
        avatarBg: t.status === 'returned' ? 'bg-green-500' : 
                  t.status === 'approved' ? 'bg-blue-500' :
                  t.status === 'rejected' ? 'bg-red-500' : 'bg-orange-400',
        description: (
          <Text className="text-xs text-slate-600">
            <Text className="font-bold">{t.user?.firstName ?? t.user?.studentId}</Text>
            {t.status === 'returned' ? ' returned ' : 
             t.status === 'approved' ? ' borrowed ' :
             t.status === 'rejected' ? ' was rejected for ' : ' requested '}
            <Text className="font-bold">{t.asset?.name}</Text>
          </Text>
        ),
        assetName: t.asset?.name ?? '',
        assetId: `ID: ${t.asset?.serialNumber ?? ''}`,
        timeAgo: new Date(t.borrowDate).toLocaleDateString('th-TH'),
        badge: {
          label: t.status.toUpperCase(),
          color: t.status === 'returned'  ? '#D1FAE5' :
                 t.status === 'approved'  ? '#DBEAFE' :
                 t.status === 'rejected'  ? '#FEE2E2' : '#FEF3C7',
          textColor: t.status === 'returned'  ? '#065F46' :
                     t.status === 'approved'  ? '#1E40AF' :
                     t.status === 'rejected'  ? '#991B1B' : '#92400E',
        }
      }));
      setAuditLogs(logs);
    } catch (err) {
      console.error('Audit log fetch failed', err);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchStats();
    fetchAuditLogs();
  }, [fetchStats, fetchAuditLogs]));

  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchAuditLogs();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchAuditLogs]);

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('studentId');
            await SecureStore.deleteItemAsync('firstName');
            router.replace('/');
          }
        }
      ]
    );
  };

  return (
    <AdminDashboard
      totalAssets={stats.totalAssets}
      inUseCount={stats.inUseCount}
      criticalCount={stats.criticalCount}
      overdueCount={stats.overdueCount}
      newLeasesCount={stats.newLeasesCount}
      auditLogs={auditLogs}
      onAddAsset={() => router.push('/admin/add-asset')}
      onScanQR={() => router.push('/scanner')}
      onInventory={() => router.push('/admin/inventory')}
      onUsers={() => router.push('/admin/users')}
      onViewAllLogs={() => router.push('/admin/logs')}
      onLogout={handleLogout}
      pendingCount={pendingCount}
    />
  );
}
