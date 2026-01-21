import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/mongo.js';
import clienteRoutes from './routes/cliente.routes.js';

// Obtener la ruta del directorio actual (compatibilidad con ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Rutas
app.use('/api/clientes', clienteRoutes);

// Función para iniciar el servidor
async function startServer() {
  try {
    // Conectar a la base de datos primero
    await connectDB();

    // Iniciar el servidor solo después de conectar a MongoDB
    app.listen(PORT, () => {
      console.log(`Servidor Banco Peluche escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar la aplicación
startServer();
