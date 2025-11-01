# 🦁 Leopardo E-commerce PHP

Sistema de e-commerce para venta de calzado de seguridad industrial, migrado de Python/Flask a PHP/MySQL.

## 📋 Características

- **Gestión de productos**: CRUD completo de productos con categorías
- **Sistema de usuarios**: Registro, login y gestión de perfiles
- **Carrito de compras**: Agregar, actualizar y eliminar productos
- **Sistema de pedidos**: Crear y gestionar pedidos
- **Panel de administración**: Gestión completa del sistema
- **API REST**: Endpoints para integración con frontend
- **Base de datos MySQL**: Esquema optimizado con relaciones

## 🛠️ Requisitos del Sistema

- **PHP**: 7.4 o superior
- **MySQL**: 5.7 o superior
- **Extensiones PHP**:
  - PDO
  - PDO_MySQL
  - JSON
  - Session
- **Servidor web**: Apache o Nginx

## 📦 Instalación

### 1. Clonar o descargar el proyecto

```bash
# Si tienes git
git clone <repository-url>
cd leopardo_ecommerce_php

# O descargar y extraer el archivo ZIP
```

### 2. Configurar la base de datos

1. Crear una base de datos MySQL:
```sql
CREATE DATABASE leopardo_ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Crear un usuario para la aplicación:
```sql
CREATE USER 'leopardo_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON leopardo_ecommerce.* TO 'leopardo_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configurar la aplicación

Editar el archivo `config/config.php` con tus datos de base de datos:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'leopardo_ecommerce');
define('DB_USER', 'leopardo_user');
define('DB_PASS', 'tu_password_seguro');
```

### 4. Ejecutar la instalación

Acceder a `http://tu-dominio/leopardo_ecommerce_php/install.php` en tu navegador.

El script de instalación:
- Verificará los requisitos del sistema
- Creará las tablas de la base de datos
- Insertará datos iniciales
- Creará el usuario administrador

### 5. Configurar el servidor web

#### Apache
Configurar el DocumentRoot para apuntar al directorio `public`:

```apache
<VirtualHost *:80>
    ServerName leopardo.local
    DocumentRoot /ruta/al/proyecto/leopardo_ecommerce_php/public
    
    <Directory /ruta/al/proyecto/leopardo_ecommerce_php/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name leopardo.local;
    root /ruta/al/proyecto/leopardo_ecommerce_php/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## 🚀 Uso

### Acceso a la aplicación

- **Frontend**: `http://tu-dominio/leopardo_ecommerce_php/public/`
- **API**: `http://tu-dominio/leopardo_ecommerce_php/public/api/`

### Credenciales por defecto

- **Email**: admin@leopardo.com
- **Contraseña**: admin123

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil

### Productos
- `GET /api/productos` - Listar productos
- `GET /api/productos/{id}` - Obtener producto
- `POST /api/productos` - Crear producto (admin)
- `PUT /api/productos/{id}` - Actualizar producto (admin)
- `DELETE /api/productos/{id}` - Eliminar producto (admin)

### Categorías
- `GET /api/categorias` - Listar categorías
- `GET /api/categorias/{id}` - Obtener categoría
- `POST /api/categorias` - Crear categoría (admin)
- `PUT /api/categorias/{id}` - Actualizar categoría (admin)
- `DELETE /api/categorias/{id}` - Eliminar categoría (admin)

### Carrito
- `GET /api/carrito` - Obtener carrito
- `POST /api/carrito` - Agregar producto
- `PUT /api/carrito/{id}` - Actualizar cantidad
- `DELETE /api/carrito/{id}` - Eliminar item
- `DELETE /api/carrito` - Vaciar carrito

### Pedidos
- `GET /api/pedidos` - Listar pedidos del usuario
- `GET /api/pedidos/{id}` - Obtener pedido
- `POST /api/pedidos` - Crear pedido
- `PUT /api/pedidos/{id}/estado` - Actualizar estado (admin)

## 🗂️ Estructura del Proyecto

```
leopardo_ecommerce_php/
├── config/                 # Configuración
│   ├── config.php         # Configuración principal
│   └── database.php       # Clase de conexión DB
├── controllers/           # Controladores
│   ├── BaseController.php
│   ├── AuthController.php
│   ├── ProductoController.php
│   ├── CategoriaController.php
│   ├── CarritoController.php
│   └── PedidoController.php
├── models/               # Modelos de datos
│   ├── BaseModel.php
│   ├── User.php
│   ├── Producto.php
│   ├── Categoria.php
│   ├── Carrito.php
│   └── Pedido.php
├── public/               # Directorio público
│   ├── index.php        # Punto de entrada
│   └── .htaccess        # Configuración Apache
├── assets/              # Archivos estáticos
├── views/               # Vistas (si se implementa)
├── includes/            # Archivos incluidos
├── install.php          # Script de instalación
└── README.md           # Este archivo
```

## 🔧 Configuración Avanzada

### Variables de entorno

Puedes crear un archivo `.env` para configuraciones sensibles:

```env
DB_HOST=localhost
DB_NAME=leopardo_ecommerce
DB_USER=leopardo_user
DB_PASS=tu_password_seguro
SECRET_KEY=tu_clave_secreta_muy_larga
```

### Configuración de sesiones

En `config/config.php` puedes ajustar:

```php
define('SESSION_LIFETIME', 3600); // 1 hora
define('SESSION_NAME', 'LEOPARDO_SESSION');
```

### Configuración de archivos

```php
define('UPLOAD_PATH', __DIR__ . '/../assets/uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
```

## 🛡️ Seguridad

- Contraseñas hasheadas con `password_hash()`
- Validación de entrada en todos los endpoints
- Sanitización de datos
- Protección CSRF (implementar según necesidades)
- Headers de seguridad configurados

## 🐛 Solución de Problemas

### Error de conexión a base de datos
1. Verificar que MySQL esté ejecutándose
2. Comprobar credenciales en `config/config.php`
3. Asegurar que la base de datos existe

### Error 500
1. Verificar logs de error de PHP
2. Comprobar permisos de archivos
3. Verificar configuración del servidor web

### Problemas de rutas
1. Verificar configuración de `.htaccess`
2. Asegurar que mod_rewrite esté habilitado
3. Comprobar configuración del DocumentRoot

## 📝 Logs

Los logs se guardan en:
- **PHP**: `/var/log/php_errors.log` (configurar en php.ini)
- **Apache**: `/var/log/apache2/error.log`
- **Nginx**: `/var/log/nginx/error.log`

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- Email: pierregomezsanchez@gmail.com
- Documentación: [Wiki del proyecto]

---

**Desarrollado con ❤️ para Corporación G&S Leopardo**
