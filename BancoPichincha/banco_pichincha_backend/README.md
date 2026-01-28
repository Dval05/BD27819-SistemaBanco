# Banco Pichincha Backend

Backend del Sistema de Banco Pichincha desarrollado con Node.js y Supabase.

## 🚀 Configuración

### Requisitos
- Node.js v16 o superior
- npm o yarn
- Cuenta de Supabase

### Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
El archivo `.env` ya está configurado con las credenciales de Supabase.

3. Iniciar el servidor:
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

## 📁 Estructura del Proyecto

```
banco_pichincha_backend/
├── shared/
│   └── config/
│       └── database.config.js   # Configuración de Supabase
├── .env                          # Variables de entorno
├── .gitignore                    # Archivos ignorados por Git
├── index.js                      # Punto de entrada del servidor
├── package.json                  # Dependencias y scripts
└── README.md                     # Documentación
```

## 🔌 Endpoints

### Health Check
- **GET** `/health` - Verifica el estado del servidor y la conexión a la base de datos

### API Info
- **GET** `/api` - Información general de la API

## 🗄️ Base de Datos

Este proyecto utiliza **Supabase** como base de datos PostgreSQL en la nube.

### Configuración
La conexión se establece en `shared/config/database.config.js` usando:
- `SUPABASE_URL`: URL del proyecto Supabase
- `SUPABASE_SERVICE_KEY`: Clave de servicio con privilegios completos

## 📦 Dependencias

### Principales
- **express**: Framework web para Node.js
- **@supabase/supabase-js**: Cliente oficial de Supabase
- **dotenv**: Gestión de variables de entorno
- **cors**: Middleware para habilitar CORS

### Desarrollo
- **nodemon**: Reinicio automático del servidor en desarrollo

## 🔒 Seguridad

⚠️ **IMPORTANTE**: 
- El archivo `.env` contiene credenciales sensibles
- Nunca subir el archivo `.env` a repositorios públicos
- Usar `.gitignore` para excluir archivos sensibles
