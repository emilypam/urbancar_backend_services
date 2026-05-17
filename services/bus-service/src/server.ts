import 'dotenv/config';
import app from './app.js';

const PORT = Number(process.env.PORT ?? 3007);

app.listen(PORT, () => {
  console.log(`[bus-service] corriendo en http://localhost:${PORT}`);
  console.log(`[bus-service] Azure SB: ${process.env.AZURE_SERVICEBUS_CONNECTION_STRING ? 'CONECTADO' : 'modo local'}`);
});
