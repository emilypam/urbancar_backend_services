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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { changePassword, updateProfile } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config';

function EditField({
  label, value, onChangeText, placeholder, keyboardType, secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={ef.wrap}>
      <Text style={ef.label}>{label}</Text>
      <TextInput
        style={ef.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSoft}
        keyboardType={keyboardType ?? 'default'}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  );
}

const ef = StyleSheet.create({
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
});

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();

  // edit mode
  const [editing, setEditing]     = useState(false);
  const [nombres, setNombres]     = useState(user?.nombres ?? '');
  const [apellidos, setApellidos] = useState(user?.apellidos ?? '');
  const [telefono, setTelefono]   = useState(user?.telefono ?? '');
  const [saving, setSaving]       = useState(false);

  // change password
  const [showPwd, setShowPwd]         = useState(false);
  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [savingPwd, setSavingPwd]     = useState(false);

  if (!user) return null;

  const initials = `${user.nombres[0] ?? ''}${user.apellidos[0] ?? ''}`.toUpperCase();

  const handleSaveProfile = async () => {
    if (!nombres.trim() || !apellidos.trim()) {
      Alert.alert('Campos requeridos', 'Nombres y apellidos son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({
        nombres:   nombres.trim(),
        apellidos: apellidos.trim(),
        telefono:  telefono.trim() || undefined,
      });
      setUser({ ...user, ...updated });
      setEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Listo!', 'Tu perfil fue actualizado correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNombres(user.nombres);
    setApellidos(user.apellidos);
    setTelefono(user.telefono ?? '');
    setEditing(false);
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Campos requeridos', 'Completa todos los campos de contraseña.');
      return;
    }
    if (newPwd.length < 8) {
      Alert.alert('Contraseña insegura', 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('No coinciden', 'La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    setSavingPwd(true);
    try {
      await changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setShowPwd(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('¡Listo!', 'Tu contraseña fue actualizada correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo cambiar la contraseña.');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); logout(); } },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user.nombres} {user.apellidos}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}
            </Text>
          </View>
        </View>

        {/* ── Información personal ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Información personal</Text>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {editing ? (
            <>
              <EditField
                label="NOMBRES"
                value={nombres}
                onChangeText={setNombres}
                placeholder="Tus nombres"
              />
              <EditField
                label="APELLIDOS"
                value={apellidos}
                onChangeText={setApellidos}
                placeholder="Tus apellidos"
              />
              <EditField
                label="TELÉFONO (opcional)"
                value={telefono}
                onChangeText={setTelefono}
                placeholder="+593 99 999 9999"
                keyboardType="phone-pad"
              />

              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveBtnText}>Guardar</Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <InfoRow icon="person-outline" label="Nombres" value={`${user.nombres} ${user.apellidos}`} />
              <InfoRow icon="mail-outline"   label="Correo"   value={user.email} />
              {user.telefono ? <InfoRow icon="call-outline" label="Teléfono" value={user.telefono} /> : null}
              {user.cedula   ? <InfoRow icon="id-card-outline" label="Cédula" value={user.cedula} /> : null}
            </>
          )}
        </View>

        {/* ── Seguridad ── */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.sectionToggle}
            onPress={() => setShowPwd(!showPwd)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionToggleLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Cambiar contraseña</Text>
            </View>
            <Ionicons
              name={showPwd ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {showPwd && (
            <View style={{ marginTop: 4 }}>
              <EditField
                label="CONTRASEÑA ACTUAL"
                value={currentPwd}
                onChangeText={setCurrentPwd}
                placeholder="••••••••"
                secureTextEntry
              />
              <EditField
                label="NUEVA CONTRASEÑA"
                value={newPwd}
                onChangeText={setNewPwd}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
              />
              <EditField
                label="CONFIRMAR NUEVA CONTRASEÑA"
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                placeholder="Repite la contraseña"
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.saveBtn, { alignSelf: 'flex-end' }]}
                onPress={handleChangePassword}
                disabled={savingPwd}
              >
                {savingPwd
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Actualizar contraseña</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Cerrar sesión ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>UrbanCar Mobile v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon as any} size={17} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: 16, paddingBottom: 40, gap: 14 },

  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  name:       { fontSize: 20, fontWeight: '700', color: COLORS.text },
  roleBadge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 20,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.text },

  editBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 11, color: COLORS.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  saveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  sectionToggle:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.error + '12',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.error },
  version:    { textAlign: 'center', fontSize: 12, color: COLORS.border, marginTop: 8 },
});
