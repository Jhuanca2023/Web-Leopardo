# 📊 Mapeo de MongoDB a MySQL - Leopardo E-commerce

## 🔄 Comparación de Estructuras de Datos

### 1. **USUARIOS (Users)**

#### MongoDB (Original)
```javascript
{
  _id: ObjectId("..."),
  name: "Juan Pérez",
  email: "juan@email.com",
  password_hash: "$2b$12$...",
  telefono: "+51 999 999 999",
  direccion: "Av. Principal 123",
  es_admin: false,
  fecha_creacion: ISODate("2024-01-01T00:00:00Z"),
  fecha_actualizacion: ISODate("2024-01-01T00:00:00Z")
}
```

#### MySQL (Migrado)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,           -- Equivalente a _id
  name VARCHAR(100) NOT NULL,                  -- Campo directo
  email VARCHAR(120) UNIQUE NOT NULL,          -- Campo directo + índice único
  password_hash VARCHAR(255) NOT NULL,         -- Campo directo
  telefono VARCHAR(20),                        -- Campo directo
  direccion TEXT,                              -- Campo directo
  es_admin BOOLEAN DEFAULT FALSE,              -- Campo directo
  activo BOOLEAN DEFAULT TRUE,                 -- Campo adicional para soft delete
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Diferencias clave:**
- `_id` → `id` (INT AUTO_INCREMENT)
- Agregado campo `activo` para soft delete
- Timestamps automáticos con triggers

---

### 2. **CATEGORÍAS (Categories)**

#### MongoDB
```javascript
{
  _id: ObjectId("..."),
  nombre: "Calzado de Seguridad",
  descripcion: "Calzado industrial...",
  icono: "assets/images/icono.jpg",
  activo: true,
  fecha_creacion: ISODate("2024-01-01T00:00:00Z")
}
```

#### MySQL
```sql
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  orden INT DEFAULT 0,                         -- Campo adicional para ordenamiento
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Diferencias clave:**
- Agregado campo `orden` para ordenamiento
- Agregado `fecha_actualizacion` automática

---

### 3. **PRODUCTOS (Products)**

#### MongoDB
```javascript
{
  _id: ObjectId("..."),
  nombre: "Bota de Seguridad",
  descripcion: "Descripción del producto...",
  precio: 89.90,
  stock: 50,
  imagen_principal: "assets/images/bota.jpg",
  imagenes_adicionales: ["img1.jpg", "img2.jpg"],  // Array en MongoDB
  categoria_id: ObjectId("..."),
  activo: true,
  destacado: true,
  fecha_creacion: ISODate("2024-01-01T00:00:00Z"),
  fecha_actualizacion: ISODate("2024-01-01T00:00:00Z")
}
```

#### MySQL
```sql
CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  precio_anterior DECIMAL(10,2),               -- Campo adicional para ofertas
  stock INT DEFAULT 0,
  stock_minimo INT DEFAULT 5,                  -- Campo adicional para alertas
  imagen_principal VARCHAR(255),
  imagenes_adicionales TEXT,                   -- JSON string en MySQL
  categoria_id INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  destacado BOOLEAN DEFAULT FALSE,
  nuevo BOOLEAN DEFAULT FALSE,                 -- Campo adicional
  oferta BOOLEAN DEFAULT FALSE,                -- Campo adicional
  codigo_sku VARCHAR(50),                      -- Campo adicional
  peso DECIMAL(8,2),                           -- Campo adicional
  dimensiones VARCHAR(100),                    -- Campo adicional
  material VARCHAR(100),                       -- Campo adicional
  color VARCHAR(50),                           -- Campo adicional
  talla VARCHAR(20),                           -- Campo adicional
  marca VARCHAR(100),                          -- Campo adicional
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
```

**Diferencias clave:**
- `imagenes_adicionales`: Array → JSON string
- Múltiples campos adicionales para e-commerce completo
- Relación con foreign key

---

### 4. **CARRITO (Cart)**

#### MongoDB
```javascript
{
  _id: ObjectId("..."),
  usuario_id: ObjectId("..."),
  producto_id: ObjectId("..."),
  cantidad: 2,
  fecha_agregado: ISODate("2024-01-01T00:00:00Z")
}
```

#### MySQL
```sql
CREATE TABLE carrito (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2),               -- Campo adicional
  fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY usuario_producto (usuario_id, producto_id),  -- Índice único
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

**Diferencias clave:**
- Agregado `precio_unitario` para historial de precios
- Índice único para evitar duplicados
- Foreign keys para integridad referencial

---

### 5. **PEDIDOS (Orders)**

#### MongoDB
```javascript
{
  _id: ObjectId("..."),
  usuario_id: ObjectId("..."),
  total: 179.80,
  estado: "pendiente",
  direccion_envio: "Av. Principal 123",
  telefono_contacto: "+51 999 999 999",
  notas: "Entregar en horario de oficina",
  fecha_pedido: ISODate("2024-01-01T00:00:00Z"),
  fecha_actualizacion: ISODate("2024-01-01T00:00:00Z")
}
```

#### MySQL
```sql
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  numero_pedido VARCHAR(20) UNIQUE,            -- Campo adicional
  total DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2),                      -- Campo adicional
  impuestos DECIMAL(10,2) DEFAULT 0.00,        -- Campo adicional
  descuento DECIMAL(10,2) DEFAULT 0.00,        -- Campo adicional
  estado ENUM('pendiente','procesando','enviado','entregado','cancelado','reembolsado'),
  metodo_pago VARCHAR(50),                     -- Campo adicional
  estado_pago ENUM('pendiente','pagado','fallido','reembolsado'),  -- Campo adicional
  direccion_envio TEXT NOT NULL,
  telefono_contacto VARCHAR(20),
  email_contacto VARCHAR(120),                 -- Campo adicional
  notas TEXT,
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_procesamiento TIMESTAMP NULL,          -- Campo adicional
  fecha_envio TIMESTAMP NULL,                  -- Campo adicional
  fecha_entrega TIMESTAMP NULL,                -- Campo adicional
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES users(id)
);
```

**Diferencias clave:**
- Múltiples campos adicionales para e-commerce completo
- Estados más detallados con ENUM
- Timestamps específicos para cada etapa del pedido

---

### 6. **DETALLES DE PEDIDOS (Order Details)**

#### MongoDB
```javascript
{
  _id: ObjectId("..."),
  pedido_id: ObjectId("..."),
  producto_id: ObjectId("..."),
  cantidad: 2,
  precio_unitario: 89.90,
  subtotal: 179.80
}
```

#### MySQL
```sql
CREATE TABLE detalle_pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0.00,        -- Campo adicional
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

---

## 🆕 **TABLAS NUEVAS EN MySQL**

### 7. **WISHLIST (Lista de Deseos)**
```sql
CREATE TABLE wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  producto_id INT NOT NULL,
  fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY usuario_producto_wishlist (usuario_id, producto_id),
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

### 8. **RESEÑAS (Reviews)**
```sql
CREATE TABLE reseñas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  producto_id INT NOT NULL,
  pedido_id INT,
  calificacion TINYINT(1) NOT NULL,
  titulo VARCHAR(200),
  comentario TEXT,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES users(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);
```

### 9. **CUPONES (Coupons)**
```sql
CREATE TABLE cupones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  tipo ENUM('porcentaje','fijo') DEFAULT 'porcentaje',
  valor DECIMAL(10,2) NOT NULL,
  monto_minimo DECIMAL(10,2),
  monto_maximo DECIMAL(10,2),
  usos_maximos INT,
  usos_actuales INT DEFAULT 0,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);
```

### 10. **CONFIGURACIONES (Settings)**
```sql
CREATE TABLE configuraciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  descripcion TEXT,
  tipo ENUM('string','number','boolean','json') DEFAULT 'string',
  categoria VARCHAR(50) DEFAULT 'general'
);
```

### 11. **LOGS (System Logs)**
```sql
CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nivel ENUM('DEBUG','INFO','WARNING','ERROR','CRITICAL') DEFAULT 'INFO',
  mensaje TEXT NOT NULL,
  contexto JSON,
  usuario_id INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES users(id)
);
```

---

## 🔧 **FUNCIONALIDADES ADICIONALES EN MySQL**

### **Vistas (Views)**
```sql
-- Vista de productos completa
CREATE VIEW vista_productos_completa AS
SELECT p.*, c.nombre as categoria_nombre, c.icono as categoria_icono
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.activo = 1;

-- Vista de estadísticas
CREATE VIEW vista_estadisticas_productos AS
SELECT 
    c.id, c.nombre,
    COUNT(p.id) as total_productos,
    AVG(p.precio) as precio_promedio,
    SUM(p.stock) as stock_total
FROM categorias c
LEFT JOIN productos p ON c.id = p.categoria_id
GROUP BY c.id, c.nombre;
```

### **Procedimientos Almacenados**
```sql
-- Generar número de pedido único
CREATE PROCEDURE GenerarNumeroPedido(IN pedido_id INT)
BEGIN
    -- Lógica para generar número único
END;

-- Actualizar stock después de pedido
CREATE PROCEDURE ActualizarStockPedido(IN pedido_id INT)
BEGIN
    -- Lógica para actualizar stock
END;
```

### **Triggers**
```sql
-- Generar número de pedido automáticamente
CREATE TRIGGER tr_generar_numero_pedido 
AFTER INSERT ON pedidos
FOR EACH ROW
BEGIN
    CALL GenerarNumeroPedido(NEW.id);
END;
```

---

## 📊 **COMPARACIÓN DE RENDIMIENTO**

| Aspecto | MongoDB | MySQL |
|---------|---------|-------|
| **Consultas complejas** | Limitadas | Excelentes con JOINs |
| **Transacciones** | Limitadas | ACID completas |
| **Integridad referencial** | Manual | Automática con FK |
| **Escalabilidad horizontal** | Excelente | Limitada |
| **Escalabilidad vertical** | Buena | Excelente |
| **Consistencia** | Eventual | Fuerte |
| **Flexibilidad de esquema** | Total | Estructurado |

---

## 🚀 **VENTAJAS DE LA MIGRACIÓN**

### **MySQL ofrece:**
1. **Integridad referencial** automática
2. **Transacciones ACID** completas
3. **Consultas complejas** con JOINs
4. **Vistas** para consultas predefinidas
5. **Procedimientos almacenados** para lógica de negocio
6. **Triggers** para automatización
7. **Índices optimizados** para rendimiento
8. **Respaldos** más simples y confiables
9. **Herramientas de administración** maduras
10. **Ecosistema** más amplio

### **Funcionalidades nuevas:**
- Sistema de cupones y descuentos
- Lista de deseos
- Sistema de reseñas
- Logs del sistema
- Configuraciones dinámicas
- Alertas automáticas
- Reportes avanzados
- Gestión de inventario mejorada

---

## 📝 **NOTAS DE MIGRACIÓN**

1. **Arrays → JSON**: Los arrays de MongoDB se convierten a strings JSON en MySQL
2. **ObjectId → INT**: Los IDs de MongoDB se convierten a enteros auto-incrementales
3. **Timestamps**: Se agregan timestamps automáticos con triggers
4. **Soft Delete**: Se implementa con campos `activo` en lugar de eliminar registros
5. **Relaciones**: Se establecen con foreign keys para integridad referencial
6. **Índices**: Se optimizan para consultas frecuentes
7. **Validaciones**: Se implementan a nivel de base de datos con constraints

---

## 🔄 **PROCESO DE MIGRACIÓN**

1. **Exportar datos** de MongoDB a JSON/CSV
2. **Crear estructura** MySQL con el script SQL
3. **Importar datos** transformando formatos
4. **Validar integridad** de los datos migrados
5. **Optimizar consultas** y rendimiento
6. **Probar funcionalidades** completas
7. **Configurar respaldos** y mantenimiento

---

**✅ La migración de MongoDB a MySQL proporciona una base de datos más robusta, con mejor integridad de datos y funcionalidades avanzadas para un e-commerce completo.**
