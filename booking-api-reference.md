# UrbanCar EC — Booking Integration API Reference

## Base URL (Producción)

Todos los endpoints se acceden a través del API Gateway (nginx-frontend):

```
https://nginx-frontend.ambitioushill-8cbf622c.eastus2.azurecontainerapps.io
```

Los servicios de backend son internos (no tienen acceso público directo). Todos los endpoints tienen el prefijo `/api/v1/emilypamela` y las rutas de integración llevan adicionalmente `/booking`.

Ejemplo completo:
```
GET https://nginx-frontend.ambitioushill-8cbf622c.eastus2.azurecontainerapps.io/api/v1/emilypamela/vehiculos/booking
```

---

## Vehículos

### Listar vehículos

```
GET /api/v1/emilypamela/vehiculos/booking
```

**Query parameters:**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `agenciaId` | string | — | Filtra por agencia |
| `categoriaId` | string | — | Filtra por categoría |
| `status` | string | `DISPONIBLE` | `DISPONIBLE`, `EN_USO`, `MANTENIMIENTO` |
| `page` | number | `1` | Número de página |
| `limit` | number | `20` | Resultados por página |

**Respuesta `200 OK`:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "c8a67ebc-06dd-4fc7-8902-86f9848e03af",
        "nombre": "Chevrolet Sail 2023",
        "descripcion": "Auto ideal para ciudad, muy económico en consumo.",
        "precioPorDia": 25.5,
        "moneda": "USD",
        "categoria": "Económico",
        "agenciaId": "uuid",
        "disponible": true,
        "status": "DISPONIBLE",
        "imagenUrl": "https://storage.googleapis.com/bucket/vehiculos/chevrolet-sail.png"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

> **Nota:** La respuesta envuelve el array en `data.data`. El campo de precio es `precioPorDia` (no `precioDia`).

---

### Obtener vehículo por ID

```
GET /api/v1/emilypamela/vehiculos/booking/:id
```

**Respuesta `200 OK`:** Objeto vehículo (misma estructura que el listado).

**Respuesta `404 Not Found`:**
```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Vehiculo {id} no encontrado" }
}
```

---

### Verificar disponibilidad

```
GET /api/v1/emilypamela/vehiculos/booking/:id/disponibilidad
```

> **Nota:** La disponibilidad se basa en el estado actual del vehículo. La validación por rango de fechas (`fechaInicio`/`fechaFin`) no está implementada en esta versión.

**Respuesta `200 OK`:**
```json
{
  "success": true,
  "data": {
    "vehiculoId": "uuid",
    "disponible": true,
    "status": "DISPONIBLE",
    "mensaje": "El vehículo está disponible para alquiler"
  }
}
```

---

## Reservas

### Crear reserva

```
POST /api/v1/emilypamela/reservas/booking
Content-Type: application/json
```

**Body:**
```json
{
  "vehiculoId":  "uuid",
  "clienteId":   "uuid",
  "agenciaId":   "uuid",
  "fechaInicio": "2026-06-01T10:00:00Z",
  "fechaFin":    "2026-06-05T10:00:00Z"
}
```

> `agenciaId` es opcional si el vehículo ya tiene agencia asignada.

**Respuesta `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "codigoReserva": "RES-ABC123-XYZ",
    "vehiculoId": "uuid",
    "clienteId": "uuid",
    "agenciaId": "uuid",
    "fechaInicio": "2026-06-01T10:00:00Z",
    "fechaFin": "2026-06-05T10:00:00Z",
    "diasTotal": 4,
    "totalAmount": 180.00,
    "status": "PENDIENTE"
  }
}
```

**Errores:**
| Código | Descripción |
|---|---|
| `400` | Campos requeridos faltantes (`vehiculoId`, `clienteId`, `fechaInicio`, `fechaFin`) |
| `404` | Vehículo no encontrado |
| `422` | Vehículo no disponible |

---

### Obtener reserva por ID

```
GET /api/v1/emilypamela/reservas/booking/:id
```

**Respuesta `200 OK`:** Objeto reserva (misma estructura que la respuesta de creación).

---

### Actualizar estado de reserva

```
PATCH /api/v1/emilypamela/reservas/booking/:id
Content-Type: application/json
```

**Body:**
```json
{ "status": "CONFIRMADA" }
```

**Valores válidos para `status`:**

| Valor | Descripción |
|---|---|
| `PENDIENTE` | Reserva creada, pendiente de confirmación |
| `CONFIRMADA` | Reserva confirmada, lista para iniciar alquiler |
| `ACTIVA` | Alquiler en curso |
| `COMPLETADA` | Alquiler finalizado y devuelto |
| `CANCELADA` | Reserva cancelada |

> **Nota:** El campo se llama `status` (no `estado`).

**Respuesta `200 OK`:** Objeto reserva actualizado.

---

## Alquileres

### Iniciar alquiler

```
POST /api/v1/emilypamela/alquileres/booking
Content-Type: application/json
```

Requiere que la reserva esté en estado `CONFIRMADA`. Al crear el alquiler el vehículo pasa a estado `EN_USO`.

**Body:**
```json
{
  "reservaId":    "uuid",
  "kmSalida":     15230,
  "fechaInicio":  "2026-06-01T10:00:00Z",
  "observaciones": "Sin novedades al momento de salida"
}
```

> `fechaInicio` y `observaciones` son opcionales. Si se omite `fechaInicio` se usa la fecha/hora actual.

**Respuesta `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reservaId": "uuid",
    "kmSalida": 15230,
    "fechaInicio": "2026-06-01T10:00:00Z",
    "status": "ACTIVO"
  }
}
```

**Errores:**
| Código | Descripción |
|---|---|
| `400` | `reservaId` faltante |
| `404` | Reserva no encontrada |
| `409` | Ya existe un alquiler para esta reserva |
| `422` | La reserva no está en estado `CONFIRMADA` |

---

## Devoluciones

### Registrar devolución

```
POST /api/v1/emilypamela/devoluciones/booking
Content-Type: application/json
```

Cierra el alquiler, marca la reserva como `COMPLETADA` y libera el vehículo a estado `DISPONIBLE`.

**Body:**
```json
{
  "alquilerId":     "uuid",
  "kmEntrada":      15890,
  "estadoVehiculo": "BUENO",
  "cargoExtra":     25.00,
  "observaciones":  "Rayón leve en puerta trasera derecha"
}
```

> `estadoVehiculo`, `cargoExtra` (default `0`) y `observaciones` son opcionales.

**Respuesta `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "alquilerId": "uuid",
    "kmEntrada": 15890,
    "estadoVehiculo": "BUENO",
    "cargoExtra": 25.00,
    "observaciones": "Rayón leve en puerta trasera derecha"
  }
}
```

**Errores:**
| Código | Descripción |
|---|---|
| `400` | `alquilerId` faltante |
| `404` | Alquiler no encontrado |
| `409` | Este alquiler ya tiene una devolución registrada |
| `422` | El alquiler no está en estado `ACTIVO` |

---

## Flujo completo de integración

```
1. GET  /vehiculos/booking                     → Buscar vehículo disponible
2. GET  /vehiculos/booking/:id/disponibilidad  → Confirmar que está disponible
3. POST /reservas/booking                      → Crear reserva  (status: PENDIENTE)
4. PATCH /reservas/booking/:id                 → { "status": "CONFIRMADA" }
5. POST /alquileres/booking                    → Iniciar alquiler (vehículo → EN_USO)
6. POST /devoluciones/booking                  → Registrar devolución (vehículo → DISPONIBLE)
```

---

## Formato de errores

Todos los errores siguen la misma estructura:

```json
{
  "success": false,
  "error": {
    "code": "CODIGO_ERROR",
    "message": "Descripción legible del error"
  }
}
```

---

## Notas importantes

1. **Disponibilidad por fechas:** El endpoint `GET /vehiculos/booking/:id/disponibilidad` verifica el estado actual del vehículo. La validación por rango de fechas no está implementada en esta versión.
2. **Campo `status` en PATCH:** El campo para actualizar el estado de una reserva es `status`, no `estado`.
3. **`clienteId`:** Debe corresponder a un ID de usuario registrado en el sistema UrbanCar.
4. **Fechas:** Todas las fechas deben enviarse en formato ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`).
