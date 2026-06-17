# UrbanCar — Guía de Implementación: RabbitMQ + WebSocket + v2 + Booking

> Documento para replicar todos los cambios del sistema en otra instancia idéntica.
> Cada sección incluye el **prompt exacto** para darle a Claude.

---

## Antes de empezar — reemplaza estos valores en cada prompt

| Placeholder | Qué es | Ejemplo |
|---|---|---|
| `[TU_USUARIO]` | Tu prefijo de rutas (el mismo que ya tienes en v1) | `emilypamela` |
| `[IP_VM]` | IP pública de tu VM de Azure | `23.102.101.247` |
| `[RUTA_SSH_KEY]` | Ruta a tu llave `.pem` de la VM | `~/.ssh/urbancar-vm_key.pem` |

---

## Entender la arquitectura antes de implementar

### Qué problema resuelve todo esto

Sin estos cambios, cuando alguien creaba una reserva (desde la web, la app o el sistema de booking externo), el marketplace de los demás usuarios no se actualizaba — tenían que recargar la página o esperar 60 segundos (polling). Con estos cambios todo se sincroniza en tiempo real automáticamente.

### Cómo fluye un evento de punta a punta

```
Cualquier origen crea/modifica una reserva
         │
         ▼
operaciones-service guarda en BD
         │
         ▼  (solo en v2)
publica evento en RabbitMQ  ──────────────────────────────────────────┐
exchange: urbancar.events                                              │
routing key: reservas.reserva.confirmada                              │
         │                                                            │
         ▼                                                            │
bus-service recibe el evento (consumer)                               │
         │                                                            │
         ▼                                                            │
broadcast WebSocket a TODOS los clientes conectados                   │
evento: reserva:confirmada                                            │
         │                                                            │
    ┌────┴────┐                                                        │
    ▼         ▼                                                        │
Angular    App Móvil                                                   │
Marketplace  Marketplace                                               │
(silentFetch) (loadData)                                              │
se refresca   se refresca                                             │
automático    automático                                               │
                                                                      │
Los tres orígenes que publican el evento: ◄───────────────────────────┘
  1. App web Angular (crea reserva vía GraphQL → v2)
  2. App móvil React Native (crea reserva vía GraphQL → v2)
  3. Sistema de booking externo (usa /reservas/booking v2)
```

### Los tres orígenes que usan los endpoints v2 de operaciones-service

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    operaciones-service                                  │
│                                                                         │
│  /api/v2/[usuario]/reservas          ← usa la app web y app móvil      │
│  (vía GraphQL Gateway)                 para crearReserva/cancelarReserva│
│                                                                         │
│  /api/v2/[usuario]/reservas/booking  ← usa el integrador booking        │
│  /api/v2/[usuario]/alquileres/booking  externo (sin token, público)     │
│  /api/v2/[usuario]/devoluciones/booking                                 │
│                                                                         │
│  TODOS publican a RabbitMQ → WebSocket → web y móvil se actualizan     │
└─────────────────────────────────────────────────────────────────────────┘
```

### ¿Qué microservicio necesitaba v2 y cuál no?

| Microservicio | ¿Necesitaba v2? | Por qué |
|---|---|---|
| **operaciones-service** | ✅ SÍ — se creó v2 | Sus endpoints de booking (v1) **no publicaban** a RabbitMQ. Las reservas creadas por el booking externo no notificaban a nadie. |
| financiero-service | ❌ No | Ya tenía `messaging/publisher.ts` y publicaba `pagos.pago.procesado` etc. por su cuenta |
| mantenimiento-service | ❌ No | Ya tenía `messaging/publisher.ts` y publicaba `mantenimiento.*` por su cuenta |
| inventario-service | ❌ No | No es productor de eventos — solo recibe PATCH de status desde operaciones |
| bus-service | ❌ No aplica | No es un CRUD, es el broker. Se le agregó WebSocket (Socket.io), no v2 |
| auth-service | ❌ No | No genera eventos de dominio que requieran tiempo real |

### ¿Qué había antes en operaciones-service y qué se creó nuevo?

```
ANTES (ya existía):
  /api/v1/[usuario]/reservas/booking    → v1 sin RabbitMQ (solo BD)
  /api/v1/[usuario]/alquileres/booking  → v1 sin RabbitMQ (solo BD)
  /api/v1/[usuario]/devoluciones/booking → v1 sin RabbitMQ (solo BD)
  /api/v2/[usuario]/reservas            → v2 CON RabbitMQ (para web/móvil)

CREADO NUEVO en esta implementación:
  /api/v2/[usuario]/reservas/booking    → v2 CON RabbitMQ (para booking externo)
  /api/v2/[usuario]/alquileres/booking  → v2 CON RabbitMQ (para booking externo)
  /api/v2/[usuario]/devoluciones/booking → v2 CON RabbitMQ (para booking externo)

Los v1 se mantienen intactos — no se tocaron.
```

---

## Resumen de todos los cambios por componente

```
bus-service
  → src/shared/ws/socket-server.ts       NUEVO  — servidor Socket.io WebSocket
  → src/shared/bus/rabbitmq-consumer.ts  NUEVO  — escucha RabbitMQ y hace broadcast
  → src/shared/bus/rabbitmq.ts           MODIF  — agrega función onRabbitMQConnect
  → src/server.ts                        MODIF  — usa http.createServer + Socket.io
  → src/app.ts                           MODIF  — arranca el consumer cuando conecta RabbitMQ
  → package.json                         MODIF  — agrega dependencia socket.io

nginx
  → nginx.conf                           MODIF  — proxy WebSocket /socket.io/ + rutas v2

Angular frontend (UrbanCar_Front)
  → core/interceptors/jwt.interceptor.ts MODIF  — agrega /api/v2/ al check de token
  → features/marketplace/marketplace.component.ts MODIF — escucha WebSocket, refresca silencioso

React Native mobile (UrbanCar_Mobile)
  → src/hooks/useSocket.ts               NUEVO  — hook singleton Socket.io
  → src/screens/MarketplaceScreen.tsx    MODIF  — reemplaza setInterval(60s) por useSocket

operaciones-service
  → src/modules/booking-integration/booking.v2.routes.ts  NUEVO — booking v2 con RabbitMQ
  → src/app.ts                           MODIF  — registra las rutas booking v2

graphql-gateway
  → src/resolvers/index.ts               MODIF  — funciones de mapeo + mutaciones apuntan a v2
```

---

## PASO 1 — bus-service: agregar Socket.io y consumer de RabbitMQ

### Qué hace
El bus-service es el corazón del tiempo real. Escucha **todos** los eventos de RabbitMQ
con un wildcard `#` (todos los routing keys) y los retransmite por WebSocket a todos
los clientes conectados (web Angular y app móvil).

### Archivos que cambian
- `services/bus-service/package.json` → agrega `socket.io`
- `services/bus-service/src/server.ts` → usa `http.createServer` + `initSocketServer`
- `services/bus-service/src/shared/bus/rabbitmq.ts` → agrega `onRabbitMQConnect`
- `services/bus-service/src/shared/bus/rabbitmq-consumer.ts` → **archivo nuevo**
- `services/bus-service/src/shared/ws/socket-server.ts` → **archivo nuevo**
- `services/bus-service/src/app.ts` → importa `onRabbitMQConnect` y `startConsumer`

### Prompt para Claude

```
Necesito agregar Socket.io WebSocket al bus-service de mi proyecto UrbanCar para
transmitir eventos de RabbitMQ en tiempo real a los clientes web y móvil.

Mi VM está en [IP_VM], SSH key en [RUTA_SSH_KEY], usuario azureuser.
El proyecto está en /home/azureuser/urbancar/services/bus-service/

Primero lee estos archivos del VM:
  ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] "cat /home/azureuser/urbancar/services/bus-service/src/server.ts"
  ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] "cat /home/azureuser/urbancar/services/bus-service/src/app.ts"
  ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] "cat /home/azureuser/urbancar/services/bus-service/src/shared/bus/rabbitmq.ts"
  ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] "cat /home/azureuser/urbancar/services/bus-service/package.json"

Luego aplica estos cambios:

1. En package.json agrega "socket.io": "^4.8.1" en dependencies.

2. Crea el archivo src/shared/ws/socket-server.ts:
---
import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN ?? '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });
  io.on('connection', (socket) => {
    console.log(`[ws] cliente conectado: ${socket.id} (total: ${io!.engine.clientsCount})`);
    socket.on('disconnect', () => console.log(`[ws] cliente desconectado: ${socket.id}`));
  });
  return io;
}

export function broadcast(event: string, data: unknown): void {
  if (io) io.emit(event, data);
}
---

3. Crea el archivo src/shared/bus/rabbitmq-consumer.ts:
---
import { getChannel, EXCHANGE } from './rabbitmq.js';
import { broadcast } from '../ws/socket-server.js';

const ROUTING_TO_WS: Record<string, string> = {
  'reservas.reserva.creada':                 'reserva:creada',
  'reservas.reserva.confirmada':             'reserva:confirmada',
  'reservas.reserva.cancelada':              'reserva:cancelada',
  'reservas.reserva.completada':             'reserva:completada',
  'pagos.pago.procesado':                    'pago:procesado',
  'pagos.pago.fallido':                      'pago:fallido',
  'facturas.factura.generada':               'factura:generada',
  'alquileres.alquiler.iniciado':            'alquiler:iniciado',
  'alquileres.devolucion.registrada':        'devolucion:registrada',
  'mantenimiento.vehiculo.en_mantenimiento': 'vehiculo:actualizado',
  'mantenimiento.vehiculo.disponible':       'vehiculo:actualizado',
  'mantenimiento.kardex.registrado':         'kardex:registrado',
};

export async function startConsumer(): Promise<void> {
  const ch = getChannel();
  if (!ch) {
    console.warn('[consumer] canal RabbitMQ no disponible — reintentando en 5s');
    setTimeout(startConsumer, 5000);
    return;
  }
  try {
    const { queue } = await ch.assertQueue('', { exclusive: true, autoDelete: true });
    await ch.bindQueue(queue, EXCHANGE, '#');
    console.log('[consumer] suscrito a exchange', EXCHANGE);
    ch.consume(queue, (msg) => {
      if (!msg) return;
      ch.ack(msg);
      try {
        const event = JSON.parse(msg.content.toString());
        const wsEvt = ROUTING_TO_WS[event.eventType] ?? event.eventType;
        broadcast(wsEvt, event);
      } catch (err) {
        console.error('[consumer] error parseando mensaje:', err);
      }
    });
  } catch (err) {
    console.error('[consumer] error iniciando consumer:', err);
    setTimeout(startConsumer, 5000);
  }
}
---

4. En rabbitmq.ts, si no existe la función onRabbitMQConnect, agrégala:
   - Después de: let channel: amqp.Channel | null = null;
     agrega: const connectHooks: Array<() => void> = [];
   - Agrega la función:
       export function onRabbitMQConnect(fn: () => void): void {
         connectHooks.push(fn);
       }
   - Dentro de connectRabbitMQ, después de que channel y connected se asignan, agrega:
       connectHooks.forEach((fn) => fn());

5. Reemplaza server.ts con:
---
import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { initSocketServer } from './shared/ws/socket-server.js';

const PORT = Number(process.env.PORT ?? 3007);
const httpServer = createServer(app);
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[bus-service] corriendo en http://localhost:${PORT}`);
  console.log(`[bus-service] WebSocket: ws://localhost:${PORT}`);
});
---

6. En app.ts agrega al inicio:
     import { onRabbitMQConnect } from './shared/bus/rabbitmq.js';
     import { startConsumer } from './shared/bus/rabbitmq-consumer.js';
   Y antes de la llamada a connectRabbitMQ agrega:
     onRabbitMQConnect(() => startConsumer());

Sube los archivos con scp y reconstruye:
  docker compose build --no-cache bus-service && docker compose up -d bus-service

Verifica en los logs:
  docker logs urbancar-bus-service-1 --tail 20
Debes ver: [consumer] suscrito a exchange urbancar.events
```

---

## PASO 2 — nginx: proxy WebSocket + rutas v2

### Qué hace
nginx necesita dos cosas:
1. Reenviar las conexiones WebSocket de Socket.io al bus-service (sin esto los clientes no pueden conectar)
2. Exponer las rutas `/api/v2/` para que operaciones-service, financiero y mantenimiento sean accesibles

### Archivos que cambian
- `nginx/nginx.conf`

### Prompt para Claude

```
Necesito actualizar el nginx.conf de mi proyecto UrbanCar para:
1. Agregar proxy WebSocket hacia el bus-service en /socket.io/
2. Agregar rutas /api/v2/ para los servicios

Mi VM está en [IP_VM], SSH key en [RUTA_SSH_KEY].

Lee el archivo actual:
  ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] "cat /home/azureuser/urbancar/nginx/nginx.conf"

CAMBIO 1 — Agrega el bloque WebSocket dentro del bloque server {}, antes del cierre }:

    # WebSocket — Socket.io → bus-service
    location /socket.io/ {
        proxy_pass http://bus_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

CAMBIO 2 — Agrega los bloques v2 (reemplaza [TU_USUARIO] con tu prefijo):

    location /api/v2/reservas {
        rewrite ^/api/v2/reservas(.*)$ /api/v2/[TU_USUARIO]/reservas$1 break;
        proxy_pass http://operaciones_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v2/pagos {
        rewrite ^/api/v2/pagos(.*)$ /api/v2/[TU_USUARIO]/pagos$1 break;
        proxy_pass http://financiero_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v2/mantenimientos {
        rewrite ^/api/v2/mantenimientos(.*)$ /api/v2/[TU_USUARIO]/mantenimientos$1 break;
        proxy_pass http://mantenimiento_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v2/[TU_USUARIO]/reservas {
        proxy_pass http://operaciones_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v2/[TU_USUARIO]/alquileres {
        proxy_pass http://operaciones_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v2/[TU_USUARIO]/devoluciones {
        proxy_pass http://operaciones_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v2/[TU_USUARIO]/pagos {
        proxy_pass http://financiero_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/v2/[TU_USUARIO]/mantenimientos {
        proxy_pass http://mantenimiento_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

Reconstruye nginx:
  docker compose build --no-cache nginx && docker compose up -d nginx

Verifica WebSocket:
  curl -s "http://[IP_VM]/socket.io/?transport=polling" | head -3
Debe devolver datos de Socket.io (no un error 404).
```

---

## PASO 3 — Angular frontend: JWT interceptor + Marketplace en tiempo real

### Qué hace
- **JWT interceptor:** el token de sesión debe enviarse también en las peticiones a `/api/v2/`.
  Sin este fix, las llamadas v2 desde la web devolvían 401.
- **Marketplace:** al recibir cualquier evento de reserva vía WebSocket, el catálogo
  se refresca automáticamente sin spinner (silencioso) con un delay de 800ms.
  El delay es necesario porque inventario-service tarda unos ms en procesar el evento
  de RabbitMQ y actualizar el status del vehículo.

### Quién dispara el refresh del Marketplace
El Marketplace se refresca cuando llega **cualquiera** de estos eventos WebSocket:
- `reserva:creada` — alguien reservó un vehículo (web, móvil o booking externo)
- `reserva:confirmada` — el vehículo pasa a RESERVADO
- `reserva:cancelada` — el vehículo vuelve a DISPONIBLE
- `reserva:completada` — el alquiler terminó, vehículo vuelve a DISPONIBLE

### Archivos que cambian
- `UrbanCar_Front/src/app/core/interceptors/jwt.interceptor.ts`
- `UrbanCar_Front/src/app/features/marketplace/marketplace.component.ts`

### Prompt para Claude

```
Necesito hacer dos cambios en el frontend Angular de mi proyecto UrbanCar:
1. JWT Interceptor: que también cubra rutas /api/v2/
2. Marketplace: que se actualice automáticamente en tiempo real vía WebSocket

Lee primero estos archivos:
  src/app/core/interceptors/jwt.interceptor.ts
  src/app/core/services/socket.service.ts
  src/app/features/marketplace/marketplace.component.ts

CAMBIO 1 — jwt.interceptor.ts:
Busca la línea que define targetsApi. Actualmente solo incluye /api/v1/.
Cámbiala para que quede así:

  const targetsApi = req.url.includes('/api/v1/') || req.url.includes('/api/v2/');

CAMBIO 2 — marketplace.component.ts:
El SocketService ya existe en src/app/core/services/socket.service.ts.
Necesito inyectarlo en el MarketplaceComponent para escuchar eventos de reserva
y refrescar el catálogo automáticamente cuando cualquier sistema (web, móvil
o booking externo) modifica una reserva.

Agrega estos imports si no están:
  import { DestroyRef, inject } from '@angular/core';
  import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
  import { SocketService } from '@core/services/socket.service';

En la clase agrega estas dos inyecciones privadas:
  private readonly socket$    = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);

Al final del método ngOnInit() agrega:
  this.socket$.onAny('reserva:creada', 'reserva:confirmada', 'reserva:cancelada', 'reserva:completada')
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => setTimeout(() => this.silentFetch(), 800));

Agrega el método privado silentFetch() — refresca el catálogo sin mostrar spinner:
  private silentFetch(): void {
    const c = this.criteria();
    this.vehiculos$.marketplace({
      ciudadId:          c.ciudadId          ?? undefined,
      categoriaId:       c.categoriaId       ?? undefined,
      tipoCombustibleId: c.tipoCombustibleId ?? undefined,
      tipoTransmisionId: c.tipoTransmisionId ?? undefined,
    }).subscribe({ next: (data) => this.vehiculos.set(data) });
  }

El delay de 800ms es intencional: evita race condition donde el Marketplace
se refresca antes de que inventario-service procese el evento de RabbitMQ
y actualice el status del vehículo.
```

---

## PASO 4 — React Native mobile: reemplazar polling por WebSocket

### Qué hace
La app móvil tenía un `setInterval` cada 60 segundos para refrescar el Marketplace.
Se reemplaza por WebSocket en tiempo real — mismo comportamiento que Angular pero
en React Native. El Marketplace se actualiza automáticamente cuando cualquier sistema
(web, otra app móvil o booking externo) crea o modifica una reserva.

### Archivos que cambian
- `UrbanCar_Mobile/src/hooks/useSocket.ts` → **archivo nuevo**
- `UrbanCar_Mobile/src/screens/MarketplaceScreen.tsx`

### Prompt para Claude

```
Necesito actualizar la app React Native de UrbanCar para que el Marketplace
se actualice en tiempo real vía WebSocket en lugar de polling cada 60 segundos.

Lee primero:
  src/screens/MarketplaceScreen.tsx
  src/config.ts

PASO 1 — Crea src/hooks/useSocket.ts:
---
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_HOST } from '../config';

export type WsEvent =
  | 'reserva:creada'
  | 'reserva:confirmada'
  | 'reserva:cancelada'
  | 'reserva:completada'
  | 'pago:procesado'
  | 'pago:fallido'
  | 'vehiculo:actualizado';

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(API_HOST, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });
    sharedSocket.on('connect',       () => console.log('[socket] conectado al bus-service'));
    sharedSocket.on('disconnect',    () => console.log('[socket] desconectado'));
    sharedSocket.on('connect_error', (e: Error) => console.warn('[socket] error:', e.message));
  }
  return sharedSocket;
}

export function useSocket(
  events: WsEvent[],
  callback: (event: WsEvent) => void,
): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const socket = getSocket();
    const handlers: Array<[string, () => void]> = events.map((evt) => {
      const handler = () => cbRef.current(evt);
      socket.on(evt, handler);
      return [evt, handler];
    });
    return () => {
      handlers.forEach(([evt, handler]) => socket.off(evt, handler as any));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
---

PASO 2 — En MarketplaceScreen.tsx:
- Elimina el setInterval que llamaba a loadData (era el polling de 60 segundos)
- Elimina el clearInterval correspondiente en el return del useEffect
- Agrega: import { useSocket } from '../hooks/useSocket';
- Agrega este hook dentro del componente, después del useEffect de loadData:

  useSocket(
    ['reserva:creada', 'reserva:confirmada', 'reserva:cancelada', 'reserva:completada'],
    () => { setTimeout(loadData, 800); },
  );

El delay de 800ms evita race condition con inventario-service.

PASO 3 — Verifica dependencia:
  npm list socket.io-client
Si no está: npm install socket.io-client

PASO 4 — Publica OTA:
  eas update --branch production --message "feat: realtime WebSocket marketplace"
```

---

## PASO 5 — operaciones-service: booking v2 público con RabbitMQ

### Qué hace y quién lo usa

Este paso crea los endpoints v2 de booking. Son usados por **el integrador externo de booking** (otros sistemas que quieren crear reservas). Son **completamente públicos** (sin token).

La diferencia con el booking v1 es que v2 **publica eventos a RabbitMQ**. Esto hace que cuando el booking externo crea o modifica una reserva, la web Angular y la app móvil se actualicen en tiempo real automáticamente.

```
Booking externo usa:                    Resultado en tiempo real:
POST /api/v2/.../reservas/booking  ──►  reserva:creada  → web y móvil refrescan
PATCH /api/v2/.../reservas/booking/:id  reserva:confirmada → vehículo desaparece del marketplace
POST /api/v2/.../alquileres/booking ──► alquiler:iniciado
POST /api/v2/.../devoluciones/booking ► devolucion:registrada → vehículo reaparece en marketplace
```

**Los v1 de booking se mantienen intactos** — no se tocan, siguen funcionando igual.

### Archivos que cambian
- `services/operaciones-service/src/modules/booking-integration/booking.v2.routes.ts` → **archivo nuevo**
- `services/operaciones-service/src/app.ts` → registra las nuevas rutas

### Prompt para Claude

```
Necesito crear los endpoints de booking v2 en el operaciones-service de UrbanCar.
Son idénticos al booking v1 PERO además publican eventos a RabbitMQ para que
la web y la app móvil se sincronicen en tiempo real.
Son completamente públicos — sin middleware de autenticación.
Los endpoints v1 de booking NO se tocan.

Mi VM está en [IP_VM], SSH key en [RUTA_SSH_KEY].

Lee estos archivos del VM:
  ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] "cat /home/azureuser/urbancar/services/operaciones-service/src/modules/booking-integration/booking.routes.ts"
  ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] "cat /home/azureuser/urbancar/services/operaciones-service/src/messaging/publisher.ts"
  ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] "grep -n 'booking\|v2\|connectRabbitMQ' /home/azureuser/urbancar/services/operaciones-service/src/app.ts"

Crea booking.v2.routes.ts en el mismo directorio que booking.routes.ts.
El contenido es EXACTAMENTE igual al booking.routes.ts EXCEPTO:
- Agrega al inicio: import { publish } from '../../messaging/publisher.js';
- Los tres exports se renombran:
    createReservaBookingV2Router
    createAlquilerBookingV2Router
    createDevolucionBookingV2Router
- En POST /reservas/booking, después de crear la reserva agrega:
    publish('reservas.reserva.creada', reserva.id, {
      reservaId: reserva.id, vehiculoId: reserva.vehiculoId,
      usuarioId: reserva.usuarioId, totalAmount: Number(reserva.totalAmount), status: reserva.status,
    });
- En PATCH /reservas/booking/:id, después de actualizar agrega:
    const routingKey =
      nuevoStatus === 'CONFIRMADA' ? 'reservas.reserva.confirmada' :
      nuevoStatus === 'CANCELADA'  ? 'reservas.reserva.cancelada'  :
      nuevoStatus === 'COMPLETADA' ? 'reservas.reserva.completada' : null;
    if (routingKey) publish(routingKey, updated.id, {
      reservaId: updated.id, vehiculoId: updated.vehiculoId, status: nuevoStatus,
    });
- En POST /alquileres/booking, después de crear el alquiler agrega:
    publish('alquileres.alquiler.iniciado', alquiler.id, {
      alquilerId: alquiler.id, reservaId, vehiculoId: reserva.vehiculoId, status: 'ACTIVO',
    });
- En POST /devoluciones/booking, después de crear la devolucion agrega:
    publish('alquileres.devolucion.registrada', devolucion.id, {
      devolucionId: devolucion.id, alquilerId, vehiculoId: reservaObj?.vehiculoId, status: 'COMPLETADA',
    });

En app.ts:
  - Agrega el import:
      import { createReservaBookingV2Router, createAlquilerBookingV2Router, createDevolucionBookingV2Router }
        from './modules/booking-integration/booking.v2.routes.js';
  - Registra las rutas v2 ANTES de la ruta general /api/v2/.../reservas
    (importante — si va después, Express captura /reservas/booking como /:id):
      app.use('/api/v2/[TU_USUARIO]/reservas/booking',     createReservaBookingV2Router(reservaRepository));
      app.use('/api/v2/[TU_USUARIO]/alquileres/booking',   createAlquilerBookingV2Router(alquilerRepository));
      app.use('/api/v2/[TU_USUARIO]/devoluciones/booking', createDevolucionBookingV2Router(alquilerRepository));

Sube los archivos y reconstruye:
  docker compose build --no-cache operaciones-service && docker compose up -d operaciones-service

Verifica sin token (debe responder NOT_FOUND, no 401):
  curl -s -X POST http://localhost/api/v2/[TU_USUARIO]/reservas/booking \
    -H "Content-Type: application/json" \
    -d '{"vehiculoId":"test","clienteId":"test","fechaInicio":"2026-08-01","fechaFin":"2026-08-05"}'
```

---

## PASO 6 — GraphQL Gateway: mapeo de campos y mutaciones v2

### Qué hace
El gateway recibe respuestas de los microservicios con nombres de campos distintos
a los definidos en el schema GraphQL. Sin el mapeo, los campos devuelven null.
Además, las mutaciones de reservas deben apuntar a v2 para publicar eventos RabbitMQ.

### Campos que necesitan mapeo

| Campo del microservicio | Campo del schema GraphQL |
|---|---|
| `precioDia` (string) | `precioPorDia` (número) |
| `status === 'DISPONIBLE'` | `disponible` (boolean) |
| `imagenUrl` | `imageUrl` |
| `modelo.nombre` | `modelo` |
| `modelo.marca.nombre` | `marca` |
| `status` | `estado` |
| `totalAmount` | `total` |

### Archivos que cambian
- `services/graphql-gateway/src/resolvers/index.ts`

### Prompt para Claude

```
Necesito arreglar los resolvers del GraphQL Gateway de UrbanCar.
Los microservicios devuelven campos con nombres distintos a los del schema GraphQL,
y las mutaciones crearReserva y cancelarReserva deben apuntar a v2 para publicar
eventos RabbitMQ (así cuando se crea una reserva desde la web o la app, todos
los demás clientes se actualizan en tiempo real).

Lee primero:
  services/graphql-gateway/src/resolvers/index.ts
  services/graphql-gateway/src/schema/index.ts

Aplica estos cambios en resolvers/index.ts:

1. Asegúrate de que existan estas constantes:
   const BASE = '/api/v1/[TU_USUARIO]';
   const V2   = '/api/v2/[TU_USUARIO]';

2. Agrega estas tres funciones de mapeo antes del objeto resolvers:

function mapVehiculo(v: any) {
  if (!v) return null;
  return {
    id:           v.id,
    placa:        v.placa,
    color:        v.color,
    anio:         v.anio,
    agenciaId:    v.agenciaId,
    marca:        v.modelo?.marca?.nombre ?? null,
    modelo:       v.modelo?.nombre ?? null,
    categoria:    v.categoria?.nombre ?? null,
    precioPorDia: v.precioDia != null ? Number(v.precioDia) : null,
    disponible:   v.status === 'DISPONIBLE',
    imageUrl:     v.imagenUrl ?? null,
  };
}

function mapReserva(r: any) {
  if (!r) return null;
  return {
    id:          r.id,
    vehiculoId:  r.vehiculoId,
    usuarioId:   r.usuarioId,
    fechaInicio: r.fechaInicio,
    fechaFin:    r.fechaFin,
    estado:      r.status ?? r.estado,
    total:       r.totalAmount != null ? Number(r.totalAmount) : (r.total != null ? Number(r.total) : null),
    createdAt:   r.createdAt,
  };
}

function mapPago(p: any) {
  if (!p) return null;
  return {
    id:         p.id,
    reservaId:  p.reservaId,
    monto:      p.monto != null ? Number(p.monto) : null,
    metodoPago: p.metodoPago,
    estado:     p.status ?? p.estado,
    createdAt:  p.createdAt,
  };
}

3. En los resolvers Query, aplica el mapeo:
   - vehiculos → list.map(mapVehiculo)
   - vehiculo  → mapVehiculo(data)
   - reservas  → list.map(mapReserva)
   - reserva / misReservas → mapReserva(data)
   - pagos → list.map(mapPago)
   - pago  → mapPago(data)

4. En Mutations, apunta crearReserva y cancelarReserva a V2:
   crearReserva: async (_: any, args: { input: any; token: string }) =>
     mapReserva(await post(`${OPS()}${V2}/reservas`, args.input, args.token)),

   cancelarReserva: async (_: any, args: { id: string; token: string }) =>
     mapReserva(await post(`${OPS()}${V2}/reservas/${args.id}/cancelar`, {}, args.token)),

   crearPago: async (_: any, args: { input: any; token: string }) =>
     mapPago(await post(`${FIN()}${BASE}/pagos`, args.input, args.token)),

Reconstruye:
  docker compose build --no-cache graphql-gateway && docker compose up -d graphql-gateway
```

---

## PASO 7 — Verificación final de todo el sistema

### Prompt para Claude

```
Necesito verificar que todo el sistema UrbanCar funciona correctamente después
de implementar RabbitMQ + WebSocket + v2 endpoints.

Mi VM está en [IP_VM], SSH key en [RUTA_SSH_KEY].

Ejecuta estas verificaciones:

1. Todos los contenedores deben estar Up:
   ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] "docker ps --format 'table {{.Names}}\t{{.Status}}'"

2. Bus-service conectado a RabbitMQ:
   curl -s http://[IP_VM]/api/v1/[TU_USUARIO]/bus/health | jq .
   Debe mostrar connected: true

3. WebSocket accesible:
   curl -s "http://[IP_VM]/socket.io/?transport=polling" | head -3
   Debe devolver datos de Socket.io (no 404)

4. Flujo completo booking v2 sin token (usar jq):
   ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] '
     VID=$(curl -s "http://localhost/api/v1/[TU_USUARIO]/vehiculos/booking?limit=1" | jq -r ".data.data[0].id")
     RES=$(curl -s -X POST "http://localhost/api/v2/[TU_USUARIO]/reservas/booking" \
       -H "Content-Type: application/json" \
       -d "{\"vehiculoId\":\"$VID\",\"clienteId\":\"00000000-0000-0000-0000-000000000001\",\"fechaInicio\":\"2026-09-01\",\"fechaFin\":\"2026-09-05\"}")
     echo "POST reserva:" && echo $RES | jq "{ok:.success, status:.data.status}"
     RID=$(echo $RES | jq -r ".data.id")
     curl -s -X PATCH "http://localhost/api/v2/[TU_USUARIO]/reservas/booking/$RID" \
       -H "Content-Type: application/json" -d "{\"status\":\"CONFIRMADA\"}" | jq "{ok:.success, status:.data.status}"
   '

5. Logs del bus-service (debe mostrar eventos recibidos):
   ssh -i [RUTA_SSH_KEY] azureuser@[IP_VM] "docker logs urbancar-bus-service-1 --tail 30"
   Debes ver: [consumer] suscrito a exchange urbancar.events
```

---

## PASO 8 — Generar el contrato OpenAPI YAML para el booking

### Prompt para Claude

```
Necesito generar el contrato OpenAPI 3.0 YAML de la Booking Integration API
de UrbanCar para enviarlo a integradores externos.

Datos del sistema:
- Base URL: http://[IP_VM]
- Prefijo de rutas: [TU_USUARIO]
- Todos los endpoints de booking son PÚBLICOS (sin autenticación)

Endpoints que debe incluir el contrato:

VEHÍCULOS (v1 — solo lectura, sin v2 en inventario-service):
  GET /api/v1/[TU_USUARIO]/vehiculos/booking
  GET /api/v1/[TU_USUARIO]/vehiculos/booking/{id}
  GET /api/v1/[TU_USUARIO]/vehiculos/booking/{id}/disponibilidad

RESERVAS (v2 — publica eventos RabbitMQ):
  POST  /api/v2/[TU_USUARIO]/reservas/booking
  GET   /api/v2/[TU_USUARIO]/reservas/booking/{id}
  PATCH /api/v2/[TU_USUARIO]/reservas/booking/{id}

ALQUILERES (v2 — publica eventos RabbitMQ):
  POST /api/v2/[TU_USUARIO]/alquileres/booking

DEVOLUCIONES (v2 — publica eventos RabbitMQ):
  POST /api/v2/[TU_USUARIO]/devoluciones/booking

Flujo completo:
  1. GET  vehiculos/booking              → listar disponibles
  2. GET  vehiculos/booking/{id}/disponibilidad → verificar
  3. POST reservas/booking               → crear (status: PENDIENTE)
  4. GET  reservas/booking/{id}          → consultar
  5. PATCH reservas/booking/{id}         → { "status": "CONFIRMADA" }
  6. POST alquileres/booking             → iniciar alquiler
  7. POST devoluciones/booking           → registrar devolución

Máquina de estados:
  PENDIENTE → CONFIRMADA | CANCELADA
  CONFIRMADA → ACTIVA | CANCELADA
  ACTIVA → COMPLETADA | CANCELADA

Formato de error estándar:
  { "success": false, "error": { "code": "...", "message": "..." } }

Genera el archivo booking-api-contract.yaml con OpenAPI 3.0.3 completo,
con schemas, ejemplos y todos los códigos de error de cada endpoint.
```

---

## Orden de ejecución recomendado

```
Paso 1 → bus-service (WebSocket + consumer RabbitMQ)   ← CRÍTICO, hacer primero
Paso 2 → nginx (proxy WebSocket + rutas v2)            ← CRÍTICO, hacer segundo
Paso 3 → Angular frontend (JWT interceptor + Marketplace en tiempo real)
Paso 4 → React Native mobile (useSocket, reemplaza polling)
Paso 5 → operaciones-service (booking v2 público)
Paso 6 → graphql-gateway (mapeo de campos)
Paso 7 → verificación final
Paso 8 → contrato YAML para integradores
```

> Los pasos 1 y 2 son los críticos. Sin el bus-service con Socket.io y sin el
> proxy nginx configurado, los eventos WebSocket no llegan ni a la web ni a la app.
> Los demás pasos son independientes entre sí y pueden hacerse en cualquier orden.

---

## Tabla de referencia: eventos RabbitMQ ↔ WebSocket

| Routing Key RabbitMQ | Evento WebSocket | Quién lo escucha |
|---|---|---|
| `reservas.reserva.creada` | `reserva:creada` | Angular Marketplace, Mobile Marketplace |
| `reservas.reserva.confirmada` | `reserva:confirmada` | Angular Marketplace, Mobile Marketplace |
| `reservas.reserva.cancelada` | `reserva:cancelada` | Angular Marketplace, Mobile Marketplace |
| `reservas.reserva.completada` | `reserva:completada` | Angular Marketplace, Mobile Marketplace |
| `pagos.pago.procesado` | `pago:procesado` | disponible para componentes de pagos |
| `alquileres.alquiler.iniciado` | `alquiler:iniciado` | disponible |
| `alquileres.devolucion.registrada` | `devolucion:registrada` | disponible |
| `mantenimiento.vehiculo.disponible` | `vehiculo:actualizado` | disponible |

## Tabla de referencia: quién usa v1 vs v2

| Endpoint | Versión | Quién lo consume | Publica RabbitMQ |
|---|---|---|---|
| `/vehiculos/booking` | v1 | Booking externo | No (solo lectura) |
| `/reservas` | v2 | App web Angular y app móvil (vía GraphQL) | Sí |
| `/reservas/booking` | v2 | Booking externo | Sí |
| `/alquileres/booking` | v2 | Booking externo | Sí |
| `/devoluciones/booking` | v2 | Booking externo | Sí |
| `/pagos` | v1 | App web Angular y app móvil | Sí (financiero-service lo hace solo) |
| `/mantenimientos` | v1 | App web Angular y app móvil | Sí (mantenimiento-service lo hace solo) |
