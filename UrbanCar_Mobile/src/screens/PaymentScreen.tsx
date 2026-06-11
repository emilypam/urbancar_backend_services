import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { pagarReserva } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config';
import { ReservasStackParams } from '../navigation/AppNavigator';

type RouteT = RouteProp<ReservasStackParams, 'Pago'>;
type Nav = StackNavigationProp<ReservasStackParams, 'Pago'>;

const IVA_RATE = 0.15;

const METODOS = [
  { key: 'TARJETA_CREDITO', label: 'Tarjeta de crédito',  icon: 'card-outline',             esTarjeta: true  },
  { key: 'TARJETA_DEBITO',  label: 'Tarjeta de débito',   icon: 'wallet-outline',            esTarjeta: true  },
  { key: 'TRANSFERENCIA',   label: 'Transferencia',        icon: 'swap-horizontal-outline',   esTarjeta: false },
  { key: 'EFECTIVO',        label: 'Efectivo en agencia',  icon: 'cash-outline',              esTarjeta: false },
] as const;

type MetodoKey = typeof METODOS[number]['key'];

function formatCardNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function isExpiryValid(expiry: string): boolean {
  const [mm, yy] = expiry.split('/');
  if (!mm || !yy || yy.length < 2) return false;
  const month = parseInt(mm, 10);
  const year  = parseInt('20' + yy, 10);
  if (month < 1 || month > 12) return false;
  return new Date(year, month) > new Date();
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, secureTextEntry, maxLength, editable = true,
}: {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  maxLength?: number;
  editable?: boolean;
}) {
  return (
    <View style={fStyles.wrap}>
      <Text style={fStyles.label}>{label}</Text>
      <TextInput
        style={[fStyles.input, !editable && fStyles.inputReadonly]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSoft}
        keyboardType={keyboardType ?? 'default'}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        editable={editable}
        autoCapitalize="none"
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrap:  { marginBottom: 12 },
  label: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, fontWeight: '600' },
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
  inputReadonly: { backgroundColor: COLORS.border + '40', color: COLORS.textSecondary },
});

export default function PaymentScreen() {
  const route      = useRoute<RouteT>();
  const navigation = useNavigation<Nav>();
  const { user }   = useAuth();

  const { reservaId, totalAmount, codigoReserva, diasTotal, vehiculoNombre } = route.params;

  const subtotal   = totalAmount;
  const iva        = subtotal * IVA_RATE;
  const montoTotal = +(subtotal + iva).toFixed(2);

  // Payment method
  const [metodo, setMetodo] = useState<MetodoKey>('TARJETA_CREDITO');
  const selectedMetodo = METODOS.find(m => m.key === metodo)!;

  // Card fields
  const [cardNumber,  setCardNumber]  = useState('');
  const [cardHolder,  setCardHolder]  = useState('');
  const [cardExpiry,  setCardExpiry]  = useState('');
  const [cardCVV,     setCardCVV]     = useState('');

  // Billing toggle
  const [customBilling, setCustomBilling] = useState(false);
  const [rucCliente,    setRucCliente]    = useState('');
  const [razonSocial,   setRazonSocial]   = useState('');

  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (selectedMetodo.esTarjeta) {
      const raw = cardNumber.replace(/\s/g, '');
      if (raw.length !== 16)        return 'El número de tarjeta debe tener 16 dígitos.';
      if (!cardHolder.trim())       return 'Ingresa el nombre del titular de la tarjeta.';
      if (!isExpiryValid(cardExpiry)) return 'Ingresa una fecha de vencimiento válida (MM/YY).';
      if (cardCVV.length < 3)       return 'El CVV debe tener 3 o 4 dígitos.';
    }
    if (customBilling) {
      if (!rucCliente.trim())  return 'Ingresa tu RUC o cédula.';
      if (!razonSocial.trim()) return 'Ingresa la razón social o nombre completo.';
    }
    return null;
  };

  const getReferencia = (): string => {
    if (selectedMetodo.esTarjeta) {
      const last4 = cardNumber.replace(/\s/g, '').slice(-4);
      return `${metodo} ****${last4}`;
    }
    return selectedMetodo.label;
  };

  const handlePagar = () => {
    const err = validate();
    if (err) { Alert.alert('Datos incompletos', err); return; }

    Alert.alert(
      'Confirmar pago',
      `¿Confirmas el pago de $${montoTotal.toFixed(2)} (IVA incluido)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pagar ahora',
          onPress: async () => {
            setLoading(true);
            try {
              await pagarReserva({
                reservaId,
                monto:      montoTotal,
                metodoPago: metodo,
                referencia: getReferencia(),
              });
              Alert.alert(
                '¡Pago exitoso!',
                'Tu reserva ha sido confirmada. Puedes verla en "Mis reservas".',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (e: any) {
              Alert.alert('Error en el pago', e.message ?? 'No se pudo procesar el pago.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Summary card ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="receipt-outline" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.summaryVehiculo}>{vehiculoNombre}</Text>
          <Text style={styles.summaryCodigo}>{codigoReserva}</Text>
          <Text style={styles.summaryDias}>{diasTotal} {diasTotal === 1 ? 'día' : 'días'}</Text>
          <Text style={styles.summaryAmount}>${montoTotal.toFixed(2)}</Text>
          <Text style={styles.summaryAmountLabel}>Total a pagar (IVA incluido)</Text>
        </View>

        {/* ── Método de pago ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Método de pago</Text>
          {METODOS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.metodoRow, metodo === m.key && styles.metodoRowActive]}
              onPress={() => setMetodo(m.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.metodoIcon, metodo === m.key && styles.metodoIconActive]}>
                <Ionicons name={m.icon as any} size={18} color={metodo === m.key ? '#fff' : COLORS.primary} />
              </View>
              <Text style={[styles.metodoLabel, metodo === m.key && styles.metodoLabelActive]}>
                {m.label}
              </Text>
              {metodo === m.key && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Datos de tarjeta ── */}
        {selectedMetodo.esTarjeta && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datos de la tarjeta</Text>

            <Field
              label="NÚMERO DE TARJETA"
              value={cardNumber}
              onChangeText={(t) => setCardNumber(formatCardNumber(t))}
              placeholder="1234 5678 9012 3456"
              keyboardType="numeric"
              maxLength={19}
            />
            <Field
              label="TITULAR (como aparece en la tarjeta)"
              value={cardHolder}
              onChangeText={(t) => setCardHolder(t.toUpperCase())}
              placeholder="NOMBRE APELLIDO"
            />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Field
                  label="VENCE"
                  value={cardExpiry}
                  onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                  placeholder="MM/YY"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="CVV"
                  value={cardCVV}
                  onChangeText={(t) => setCardCVV(t.replace(/\D/g, '').slice(0, 4))}
                  placeholder="•••"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>
          </View>
        )}

        {/* ── Datos de facturación ── */}
        <View style={styles.card}>
          <View style={styles.billingHeader}>
            <Text style={styles.cardTitle}>Datos de facturación</Text>
            <TouchableOpacity onPress={() => setCustomBilling(!customBilling)}>
              <Text style={styles.billingToggle}>
                {customBilling ? 'Usar perfil' : 'Personalizar'}
              </Text>
            </TouchableOpacity>
          </View>

          {customBilling ? (
            <>
              <Field
                label="RUC / CÉDULA"
                value={rucCliente}
                onChangeText={setRucCliente}
                placeholder="1712345678"
                keyboardType="numeric"
                maxLength={13}
              />
              <Field
                label="RAZÓN SOCIAL / NOMBRE COMPLETO"
                value={razonSocial}
                onChangeText={setRazonSocial}
                placeholder="Nombre o empresa"
              />
            </>
          ) : (
            <View style={styles.profileInfo}>
              <View style={styles.profileRow}>
                <Ionicons name="person-outline" size={16} color={COLORS.primary} />
                <Text style={styles.profileText}>
                  {user?.nombres} {user?.apellidos}
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Ionicons name="mail-outline" size={16} color={COLORS.primary} />
                <Text style={styles.profileText}>{user?.email}</Text>
              </View>
              {user?.cedula ? (
                <View style={styles.profileRow}>
                  <Ionicons name="id-card-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.profileText}>{user.cedula}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* ── Desglose ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Desglose</Text>
          <View style={styles.desglose}>
            <Text style={styles.desgloseLabel}>Subtotal ({diasTotal} días)</Text>
            <Text style={styles.desgloseVal}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.desglose}>
            <Text style={styles.desgloseLabel}>IVA (15%)</Text>
            <Text style={styles.desgloseVal}>${iva.toFixed(2)}</Text>
          </View>
          <View style={[styles.desglose, styles.desgloseTotal]}>
            <Text style={styles.desgloseTotalLabel}>Total</Text>
            <Text style={styles.desgloseTotalVal}>${montoTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Botón pagar ── */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handlePagar}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="lock-closed-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>Pagar ${montoTotal.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Tu pago está protegido. Al confirmar aceptas los términos del servicio de UrbanCar.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: 16, paddingBottom: 40 },

  summaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryVehiculo:    { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 4 },
  summaryCodigo:      { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace', marginBottom: 2 },
  summaryDias:        { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 14 },
  summaryAmount:      { fontSize: 38, fontWeight: '800', color: '#fff' },
  summaryAmountLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 14 },

  metodoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  metodoRowActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  metodoIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metodoIconActive: { backgroundColor: COLORS.primary },
  metodoLabel:      { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  metodoLabelActive:{ fontWeight: '700', color: COLORS.primary },

  row: { flexDirection: 'row' },

  billingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  billingToggle: { fontSize: 13, fontWeight: '600', color: COLORS.accent },

  profileInfo: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileText: { fontSize: 14, color: COLORS.text },

  desglose:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  desgloseLabel: { fontSize: 14, color: COLORS.textSecondary },
  desgloseVal:   { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  desgloseTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 0,
  },
  desgloseTotalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  desgloseTotalVal:   { fontSize: 17, fontWeight: '800', color: COLORS.primary },

  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontSize: 17, fontWeight: '700' },

  disclaimer: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18 },
});
