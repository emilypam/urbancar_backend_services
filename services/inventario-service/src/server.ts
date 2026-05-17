import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT ?? 3002;

app.listen(PORT, () => {
  console.log(`🚗 inventario-service corriendo en http://localhost:${PORT}`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/vehiculos`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/marcas`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/modelos`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/categorias`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/tipos-combustible`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/tipos-transmision`);
  console.log(`   → http://localhost:${PORT}/api/v1/emilypamela/extras`);
});
