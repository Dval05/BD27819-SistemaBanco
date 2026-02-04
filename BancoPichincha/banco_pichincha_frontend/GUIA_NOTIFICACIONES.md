# Guía de Migración: Sistema de Notificaciones Personalizado

## ✅ Sistema Implementado

Se ha creado un sistema de notificaciones personalizado que reemplaza los `alert()` nativos del navegador.

### Archivos Creados

1. **`src/contexts/NotificacionContext.tsx`** - Contexto React para manejar notificaciones
2. **`src/styles/notificacion.css`** - Estilos del modal de notificación
3. **Actualizado `src/App.tsx`** - Envuelve la app con `NotificacionProvider`

### Módulos Ya Actualizados

- ✅ **Login.tsx** - Validaciones y errores de login/registro
- ✅ **Contactos.tsx** - Validación de cuentas, CRUD de contactos

## 📝 Cómo Usar en Otros Módulos

### 1. Importar el hook

```typescript
import { useNotificacion } from '../../contexts/NotificacionContext';
```

### 2. Usar el hook en el componente

```typescript
function MiComponente() {
  const { exito, error, advertencia, info } = useNotificacion();
  
  // ... resto del código
}
```

### 3. Reemplazar alerts

**ANTES:**
```typescript
alert('✅ Operación exitosa');
alert('❌ Error: ' + error.message);
alert('⚠️ Advertencia importante');
alert('ℹ️ Información relevante');
```

**DESPUÉS:**
```typescript
exito('Operación exitosa', 'Éxito'); // Título opcional
error(error.message, 'Error'); 
advertencia('Advertencia importante', 'Atención');
info('Información relevante', 'Información');
```

## 📋 Módulos Pendientes de Actualización

### Alta Prioridad
- [ ] `src/modules/inicio/Inicio.tsx` (11 alerts)
- [ ] `src/modules/productos/Productos.tsx` (4 alerts)
- [ ] `src/modules/inversiones/components/ConfirmacionInversion/ConfirmacionInversion.tsx` (2 alerts)

### Media Prioridad
- [ ] `src/modules/transferencias/views/TransferenciaExito/TransferenciaExito.tsx` (1 alert)
- [ ] Otros módulos según necesidad

## 🎨 Tipos de Notificación

### `exito(mensaje, titulo?)`
- Color: Verde (#4CAF50)
- Icono: ✅
- Uso: Operaciones completadas exitosamente

### `error(mensaje, titulo?)`
- Color: Rojo (#f44336)
- Icono: ❌
- Uso: Errores y fallos

### `advertencia(mensaje, titulo?)`
- Color: Naranja (#ff9800)
- Icono: ⚠️
- Uso: Advertencias e información importante

### `info(mensaje, titulo?)`
- Color: Azul (#2196F3)
- Icono: ℹ️
- Uso: Información general

## 💡 Ejemplos Prácticos

### Ejemplo 1: Crear Cuenta
```typescript
try {
  const response = await crearCuenta(datos);
  exito('Cuenta de ahorro creada exitosamente', 'Cuenta Creada');
} catch (error) {
  error('Error al crear cuenta: ' + error.message, 'Error de Creación');
}
```

### Ejemplo 2: Validación de Formulario
```typescript
if (!formData.campo || formData.campo.length < 5) {
  advertencia('El campo debe tener al menos 5 caracteres', 'Validación');
  return;
}
```

### Ejemplo 3: Información Multi-línea
```typescript
exito(
  `Cuenta creada exitosamente\n\n` +
  `Número de cuenta: ${numeroCuenta}\n` +
  `Tarjeta: ${numeroTarjeta}\n` +
  `PIN inicial: ${pin}`,
  'Operación Exitosa'
);
```

## 🔧 Características

- **Modal personalizado** - Diseño coherente con la marca Banco Pichincha
- **Animaciones suaves** - FadeIn y SlideIn
- **Responsive** - Funciona en móvil y desktop
- **Cierre fácil** - Click en overlay, botón X, o auto-cierre
- **Soporte multi-línea** - Usa `\n` para saltos de línea
- **Títulos opcionales** - Más contexto cuando se necesita
- **Z-index alto (10000)** - Siempre visible sobre otros elementos

## ⚠️ Importante

- No es necesario quitar los emojis (✅❌⚠️ℹ️) del mensaje, ya se agregan automáticamente
- Los `confirm()` nativos pueden mantenerse o crear un sistema similar si se requiere
- El título es opcional - úsalo cuando agregue contexto útil

## 🎯 Patrón Recomendado

```typescript
// En el componente
const { exito, error: notificarError, advertencia, info } = useNotificacion();

// Nota: Renombrar 'error' a 'notificarError' evita conflicto con objetos error
```

## 📦 Lista de Archivos con Alerts

Busca y reemplaza en estos archivos:

1. `src/modules/inicio/Inicio.tsx` - 11 alerts
2. `src/modules/productos/Productos.tsx` - 4 alerts  
3. `src/modules/inversiones/components/ConfirmacionInversion/ConfirmacionInversion.tsx` - 2 alerts
4. `src/modules/transferencias/views/TransferenciaExito/TransferenciaExito.tsx` - 1 alert

Total original: 35 alerts
Actualizados: 18 alerts (Login + Contactos)
Pendientes: 17 alerts

## ✨ Resultado Final

Los usuarios ahora verán notificaciones profesionales y consistentes en lugar del alert() nativo del navegador con "localhost dice...".
