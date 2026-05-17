import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar,
  Image, SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { ChevronLeft, Search, CalendarClock } from 'lucide-react-native';
import { globalAuthToken, setAuthToken } from '../globalAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomTabBar from '../components/BottomTabBar';

// ─── API ──────────────────────────────────────────────────────────────────────
const debuggerHost = Constants.expoConfig?.hostUri;
let API_BASE_URL = 'http://10.0.2.2:3000/api';
if (debuggerHost) {
  API_BASE_URL = `http://${debuggerHost.split(':')[0]}:3000/api`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type BorrowStatus = 'active' | 'pending' | 'approved' | 'returned' | 'borrowed' | 'rejected';

interface BorrowRecord {
  id: string;
  assetName: string;
  assetId: string;
  assetImageUri: string;
  borrowedDate: string;
  status: BorrowStatus;
  dueLabel?: string;
}

interface HistoryScreenProps {
  currentlyBorrowing: BorrowRecord[];
  pastHistory: BorrowRecord[];
  isLoading: boolean;
  isRefreshing: boolean;
  onExtend: (id: string) => void;
  onDetails: (id: string) => void;
  onBack: () => void;
  onSearch: () => void;
  onRefresh: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string): string => {
  if (!d) return '—';
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yy = String(dt.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

const isActiveBorrow = (status: BorrowStatus) =>
  status === 'active' || status === 'approved' || status === 'borrowed' || status === 'pending';

const getDueLabel = (dueDate?: string, status?: BorrowStatus): string | undefined => {
  if (!dueDate || !isActiveBorrow(status ?? 'returned')) return undefined;
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'OVERDUE';
  if (diffDays === 0) return 'DUE TODAY';
  if (diffDays === 1) return 'DUE TOMORROW';
  return undefined;
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <View
    className={`px-2 py-1 rounded-md ${active ? 'bg-orange-400' : 'bg-slate-700'}`}
  >
    <Text className="text-white text-[10px] font-bold tracking-wide">{label}</Text>
  </View>
);

// ─── Borrow Card ──────────────────────────────────────────────────────────────
const BorrowCard: React.FC<{
  item: BorrowRecord;
  onExtend: (id: string) => void;
  onDetails: (id: string) => void;
}> = ({ item, onExtend, onDetails }) => {
  const active = isActiveBorrow(item.status);
  const badgeLabel = item.dueLabel ?? (active ? 'ACTIVE' : 'RETURNED');
  const showOrangeBadge = active && !!item.dueLabel;
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/borrow-detail?id=${item.id}`)}
      activeOpacity={0.7}
      className="bg-white rounded-xl mx-4 mb-3 p-4 flex-row items-start"
      style={{ shadowColor: '#94A3B8', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 }}
    >
      {/* Thumbnail */}
      <View className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 mr-4 flex-shrink-0">
        {item.assetImageUri ? (
          <Image
            source={{ uri: item.assetImageUri }}
            className="w-16 h-16"
            resizeMode="cover"
          />
        ) : (
          <View className="w-16 h-16 bg-slate-200 items-center justify-center">
            <CalendarClock size={24} color="#94A3B8" />
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        {/* Name row + badge */}
        <View className="flex-row items-start justify-between mb-1">
          <Text className="text-base font-semibold text-slate-900 flex-1 mr-2" numberOfLines={1}>
            {item.assetName}
          </Text>
          <StatusBadge
            label={item.status === 'returned' ? 'RETURNED' : badgeLabel}
            active={showOrangeBadge}
          />
        </View>

        {/* Sub-info */}
        <Text className="text-xs text-slate-400 mb-3">
          {`ID: ${item.assetId} • Borrowed: ${item.borrowedDate}`}
        </Text>

        {/* Action button */}
        {active ? (
          <TouchableOpacity
            onPress={() => onExtend(item.id)}
            className="self-start border border-[#3B6BF8] rounded-lg px-4 py-1"
          >
            <Text className="text-[#3B6BF8] text-xs font-semibold">Extend</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => onDetails(item.id)}
            className="self-start border border-slate-300 rounded-lg px-4 py-1"
          >
            <Text className="text-slate-500 text-xs font-semibold">Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase mx-4 mb-3 mt-5">
    {title}
  </Text>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <View className="flex-1 items-center justify-center pt-24 px-8">
    <View className="w-20 h-20 bg-slate-100 rounded-3xl items-center justify-center mb-6">
      <CalendarClock size={40} color="#CBD5E1" />
    </View>
    <Text className="text-lg font-bold text-slate-800 mb-2">No Records Found</Text>
    <Text className="text-sm text-slate-400 text-center leading-5">
      {"You haven't borrowed any assets yet."}
    </Text>
  </View>
);


// ─── Pure Screen ──────────────────────────────────────────────────────────────
const HistoryScreen: React.FC<HistoryScreenProps> = ({
  currentlyBorrowing,
  pastHistory,
  isLoading,
  isRefreshing,
  onExtend,
  onDetails,
  onBack,
  onSearch,
  onRefresh,
}) => {
  const isEmpty = currentlyBorrowing.length === 0 && pastHistory.length === 0;

  type SectionData = { title: string; data: BorrowRecord[] };

  const sections: SectionData[] = [];
  if (currentlyBorrowing.length > 0) {
    sections.push({ title: 'CURRENTLY BORROWING', data: currentlyBorrowing });
  }
  if (pastHistory.length > 0) {
    sections.push({ title: 'PAST HISTORY', data: pastHistory });
  }

  return (
    <View className="flex-1 pt-12" style={{ backgroundColor: '#F2F4F7' }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View className="bg-white flex-row items-center px-4 py-4 border-b border-slate-50">
        <TouchableOpacity
          onPress={onBack}
          className="w-9 h-9 items-center justify-center"
        >
          <ChevronLeft color="#0F172A" size={24} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-slate-900">History</Text>
        <TouchableOpacity
          onPress={onSearch}
          className="w-9 h-9 items-center justify-center"
        >
          <Search color="#0F172A" size={22} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      {isLoading && !isRefreshing ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-400 text-sm font-medium">Loading…</Text>
        </View>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 4 }}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} />
          )}
          renderItem={({ item }) => (
            <BorrowCard
              item={item}
              onExtend={onExtend}
              onDetails={onDetails}
            />
          )}
          stickySectionHeadersEnabled={false}
        />
      )}

      <BottomTabBar activeTab="history" />
    </View>
  );
};

// ─── Route Container (handles data fetching) ──────────────────────────────────
export default function HistoryRoute() {
  const router = useRouter();

  const [currentlyBorrowing, setCurrentlyBorrowing] = useState<BorrowRecord[]>([]);
  const [pastHistory, setPastHistory] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      let token = globalAuthToken;
      if (!token) {
        try {
          token = await AsyncStorage.getItem('userToken');
          if (token) setAuthToken(token);
        } catch (_) {}
      }
      if (!token) { router.replace('/'); return; }

      const res = await fetch(`${API_BASE_URL}/transactions/my-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const raw: Array<{
        id: number;
        status: string;
        borrowDate: string;
        dueDate: string;
        returnDate?: string | null;
        asset?: { name?: string; assetCode?: string; imagePath?: string };
      }> = await res.json();

      const toRecord = (t: typeof raw[0]): BorrowRecord => ({
        id: String(t.id),
        assetName: t.asset?.name ?? 'Unknown Asset',
        assetId: t.asset?.assetCode ?? `#${t.id}`,
        assetImageUri: t.asset?.imagePath
          ? `${API_BASE_URL.replace('/api', '')}${t.asset.imagePath}`
          : '',
        borrowedDate: fmtDate(t.borrowDate),
        status: t.status as BorrowStatus,
        dueLabel: getDueLabel(t.dueDate, t.status as BorrowStatus),
      });

      const active = raw.filter(t => isActiveBorrow(t.status as BorrowStatus)).map(toRecord);
      const past = raw.filter(t => !isActiveBorrow(t.status as BorrowStatus)).map(toRecord);

      setCurrentlyBorrowing(active);
      setPastHistory(past);
    } catch (_) {
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => { setIsRefreshing(true); fetchHistory(); };

  return (
    <HistoryScreen
      currentlyBorrowing={currentlyBorrowing}
      pastHistory={pastHistory}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onExtend={(id) => router.push(`/borrow-detail?id=${id}`)}
      onDetails={(id) => router.push(`/borrow-detail?id=${id}`)}
      onBack={() => router.back()}
      onSearch={() => {}}
      onRefresh={onRefresh}
    />
  );
}
