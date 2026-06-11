import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../config';

import MarketplaceScreen from '../screens/MarketplaceScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MyReservationsScreen from '../screens/MyReservationsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ProfileScreen from '../screens/ProfileScreen';

// ── Stack param types ─────────────────────────────────────────────────────────

export type MarketplaceStackParams = {
  Marketplace: undefined;
  VehicleDetail: { vehiculoId: string };
};

export type ReservasStackParams = {
  MisReservas: undefined;
  Pago: {
    reservaId: string;
    totalAmount: number;
    codigoReserva: string;
    diasTotal: number;
    vehiculoNombre: string;
  };
};

export type AuthStackParams = {
  Login: undefined;
  Register: undefined;
};

// ── Stacks ────────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();
const MarketStack = createStackNavigator<MarketplaceStackParams>();
const ReservasStack = createStackNavigator<ReservasStackParams>();
const AuthStack = createStackNavigator<AuthStackParams>();

const headerOpts = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: '#fff' as const,
  headerTitleStyle: { fontWeight: 'bold' as const },
};

function MarketplaceStackNav() {
  return (
    <MarketStack.Navigator screenOptions={headerOpts}>
      <MarketStack.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: 'UrbanCar' }} />
      <MarketStack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Detalle del vehículo' }} />
    </MarketStack.Navigator>
  );
}

function ReservasStackNav() {
  return (
    <ReservasStack.Navigator screenOptions={headerOpts}>
      <ReservasStack.Screen name="MisReservas" component={MyReservationsScreen} options={{ title: 'Mis reservas' }} />
      <ReservasStack.Screen name="Pago" component={PaymentScreen} options={{ title: 'Realizar pago' }} />
    </ReservasStack.Navigator>
  );
}

function AuthStackNav() {
  return (
    <AuthStack.Navigator screenOptions={headerOpts}>
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar sesión' }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
    </AuthStack.Navigator>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, [string, string]> = {
              MarketplaceTab: ['car', 'car-outline'],
              ReservasTab:    ['calendar', 'calendar-outline'],
              PerfilTab:      ['person', 'person-outline'],
              AuthTab:        ['log-in', 'log-in-outline'],
            };
            const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
            return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="MarketplaceTab" component={MarketplaceStackNav} options={{ title: 'Vehículos' }} />

        {user ? (
          <>
            <Tab.Screen name="ReservasTab" component={ReservasStackNav} options={{ title: 'Mis reservas' }} />
            <Tab.Screen
              name="PerfilTab"
              component={ProfileScreen}
              options={{
                title: 'Perfil',
                headerShown: true,
                ...headerOpts,
              }}
            />
          </>
        ) : (
          <Tab.Screen name="AuthTab" component={AuthStackNav} options={{ title: 'Ingresar' }} />
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
