import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 3005;

app.listen(PORT, () => {
  console.log(`💳 financiero-service corriendo en http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/pagos`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/facturas`);
});
