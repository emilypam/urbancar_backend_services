import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 3003;

app.listen(PORT, () => {
  console.log(`🏢 org-service corriendo en http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/provincias`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/ciudades`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/empresas`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/agencias`);
});
