export const typeDefs = `#graphql

  type Vehiculo {
    id: ID!
    marca: String
    modelo: String
    anio: Int
    placa: String
    color: String
    categoria: String
    precioPorDia: Float
    disponible: Boolean
    imageUrl: String
    agenciaId: String
  }

  type Reserva {
    id: ID!
    vehiculoId: ID!
    usuarioId: ID!
    fechaInicio: String!
    fechaFin: String!
    estado: String!
    total: Float
    createdAt: String
  }

  type Pago {
    id: ID!
    reservaId: ID!
    monto: Float!
    metodoPago: String
    estado: String!
    createdAt: String
  }

  type Factura {
    id: ID!
    reservaId: ID!
    monto: Float!
    fechaEmision: String
    estado: String
  }

  type Mantenimiento {
    id: ID!
    vehiculoId: ID!
    tipo: String
    descripcion: String
    fechaInicio: String
    fechaFin: String
    estado: String
  }

  type Kardex {
    id: ID!
    vehiculoId: ID!
    tipo: String
    descripcion: String
    usuarioId: String
    createdAt: String
  }

  type Usuario {
    id: ID!
    nombre: String
    email: String!
    rol: String
  }

  type EventoBus {
    eventId: ID!
    eventType: String!
    eventVersion: String!
    timestamp: String!
    correlationId: String!
    source: String!
    data: String
  }

  input CrearReservaInput {
    vehiculoId: ID!
    fechaInicio: String!
    fechaFin: String!
    agenciaRecogidaId: String
    agenciaDevolucionId: String
  }

  input CrearPagoInput {
    reservaId: ID!
    monto: Float!
    metodoPago: String!
  }

  type Query {
    # Inventario
    vehiculos(disponible: Boolean, categoriaId: String): [Vehiculo!]!
    vehiculo(id: ID!): Vehiculo

    # Operaciones
    reservas: [Reserva!]!
    reserva(id: ID!): Reserva
    misReservas(usuarioId: ID!): [Reserva!]!

    # Financiero
    pagos: [Pago!]!
    pago(id: ID!): Pago
    facturas: [Factura!]!
    factura(id: ID!): Factura

    # Mantenimiento
    mantenimientos: [Mantenimiento!]!
    mantenimiento(id: ID!): Mantenimiento
    kardex(vehiculoId: ID): [Kardex!]!

    # Event Bus
    eventos(page: Int, limit: Int): [EventoBus!]!
  }

  type Mutation {
    # Reservas (v2 — pasa por event bus)
    crearReserva(input: CrearReservaInput!, token: String!): Reserva!
    cancelarReserva(id: ID!, token: String!): Reserva!

    # Pagos
    crearPago(input: CrearPagoInput!, token: String!): Pago!
  }
`;
