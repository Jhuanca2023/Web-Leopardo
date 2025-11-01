# Leopardo E-commerce - Frontend

## Descripción

Frontend moderno para el ecommerce de Leopardo, desarrollado con HTML5, CSS3, JavaScript (jQuery) y Bootstrap 5. El frontend consume la API REST de PHP ubicada en `https://leopardo.tecnovedadesweb.site/api.php`.

## Características

### 🏠 Páginas Principales
- **Página de Inicio**: Hero section, categorías, productos destacados y testimonios
- **Catálogo de Productos**: Lista de productos con filtros y búsqueda
- **Detalle de Producto**: Vista detallada con imágenes y opciones de compra
- **Categorías**: Navegación por categorías de productos
- **Carrito de Compras**: Gestión completa del carrito con persistencia local/servidor
- **Checkout**: Proceso de finalización de compra
- **Autenticación**: Login y registro de usuarios
- **Perfil de Usuario**: Gestión de datos personales
- **Pedidos**: Historial de pedidos del usuario

### 🎨 Diseño y UX
- **Responsive Design**: Adaptable a todos los dispositivos
- **Bootstrap 5**: Framework CSS moderno
- **Font Awesome**: Iconografía completa
- **Animaciones**: Transiciones suaves y efectos visuales
- **Tema Personalizado**: Colores y estilos específicos de Leopardo

### ⚡ Funcionalidades
- **SPA (Single Page Application)**: Navegación sin recarga de página
- **Carrito Persistente**: Funciona tanto para usuarios autenticados como invitados
- **Búsqueda en Tiempo Real**: Filtros dinámicos de productos
- **Notificaciones**: Sistema de alertas y notificaciones toast
- **Manejo de Errores**: Gestión centralizada de errores
- **Validación de Formularios**: Validación en tiempo real
- **Paginación**: Navegación eficiente de productos

## Estructura de Archivos

```
├── index.html                 # Página principal (SPA)
├── assets/
│   ├── css/
│   │   └── main.css          # Estilos personalizados
│   ├── js/
│   │   ├── app.js            # Aplicación principal y configuración
│   │   ├── router.js         # Sistema de enrutamiento
│   │   ├── auth.js           # Gestión de autenticación
│   │   ├── cart.js           # Gestión del carrito
│   │   ├── components.js     # Componentes reutilizables
│   │   └── error-handler.js  # Manejo de errores
│   └── images/               # Imágenes y assets
└── FRONTEND_README.md        # Este archivo
```

## Configuración

### 1. Configuración de la API

El frontend está configurado para consumir la API en:
```javascript
const APP_CONFIG = {
    apiBaseUrl: 'https://leopardo.tecnovedadesweb.site/api.php',
    // ... otras configuraciones
};
```

### 2. Dependencias Externas

El frontend utiliza las siguientes librerías CDN:
- **Bootstrap 5.3.0**: Framework CSS
- **jQuery 3.7.1**: Manipulación del DOM y AJAX
- **Font Awesome 6.4.0**: Iconografía

## Uso

### 1. Instalación Local

1. Clona o descarga los archivos del frontend
2. Abre `index.html` en un navegador web
3. El frontend se conectará automáticamente a la API

### 2. Despliegue en Servidor

1. Sube todos los archivos a tu servidor web
2. Asegúrate de que el archivo `index.html` sea accesible
3. Configura el servidor para servir archivos estáticos

### 3. Configuración de CORS

La API debe tener configurado CORS para permitir requests desde el frontend:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
```

## API Endpoints Utilizados

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/check` - Verificar autenticación
- `GET /auth/profile` - Obtener perfil
- `PUT /auth/profile` - Actualizar perfil

### Productos
- `GET /productos` - Listar productos
- `GET /productos/:id` - Obtener producto específico
- `GET /productos/destacados` - Productos destacados
- `GET /productos/buscar` - Buscar productos

### Categorías
- `GET /categorias` - Listar categorías
- `GET /categorias/:id` - Obtener categoría específica

### Carrito
- `GET /carrito` - Obtener carrito
- `POST /carrito` - Agregar producto
- `PUT /carrito/:id` - Actualizar cantidad
- `DELETE /carrito/:id` - Eliminar item
- `DELETE /carrito` - Vaciar carrito

### Pedidos
- `GET /pedidos` - Listar pedidos del usuario
- `POST /pedidos` - Crear pedido
- `GET /pedidos/:id` - Obtener pedido específico

## Componentes Principales

### 1. Router (router.js)
Sistema de enrutamiento del lado del cliente que maneja la navegación sin recarga de página.

### 2. AuthManager (auth.js)
Gestión completa de autenticación de usuarios con persistencia local.

### 3. CartManager (cart.js)
Sistema de carrito que funciona tanto para usuarios autenticados como invitados.

### 4. Componentes (components.js)
Componentes reutilizables como tarjetas de productos, filtros, paginación, etc.

### 5. ErrorHandler (error-handler.js)
Manejo centralizado de errores con notificaciones al usuario.

## Personalización

### 1. Colores y Tema

Modifica las variables CSS en `assets/css/main.css`:
```css
:root {
    --primary-color: #0d6efd;
    --secondary-color: #6c757d;
    /* ... más variables */
}
```

### 2. Configuración de la Aplicación

Ajusta la configuración en `assets/js/app.js`:
```javascript
const APP_CONFIG = {
    apiBaseUrl: 'https://tu-api.com',
    sessionTimeout: 30 * 60 * 1000,
    // ... más configuraciones
};
```

### 3. Componentes Personalizados

Crea nuevos componentes en `assets/js/components.js` siguiendo el patrón existente.

## Características Técnicas

### 1. SPA (Single Page Application)
- Navegación sin recarga de página
- Estado de la aplicación mantenido en memoria
- URLs amigables con history API

### 2. Persistencia de Datos
- **LocalStorage**: Carrito de invitados y preferencias
- **SessionStorage**: Datos temporales de sesión
- **API REST**: Datos del servidor

### 3. Manejo de Estado
- Estado global en `AppState`
- Reactividad con jQuery
- Sincronización automática con la API

### 4. Optimizaciones
- Lazy loading de imágenes
- Debounce en búsquedas
- Caché de datos frecuentes
- Compresión de assets

## Compatibilidad

### Navegadores Soportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dispositivos
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## Troubleshooting

### 1. Errores de CORS
Si encuentras errores de CORS, verifica que la API tenga configurado correctamente los headers.

### 2. Problemas de Autenticación
Verifica que los endpoints de autenticación estén funcionando correctamente.

### 3. Carrito No Persiste
Asegúrate de que el localStorage esté habilitado en el navegador.

### 4. Imágenes No Cargan
Verifica las rutas de las imágenes y que los archivos existan en el servidor.

## Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Realiza tus cambios
4. Envía un pull request

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo LICENSE para más detalles.

## Soporte

Para soporte técnico o preguntas:
- Email: pierregomezsanchez@gmail.com
- Teléfono: +51 940-870-622

---

**Desarrollado con ❤️ para Leopardo E-commerce**


