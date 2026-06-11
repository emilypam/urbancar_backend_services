import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createReserva, getVehiculo, Vehiculo } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config';
import { MarketplaceStackParams } from '../navigation/AppNavigator';

type RouteT = RouteProp<MarketplaceStackParams, 'VehicleDetail'>;

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={COLORS.primary} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

function DateButton({
  label,
  date,
  onPress,
}: {
  label: string;
  date: Date | null;
  onPress: () => void;
}) {
  const formatted = date
    ? date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Seleccionar';
  return (
    <TouchableOpacity style={styles.dateBtn} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.dateBtnLabel}>{label}</Text>
      <View style={styles.dateBtnRow}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
        <Text style={[styles.dateBtnValue, !date && styles.dateBtnPlaceholder]}>
          {formatted}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function VehicleDetailScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<'inicio' | 'fin' | null>(null);

  const [notas, setNotas] = useState('');
  const [reservando, setReservando] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getVehiculo(route.params.vehiculoId)
      .then(setVehiculo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [route.params.vehiculoId]);

  const dias =
    startDate && endDate
      ? Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86400000))
      : 0;

  const precioDia = Number(vehiculo?.precioDia || 0);
  const total = dias * precioDia;

  const fechaInicioStr = startDate ? startDate.toISOString().split('T')[0] : '';
  const fechaFinStr = endDate ? endDate.toISOString().split('T')[0] : '';

  const pickerValue = (() => {
    if (activePicker === 'inicio') return startDate ?? new Date();
    const next = startDate ? new Date(startDate.getTime() + 86400000) : new Date();
    return endDate ?? next;
  })();

  const minEndDate = startDate
    ? new Date(startDate.getTime() + 86400000)
    : new Date();

  const handleDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (!date) return;
    if (activePicker === 'inicio') {
      setStartDate(date);
      if (endDate && endDate <= date) setEndDate(null);
    } else if (activePicker === 'fin') {
      setEndDate(date);
    }
  };

  const handleReservar = async () => {
    if (!user) {
      Alert.alert(
        'Inicia sesión',
        'Para reservar un vehículo necesitas una cuenta. ¿Quieres ir a iniciar sesión?',
        [
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Iniciar sesión',
            onPress: () =>
              navigation.dispatch(CommonActions.navigate({ name: 'AuthTab' })),
          },
        ]
      );
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Fechas requeridas', 'Por favor selecciona las fechas de inicio y fin.');
      return;
    }
    if (dias <= 0) {
      Alert.alert('Fechas inválidas', 'La fecha de fin debe ser posterior a la de inicio.');
      return;
    }
    if (!vehiculo) return;

    setReservando(true);
    try {
      await createReserva({
        vehiculoId: vehiculo.id,
        agenciaId: vehiculo.agenciaId,
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr,
        notas: notas || undefined,
      });
      Alert.alert(
        '¡Reserva creada!',
        `Tu reserva por ${dias} días fue registrada con un total de $${total.toFixed(2)}.\n\nVe a "Mis reservas" para completar el pago y confirmarla.`,
        [{ text: 'Entendido', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo crear la reserva');
    } finally {
      setReservando(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (error || !vehiculo) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error || 'Vehículo no encontrado'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {vehiculo.imagenUrl ? (
        <Image source={{ uri: vehiculo.imagenUrl }} style={styles.hero} resizeMode="cover" />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Ionicons name="car-outline" size={80} color={COLORS.border} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.title}>
          {vehiculo.modelo?.marca?.nombre} {vehiculo.modelo?.nombre}
        </Text>
        <Text style={styles.subtitle}>
          {vehiculo.categoria?.nombre} · {vehiculo.anio} · {vehiculo.color}
        </Text>
        <Text style={styles.price}>
          ${precioDia.toFixed(2)}
          <Text style={styles.priceSub}> / día</Text>
        </Text>

        <View style={styles.infoGrid}>
          <InfoRow icon="people-outline" text={`${vehiculo.numeroPasajeros} pasajeros`} />
          <InfoRow
            icon="speedometer-outline"
            text={`${vehiculo.kilometraje.toLocaleString()} km`}
          />
          <InfoRow icon="flash-outline" text={vehiculo.tipoCombustible?.nombre ?? '—'} />
          <InfoRow icon="settings-outline" text={vehiculo.tipoTransmision?.nombre ?? '—'} />
          <InfoRow icon="car-sport-outline" text={`Placa: ${vehiculo.placa}`} />
        </View>

        {/* Reservation form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hacer reserva</Text>

          <View style={styles.dateRow}>
            <DateButton
              label="Fecha inicio"
              date={startDate}
              onPress={() => setActivePicker('inicio')}
            />
            <View style={{ width: 10 }} />
            <DateButton
              label="Fecha fin"
              date={endDate}
              onPress={() => setActivePicker('fin')}
            />
          </View>

          {dias > 0 && (
            <View style={styles.pricePreview}>
              <Text style={styles.previewText}>
                {dias} {dias === 1 ? 'día' : 'días'} × ${precioDia.toFixed(2)}
              </Text>
              <Text style={styles.previewTotal}>Total: ${total.toFixed(2)}</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Notas (opcional)</Text>
          <TextInput
            style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
            value={notas}
            onChangeText={setNotas}
            placeholder="Instrucciones especiales para la agencia..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[styles.reserveBtn, reservando && styles.reserveBtnDisabled]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleReservar();
            }}
            onPressIn={() => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 0 }).start()}
            onPressOut={() => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 5 }).start()}
            disabled={reservando}
            activeOpacity={1}
          >
            {reservando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="calendar-outline" size={20} color="#fff" />
                <Text style={styles.reserveBtnText}>
                  {user ? 'Confirmar reserva' : 'Inicia sesión para reservar →'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* iOS date picker modal */}
      {Platform.OS === 'ios' && activePicker !== null && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {activePicker === 'inicio' ? 'Fecha de inicio' : 'Fecha de fin'}
                </Text>
                <TouchableOpacity onPress={() => setActivePicker(null)}>
                  <Text style={styles.modalDone}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerValue}
                mode="date"
                display="inline"
                minimumDate={activePicker === 'fin' ? minEndDate : new Date()}
                onChange={handleDateChange}
                locale="es-EC"
                accentColor={COLORS.primary}
                themeVariant="light"
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android date picker (auto-shows as dialog) */}
      {Platform.OS === 'android' && activePicker !== null && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          minimumDate={activePicker === 'fin' ? minEndDate : new Date()}
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hero: { width: '100%', height: 240 },
  heroPlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4 },
  price: { fontSize: 26, fontWeight: '800', color: COLORS.accent, marginBottom: 12 },
  priceSub: { fontSize: 14, fontWeight: '400', color: COLORS.textSecondary },
  infoGrid: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: 14, color: COLORS.text },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  dateRow: { flexDirection: 'row' },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    gap: 4,
  },
  dateBtnLabel: { fontSize: 12, color: COLORS.textSecondary },
  dateBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateBtnValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  dateBtnPlaceholder: { color: COLORS.textSoft, fontWeight: '400' },
  inputLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  pricePreview: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: { fontSize: 14, color: COLORS.textSecondary },
  previewTotal: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  reserveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  reserveBtnDisabled: { opacity: 0.6 },
  reserveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: COLORS.error, marginTop: 12, textAlign: 'center' },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  modalDone: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
});
