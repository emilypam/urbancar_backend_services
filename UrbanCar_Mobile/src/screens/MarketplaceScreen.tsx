import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getCategorias, getMarketplace, Vehiculo } from '../api/api';
import { COLORS } from '../config';
import { MarketplaceStackParams } from '../navigation/AppNavigator';
import { useSocket } from '../hooks/useSocket';

type Nav = StackNavigationProp<MarketplaceStackParams, 'Marketplace'>;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { marginBottom: 12, opacity: anim }]}>
      <View style={{ height: 180, backgroundColor: COLORS.border }} />
      <View style={{ padding: 14, gap: 10 }}>
        <View style={{ height: 16, width: '65%', backgroundColor: COLORS.border, borderRadius: 6 }} />
        <View style={{ height: 12, width: '45%', backgroundColor: COLORS.border, borderRadius: 6 }} />
        <View style={{ height: 12, width: '60%', backgroundColor: COLORS.border, borderRadius: 6 }} />
        <View style={{ height: 24, width: '38%', backgroundColor: COLORS.border, borderRadius: 6, marginTop: 2 }} />
      </View>
    </Animated.View>
  );
}

// ── Animated vehicle card ─────────────────────────────────────────────────────

function VehicleCard({ item, onPress }: { item: Vehiculo; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const shrink  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 0 }).start();
  const restore = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 18, bounciness: 5 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 12 }}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={shrink}
        onPressOut={restore}
        activeOpacity={1}
      >
        {item.imagenUrl ? (
          <Image source={{ uri: item.imagenUrl }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={styles.cardImgPlaceholder}>
            <Ionicons name="car-outline" size={48} color={COLORS.border} />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>
            {item.modelo?.marca?.nombre} {item.modelo?.nombre}
          </Text>
          <Text style={styles.cardSub}>{item.categoria?.nombre} · {item.anio}</Text>
          <View style={styles.cardRow}>
            <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.cardMeta}> {item.numeroPasajeros} pasajeros</Text>
            <Ionicons name="flash-outline" size={14} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
            <Text style={styles.cardMeta}> {item.tipoCombustible?.nombre}</Text>
          </View>
          <Text style={styles.cardPrice}>
            ${Number(item.precioDia || 0).toFixed(2)}<Text style={styles.cardPriceSub}> / día</Text>
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MarketplaceScreen() {
  const navigation = useNavigation<Nav>();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [filtered, setFiltered] = useState<Vehiculo[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [veh, cats] = await Promise.all([
        getMarketplace(selectedCat ? { categoriaId: selectedCat } : {}),
        categorias.length ? Promise.resolve(categorias) : getCategorias(),
      ]);
      const vehArr = Array.isArray(veh) ? veh : [];
      const catsArr = Array.isArray(cats) ? cats : [];
      setVehiculos(vehArr);
      setFiltered(vehArr);
      if (!categorias.length) setCategorias(catsArr);
    } catch (e: any) {
      setError(e.message ?? 'Error cargando vehículos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCat]);

  useEffect(() => { loadData(); }, [loadData]);

  useSocket(
    ['reserva:creada', 'reserva:confirmada', 'reserva:cancelada', 'reserva:completada'],
    () => { setTimeout(loadData, 800); },
  );

  useEffect(() => {
    if (!search.trim()) { setFiltered(vehiculos); return; }
    const q = search.toLowerCase();
    setFiltered(
      vehiculos.filter(
        (v) =>
          v.modelo?.nombre?.toLowerCase().includes(q) ||
          v.modelo?.marca?.nombre?.toLowerCase().includes(q) ||
          v.categoria?.nombre?.toLowerCase().includes(q) ||
          v.placa?.toLowerCase().includes(q)
      )
    );
  }, [search, vehiculos]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
          <View style={{ flex: 1, height: 14, backgroundColor: COLORS.border, borderRadius: 4, opacity: 0.6 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por marca, modelo..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categorías */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        style={styles.catScroll}
      >
        {[{ id: '', nombre: 'Todos' }, ...categorias].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.catChip, (selectedCat ?? '') === item.id && styles.catChipActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedCat(item.id || null);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={(selectedCat ?? '') === item.id ? styles.catChipTextActive : styles.catChipText}
              numberOfLines={1}
            >
              {item.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => (
            <VehicleCard
              item={item}
              onPress={() => navigation.navigate('VehicleDetail', { vehiculoId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="car-outline" size={64} color={COLORS.border} />
              <Text style={styles.emptyText}>No hay vehículos disponibles</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  catScroll: { flexShrink: 0, flexGrow: 0 },
  catList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 13, color: COLORS.textSecondary },
  catChipTextActive: { fontSize: 13, color: '#fff', fontWeight: '600' },
  list: { padding: 12, paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImg: { width: '100%', height: 180 },
  cardImgPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardMeta: { fontSize: 13, color: COLORS.textSecondary },
  cardPrice: { fontSize: 20, fontWeight: '800', color: COLORS.accent },
  cardPriceSub: { fontSize: 13, fontWeight: '400', color: COLORS.textSecondary },
  errorText: { marginTop: 12, color: COLORS.error, textAlign: 'center', fontSize: 14 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 15 },
});
