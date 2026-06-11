import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { cancelarReserva, Factura, getFacturaReserva, getMisReservas, Reserva } from '../api/api';
import { useSocket } from '../hooks/useSocket';
import { COLORS } from '../config';
import { ReservasStackParams } from '../navigation/AppNavigator';

type Nav = StackNavigationProp<ReservasStackParams, 'MisReservas'>;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: '#F59E0B', icon: 'time-outline' },
  CONFIRMADA: { label: 'Confirmada', color: '#3B82F6', icon: 'checkmark-circle-outline' },
  ACTIVA:     { label: 'Activa',     color: '#10B981', icon: 'car-outline' },
  COMPLETADA: { label: 'Completada', color: '#6B7280', icon: 'checkmark-done-outline' },
  CANCELADA:  { label: 'Cancelada',  color: '#EF4444', icon: 'close-circle-outline' },
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  return iso.split('T')[0];
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: COLORS.textSecondary, icon: 'ellipse-outline' };
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'PENDIENTE' || status === 'ACTIVA') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  return (
    <Animated.View style={[styles.badge, { backgroundColor: cfg.color + '20', transform: [{ scale: pulse }] }]}>
      <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </Animated.View>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonReserva() {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const box = (w: string | number, h: number) => (
    <View style={{ height: h, width: w, backgroundColor: COLORS.border, borderRadius: 6 }} />
  );

  return (
    <Animated.View style={[styles.card, { opacity: anim, marginBottom: 12 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        {box('55%', 15)}
        {box(80, 22)}
      </View>
      {box('35%', 11)}
      <View style={{ height: 10 }} />
      {box('70%', 12)}
      <View style={{ height: 6 }} />
      {box('40%', 12)}
      <View style={{ height: 14 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {box(80, 20)}
        {box(80, 32)}
      </View>
    </Animated.View>
  );
}

// ── Animated reservation card ─────────────────────────────────────────────────

function ReservaCard({
  item,
  index,
  onPagar,
  onCancelar,
  onVerFactura,
  loadingFactura,
}: {
  item: Reserva;
  index: number;
  onPagar: (r: Reserva) => void;
  onCancelar: (id: string) => void;
  onVerFactura: (reservaId: string) => void;
  loadingFactura: string | null;
}) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 80,
        useNativeDriver: true,
        speed: 14,
        bounciness: 3,
      }),
    ]).start();
  }, []);

  const canCancel = item.status === 'PENDIENTE' || item.status === 'CONFIRMADA';
  const canPay    = item.status === 'PENDIENTE';
  const total     = Number(item.totalAmount || 0);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }], marginBottom: 12 }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.vehiculo?.modelo?.marca?.nombre} {item.vehiculo?.modelo?.nombre ?? 'Vehículo'}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      {item.codigoReserva ? (
        <Text style={styles.codigo}>{item.codigoReserva}</Text>
      ) : null}

      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={15} color={COLORS.textSecondary} />
        <Text style={styles.dateTxt}>
          {formatDate(item.fechaInicio)} → {formatDate(item.fechaFin)}
          {'  '}({item.diasTotal ?? 0} {(item.diasTotal ?? 0) === 1 ? 'día' : 'días'})
        </Text>
      </View>

      {item.vehiculo?.categoria && (
        <View style={styles.dateRow}>
          <Ionicons name="car-outline" size={15} color={COLORS.textSecondary} />
          <Text style={styles.dateTxt}>{item.vehiculo.categoria.nombre}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.total}>${total.toFixed(2)}</Text>
        <View style={styles.actions}>
          {canPay && (
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPagar(item);
              }}
            >
              <Ionicons name="card-outline" size={14} color="#fff" />
              <Text style={styles.payTxt}>Pagar</Text>
            </TouchableOpacity>
          )}
          {item.status === 'COMPLETADA' && (
            <TouchableOpacity
              style={styles.facturaBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onVerFactura(item.id);
              }}
              disabled={loadingFactura === item.id}
            >
              {loadingFactura === item.id ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="receipt-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.facturaTxt}>Factura</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onCancelar(item.id);
              }}
            >
              <Text style={styles.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Factura modal ─────────────────────────────────────────────────────────────

function FacturaModal({ factura, onClose }: { factura: Factura | null; onClose: () => void }) {
  if (!factura) return null;

  const rows = factura.detalles ?? [];
  const fecha = factura.fechaEmision
    ? formatDate(factura.fechaEmision)
    : formatDate(factura.createdAt);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={fm.container}>
        <View style={fm.header}>
          <View>
            <Text style={fm.title}>Factura</Text>
            <Text style={fm.num}>#{factura.numeroFactura}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={fm.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={fm.body} showsVerticalScrollIndicator={false}>
          <View style={fm.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
            <Text style={fm.metaTxt}>Fecha de emisión: {fecha}</Text>
          </View>
          {factura.razonSocial ? (
            <View style={fm.metaRow}>
              <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
              <Text style={fm.metaTxt}>{factura.razonSocial}</Text>
            </View>
          ) : null}
          {factura.rucCliente ? (
            <View style={fm.metaRow}>
              <Ionicons name="card-outline" size={14} color={COLORS.textSecondary} />
              <Text style={fm.metaTxt}>RUC/CI: {factura.rucCliente}</Text>
            </View>
          ) : null}

          {rows.length > 0 && (
            <View style={fm.table}>
              <View style={[fm.tableRow, fm.tableHead]}>
                <Text style={[fm.cell, fm.cellFlex, fm.headTxt]}>Descripción</Text>
                <Text style={[fm.cell, fm.cellQty, fm.headTxt]}>Cant.</Text>
                <Text style={[fm.cell, fm.cellAmt, fm.headTxt]}>Subtotal</Text>
              </View>
              {rows.map((d, i) => (
                <View key={i} style={[fm.tableRow, i % 2 === 1 && fm.rowAlt]}>
                  <Text style={[fm.cell, fm.cellFlex, fm.bodyTxt]}>{d.descripcion}</Text>
                  <Text style={[fm.cell, fm.cellQty, fm.bodyTxt]}>{d.cantidad}</Text>
                  <Text style={[fm.cell, fm.cellAmt, fm.bodyTxt]}>${Number(d.subtotal).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={fm.totals}>
            <View style={fm.totalRow}>
              <Text style={fm.totalLabel}>Subtotal</Text>
              <Text style={fm.totalVal}>${Number(factura.subtotal).toFixed(2)}</Text>
            </View>
            <View style={fm.totalRow}>
              <Text style={fm.totalLabel}>IVA</Text>
              <Text style={fm.totalVal}>${Number(factura.iva).toFixed(2)}</Text>
            </View>
            <View style={[fm.totalRow, fm.totalFinal]}>
              <Text style={fm.totalFinalLabel}>Total</Text>
              <Text style={fm.totalFinalVal}>${Number(factura.total).toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MyReservationsScreen() {
  const navigation = useNavigation<Nav>();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [facturaModal, setFacturaModal] = useState<Factura | null>(null);
  const [loadingFacturaId, setLoadingFacturaId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await getMisReservas();
      setReservas(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e: any) {
      setError(e.message ?? 'Error cargando reservas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Tiempo real — recarga cuando llega cualquier evento relevante
  useSocket(
    ['reserva:creada', 'reserva:confirmada', 'reserva:cancelada', 'reserva:completada', 'pago:procesado'],
    () => load(),
  );

  // Fallback polling cada 30 s
  useEffect(() => {
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const handleCancelar = (id: string) => {
    Alert.alert(
      'Cancelar reserva',
      '¿Estás seguro de que deseas cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelarReserva(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setReservas((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status: 'CANCELADA' } : r))
              );
            } catch (e: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', e.message ?? 'No se pudo cancelar');
            }
          },
        },
      ]
    );
  };

  const handlePagar = (reserva: Reserva) => {
    navigation.navigate('Pago', {
      reservaId: reserva.id,
      totalAmount: Number(reserva.totalAmount || 0),
      codigoReserva: reserva.codigoReserva,
      diasTotal: reserva.diasTotal ?? 0,
      vehiculoNombre: [
        reserva.vehiculo?.modelo?.marca?.nombre,
        reserva.vehiculo?.modelo?.nombre,
      ].filter(Boolean).join(' ') || 'Vehículo',
    });
  };

  const handleVerFactura = async (reservaId: string) => {
    setLoadingFacturaId(reservaId);
    try {
      const f = await getFacturaReserva(reservaId);
      if (f) {
        setFacturaModal(f);
      } else {
        Alert.alert('Factura', 'La factura aún no está disponible para esta reserva.');
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar la factura.');
    } finally {
      setLoadingFacturaId(null);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, padding: 14 }}>
        <SkeletonReserva />
        <SkeletonReserva />
        <SkeletonReserva />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorTxt}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={{ backgroundColor: COLORS.background }}
        data={reservas}
        keyExtractor={(r) => r.id}
        renderItem={({ item, index }) => (
          <ReservaCard
            item={item}
            index={index}
            onPagar={handlePagar}
            onCancelar={handleCancelar}
            onVerFactura={handleVerFactura}
            loadingFactura={loadingFacturaId}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTxt}>No tienes reservas aún</Text>
            <Text style={styles.emptySub}>Explora el marketplace y reserva tu vehículo</Text>
          </View>
        }
      />
      <FacturaModal factura={facturaModal} onClose={() => setFacturaModal(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTxt: { color: COLORS.error, marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 14, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 8 },
  retryTxt: { color: '#fff', fontWeight: '600' },
  list: { padding: 14, paddingBottom: 24 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  codigo: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 8, fontFamily: 'monospace' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dateTxt: { fontSize: 13, color: COLORS.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  total: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  actions: { flexDirection: 'row', gap: 8 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  payTxt: { color: '#fff', fontWeight: '600', fontSize: 13 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.error },
  cancelTxt: { color: COLORS.error, fontWeight: '600', fontSize: 13 },
  facturaBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.primary },
  facturaTxt: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  emptyTxt: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12 },
  emptySub: { fontSize: 13, color: COLORS.border, marginTop: 6, textAlign: 'center' },
});

const fm = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  num: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, fontFamily: 'monospace' },
  closeBtn: { padding: 4 },
  body: { padding: 20, paddingBottom: 40 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metaTxt: { fontSize: 13, color: COLORS.textSecondary },
  table: { marginTop: 20, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  tableRow: { flexDirection: 'row', padding: 10 },
  tableHead: { backgroundColor: COLORS.primary + '15' },
  rowAlt: { backgroundColor: COLORS.surface },
  headTxt: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  bodyTxt: { fontSize: 13, color: COLORS.text },
  cell: { paddingHorizontal: 4 },
  cellFlex: { flex: 1 },
  cellQty: { width: 45, textAlign: 'center' },
  cellAmt: { width: 80, textAlign: 'right' },
  totals: { marginTop: 16, gap: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, color: COLORS.textSecondary },
  totalVal: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  totalFinal: { marginTop: 8, paddingTop: 8, borderTopWidth: 1.5, borderTopColor: COLORS.border },
  totalFinalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  totalFinalVal: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
});
