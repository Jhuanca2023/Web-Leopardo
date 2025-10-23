-- =====================================================
-- Script SQL para Leopardo E-commerce
-- Migración de MongoDB a MySQL
-- =====================================================

-- Configuración inicial
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- =====================================================
-- 1. TABLA DE USUARIOS
-- =====================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'Nombre completo del usuario',
  `email` varchar(120) NOT NULL COMMENT 'Email único del usuario',
  `password_hash` varchar(255) NOT NULL COMMENT 'Hash de la contraseña',
  `telefono` varchar(20) DEFAULT NULL COMMENT 'Teléfono de contacto',
  `direccion` text DEFAULT NULL COMMENT 'Dirección del usuario',
  `es_admin` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indica si es administrador',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Estado del usuario (activo/inactivo)',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del usuario',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_activo` (`activo`),
  KEY `idx_users_es_admin` (`es_admin`),
  KEY `idx_users_fecha_creacion` (`fecha_creacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de usuarios del sistema';

-- =====================================================
-- 2. TABLA DE CATEGORÍAS
-- =====================================================
DROP TABLE IF EXISTS `categorias`;
CREATE TABLE `categorias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL COMMENT 'Nombre de la categoría',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción de la categoría',
  `icono` varchar(255) DEFAULT NULL COMMENT 'Ruta del icono de la categoría',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Estado de la categoría',
  `orden` int(11) DEFAULT 0 COMMENT 'Orden de visualización',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de actualización',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_categorias_activo` (`activo`),
  KEY `idx_categorias_orden` (`orden`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de categorías de productos';

-- =====================================================
-- 3. TABLA DE PRODUCTOS
-- =====================================================
DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `codigo` VARCHAR(20) UNIQUE NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `precio` DECIMAL(10,2) NOT NULL,
  `categoria_id` INT,
  `imagen_principal` VARCHAR(255),
  `imagenes_adicionales` JSON,
  `tipo` VARCHAR(50),
  `material` VARCHAR(100),
  `espesor_cuero` VARCHAR(20),
  `forro` VARCHAR(100),
  `puntera` VARCHAR(50),
  `impermeable` BOOLEAN DEFAULT 0,
  `suela` VARCHAR(100),
  `plantilla` VARCHAR(100),
  `aislamiento` VARCHAR(50),
  `caracteristicas` JSON,
  `activo` BOOLEAN DEFAULT 1,
  `destacado` BOOLEAN DEFAULT 0,
  `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`categoria_id`) REFERENCES categorias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de productos';
-- Tabla de tallas y stock por producto
DROP TABLE IF EXISTS `producto_tallas_stock`;
CREATE TABLE `producto_tallas_stock` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `producto_id` INT NOT NULL,
  `talla` VARCHAR(10) NOT NULL,
  `stock` INT DEFAULT 0,
  UNIQUE (`producto_id`, `talla`),
  FOREIGN KEY (`producto_id`) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stock por talla de producto';

-- =====================================================
-- 4. TABLA DE CARRITO
-- =====================================================
DROP TABLE IF EXISTS `carrito`;
CREATE TABLE `carrito` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL COMMENT 'ID del usuario',
  `producto_id` int(11) NOT NULL COMMENT 'ID del producto',
  `talla` varchar(10) DEFAULT NULL COMMENT 'Talla del producto',
  `cantidad` int(11) NOT NULL DEFAULT 1 COMMENT 'Cantidad del producto',
  `precio_unitario` decimal(10,2) DEFAULT NULL COMMENT 'Precio al momento de agregar',
  `fecha_agregado` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de agregado al carrito',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de última actualización',
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_producto_talla` (`usuario_id`, `producto_id`, `talla`),
  KEY `idx_carrito_usuario` (`usuario_id`),
  KEY `idx_carrito_producto` (`producto_id`),
  KEY `idx_carrito_fecha` (`fecha_agregado`),
  CONSTRAINT `fk_carrito_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_carrito_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla del carrito de compras';

-- =====================================================
-- 5. TABLA DE PEDIDOS
-- =====================================================
DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL COMMENT 'ID del usuario',
  `numero_pedido` varchar(20) DEFAULT NULL COMMENT 'Número único del pedido',
  `total` decimal(10,2) NOT NULL COMMENT 'Total del pedido',
  `subtotal` decimal(10,2) DEFAULT NULL COMMENT 'Subtotal sin impuestos',
  `impuestos` decimal(10,2) DEFAULT 0.00 COMMENT 'Impuestos aplicados',
  `descuento` decimal(10,2) DEFAULT 0.00 COMMENT 'Descuento aplicado',
  `estado` enum('pendiente','procesando','enviado','entregado','cancelado','reembolsado') NOT NULL DEFAULT 'pendiente' COMMENT 'Estado del pedido',
  `metodo_pago` varchar(50) DEFAULT NULL COMMENT 'Método de pago utilizado',
  `estado_pago` enum('pendiente','pagado','fallido','reembolsado') DEFAULT 'pendiente' COMMENT 'Estado del pago',
  `direccion_envio` text NOT NULL COMMENT 'Dirección de envío',
  `telefono_contacto` varchar(20) DEFAULT NULL COMMENT 'Teléfono de contacto',
  `email_contacto` varchar(120) DEFAULT NULL COMMENT 'Email de contacto',
  `notas` text DEFAULT NULL COMMENT 'Notas adicionales del pedido',
  `fecha_pedido` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha del pedido',
  `fecha_procesamiento` timestamp NULL DEFAULT NULL COMMENT 'Fecha de procesamiento',
  `fecha_envio` timestamp NULL DEFAULT NULL COMMENT 'Fecha de envío',
  `fecha_entrega` timestamp NULL DEFAULT NULL COMMENT 'Fecha de entrega',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de actualización',
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_pedido` (`numero_pedido`),
  KEY `idx_pedidos_usuario` (`usuario_id`),
  KEY `idx_pedidos_estado` (`estado`),
  KEY `idx_pedidos_fecha_pedido` (`fecha_pedido`),
  KEY `idx_pedidos_estado_pago` (`estado_pago`),
  CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla de pedidos';

-- =====================================================
-- 6. TABLA DE DETALLES DE PEDIDOS
-- =====================================================
DROP TABLE IF EXISTS `detalle_pedidos`;
CREATE TABLE `detalle_pedidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` int(11) NOT NULL COMMENT 'ID del pedido',
  `producto_id` int(11) NOT NULL COMMENT 'ID del producto',
  `cantidad` int(11) NOT NULL COMMENT 'Cantidad del producto',
  `precio_unitario` decimal(10,2) NOT NULL COMMENT 'Precio unitario al momento del pedido',
  `subtotal` decimal(10,2) NOT NULL COMMENT 'Subtotal del item',
  `descuento` decimal(10,2) DEFAULT 0.00 COMMENT 'Descuento aplicado al item',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  PRIMARY KEY (`id`),
  KEY `idx_detalle_pedido` (`pedido_id`),
  KEY `idx_detalle_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Detalles de los pedidos';

-- =====================================================
-- 7. TABLA DE WISHLIST (LISTA DE DESEOS)
-- =====================================================
DROP TABLE IF EXISTS `wishlist`;
CREATE TABLE `wishlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL COMMENT 'ID del usuario',
  `producto_id` int(11) NOT NULL COMMENT 'ID del producto',
  `fecha_agregado` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de agregado a la lista',
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_producto_wishlist` (`usuario_id`, `producto_id`),
  KEY `idx_wishlist_usuario` (`usuario_id`),
  KEY `idx_wishlist_producto` (`producto_id`),
  CONSTRAINT `fk_wishlist_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wishlist_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lista de deseos de usuarios';

-- =====================================================
-- 8. TABLA DE RESEÑAS DE PRODUCTOS
-- =====================================================
DROP TABLE IF EXISTS `reseñas`;
CREATE TABLE `reseñas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL COMMENT 'ID del usuario',
  `producto_id` int(11) NOT NULL COMMENT 'ID del producto',
  `pedido_id` int(11) DEFAULT NULL COMMENT 'ID del pedido relacionado',
  `calificacion` tinyint(1) NOT NULL COMMENT 'Calificación de 1 a 5',
  `titulo` varchar(200) DEFAULT NULL COMMENT 'Título de la reseña',
  `comentario` text DEFAULT NULL COMMENT 'Comentario de la reseña',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Estado de la reseña',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de actualización',
  PRIMARY KEY (`id`),
  KEY `idx_reseñas_usuario` (`usuario_id`),
  KEY `idx_reseñas_producto` (`producto_id`),
  KEY `idx_reseñas_pedido` (`pedido_id`),
  KEY `idx_reseñas_calificacion` (`calificacion`),
  KEY `idx_reseñas_activo` (`activo`),
  CONSTRAINT `fk_reseñas_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reseñas_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reseñas_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reseñas de productos';

-- =====================================================
-- 9. TABLA DE CUPONES DE DESCUENTO
-- =====================================================
DROP TABLE IF EXISTS `cupones`;
CREATE TABLE `cupones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL COMMENT 'Código del cupón',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción del cupón',
  `tipo` enum('porcentaje','fijo') NOT NULL DEFAULT 'porcentaje' COMMENT 'Tipo de descuento',
  `valor` decimal(10,2) NOT NULL COMMENT 'Valor del descuento',
  `monto_minimo` decimal(10,2) DEFAULT NULL COMMENT 'Monto mínimo para aplicar',
  `monto_maximo` decimal(10,2) DEFAULT NULL COMMENT 'Monto máximo de descuento',
  `usos_maximos` int(11) DEFAULT NULL COMMENT 'Número máximo de usos',
  `usos_actuales` int(11) DEFAULT 0 COMMENT 'Número de usos actuales',
  `fecha_inicio` datetime NOT NULL COMMENT 'Fecha de inicio del cupón',
  `fecha_fin` datetime NOT NULL COMMENT 'Fecha de fin del cupón',
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Estado del cupón',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_cupones_activo` (`activo`),
  KEY `idx_cupones_fechas` (`fecha_inicio`, `fecha_fin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cupones de descuento';

-- =====================================================
-- 10. TABLA DE USO DE CUPONES
-- =====================================================
DROP TABLE IF EXISTS `cupon_usos`;
CREATE TABLE `cupon_usos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cupon_id` int(11) NOT NULL COMMENT 'ID del cupón',
  `usuario_id` int(11) NOT NULL COMMENT 'ID del usuario',
  `pedido_id` int(11) NOT NULL COMMENT 'ID del pedido',
  `descuento_aplicado` decimal(10,2) NOT NULL COMMENT 'Descuento aplicado',
  `fecha_uso` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de uso',
  PRIMARY KEY (`id`),
  KEY `idx_cupon_usos_cupon` (`cupon_id`),
  KEY `idx_cupon_usos_usuario` (`usuario_id`),
  KEY `idx_cupon_usos_pedido` (`pedido_id`),
  CONSTRAINT `fk_cupon_usos_cupon` FOREIGN KEY (`cupon_id`) REFERENCES `cupones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cupon_usos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cupon_usos_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de uso de cupones';

-- =====================================================
-- 11. TABLA DE CONFIGURACIONES DEL SISTEMA
-- =====================================================
DROP TABLE IF EXISTS `configuraciones`;
CREATE TABLE `configuraciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) NOT NULL COMMENT 'Clave de configuración',
  `valor` text DEFAULT NULL COMMENT 'Valor de configuración',
  `descripcion` text DEFAULT NULL COMMENT 'Descripción de la configuración',
  `tipo` enum('string','number','boolean','json') NOT NULL DEFAULT 'string' COMMENT 'Tipo de dato',
  `categoria` varchar(50) DEFAULT 'general' COMMENT 'Categoría de configuración',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha de actualización',
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave` (`clave`),
  KEY `idx_configuraciones_categoria` (`categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configuraciones del sistema';

-- =====================================================
-- 12. TABLA DE LOGS DEL SISTEMA
-- =====================================================
DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nivel` enum('DEBUG','INFO','WARNING','ERROR','CRITICAL') NOT NULL DEFAULT 'INFO' COMMENT 'Nivel del log',
  `mensaje` text NOT NULL COMMENT 'Mensaje del log',
  `contexto` json DEFAULT NULL COMMENT 'Contexto adicional en JSON',
  `usuario_id` int(11) DEFAULT NULL COMMENT 'ID del usuario relacionado',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'Dirección IP',
  `user_agent` text DEFAULT NULL COMMENT 'User Agent del navegador',
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  PRIMARY KEY (`id`),
  KEY `idx_logs_nivel` (`nivel`),
  KEY `idx_logs_usuario` (`usuario_id`),
  KEY `idx_logs_fecha` (`fecha_creacion`),
  CONSTRAINT `fk_logs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs del sistema';

-- =====================================================
-- INSERTAR DATOS INICIALES
-- =====================================================

-- Insertar usuario administrador
INSERT INTO `users` (`name`, `email`, `password_hash`, `telefono`, `es_admin`, `activo`) VALUES
('Administrador', 'admin@leopardo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+51 940-870-622', 1, 1);

-- Insertar categorías por defecto
INSERT INTO `categorias` (`nombre`, `descripcion`, `icono`, `activo`, `orden`) VALUES
('Calzado Dieléctrico', 'Calzado con puntera de Composite, aislamiento eléctrico y propiedades impermeables.', 'assets/images/icono-botas-dielectricas.png', 1, 1),
('Calzado de Seguridad', 'Calzado de seguridad industrial con puntera de acero, campera, suela bidensidad y refuerzos industriales.', 'assets/images/icono-calzado-seguridad.png', 1, 2),
('Trekking', 'Calzado de senderismo y montaña, con suela de caucho y entresuela EVA amortiguada.', 'assets/images/icono-antideslizante.png', 1, 3),
('Calzado Impermeable', 'Modelos resistentes al agua diseñados para ambientes húmedos y condiciones extremas.', 'assets/images/icono-impermeable.png', 1, 4),
('Línea Económica', 'Modelos de seguridad industrial más accesibles en precio, manteniendo estándares básicos de protección.', 'assets/images/icono-economico.png', 1, 5);

-- Insertar productos por defecto
INSERT INTO `productos` (
  codigo, nombre, descripcion, precio, categoria_id, imagen_principal, imagenes_adicionales, tipo, material, espesor_cuero, forro, puntera, impermeable, suela, plantilla, aislamiento, caracteristicas, activo, destacado
) VALUES
('LEO-PRO-001', 'Bota de Seguridad Industrial Leopardo Pro', 'Bota de seguridad con puntera de acero, suela antideslizante y resistente a aceites. Ideal para construcción e industria.', 89.90, 2, 'assets/images/calzado-seguridad-industria.jpg', '["assets/images/calzado-seguridad-industria.jpg"]', 'Industrial', 'Cuero', '2mm', 'Textil', 'Acero', 0, 'PU', 'EVA', 'Dieléctrico', '["antideslizante","puntera acero"]', 1, 1),
('LEO-CLASSIC-002', 'Zapato de Seguridad Leopardo Classic', 'Zapato de seguridad cómodo y resistente, perfecto para uso diario en ambientes industriales.', 69.90, 2, 'assets/images/calzados-industrial.jpg', '["assets/images/calzados-industrial.jpg"]', 'Industrial', 'Cuero', '1.8mm', 'Textil', 'Acero', 0, 'PU', 'EVA', 'N/A', '["antideslizante"]', 1, 1),
('LEO-ELECTRIC-003', 'Bota Dieléctrica Leopardo Electric', 'Bota especializada para trabajos eléctricos, con aislamiento dieléctrico certificado.', 129.90, 1, 'assets/images/calzados-seguridad.jpg', '["assets/images/calzados-seguridad.jpg"]', 'Dieléctrico', 'Cuero', '2.2mm', 'Textil', 'Acero', 1, 'PU', 'EVA', 'Dieléctrico', '["aislamiento","puntera acero"]', 1, 1);

-- Insertar stock por tallas para productos de ejemplo
INSERT INTO `producto_tallas_stock` (`producto_id`, `talla`, `stock`) VALUES
(1, '38', 10), (1, '39', 15), (1, '40', 20), (1, '41', 18), (1, '42', 12), (1, '43', 8), (1, '44', 5),
(2, '38', 8), (2, '39', 12), (2, '40', 16), (2, '41', 14), (2, '42', 10), (2, '43', 6), (2, '44', 4),
(3, '38', 6), (3, '39', 10), (3, '40', 14), (3, '41', 12), (3, '42', 8), (3, '43', 5), (3, '44', 3);

-- Insertar configuraciones del sistema
INSERT INTO `configuraciones` (`clave`, `valor`, `descripcion`, `tipo`, `categoria`) VALUES
('app_name', 'Leopardo E-commerce', 'Nombre de la aplicación', 'string', 'general'),
('app_version', '1.0.0', 'Versión de la aplicación', 'string', 'general'),
('currency', 'PEN', 'Moneda por defecto', 'string', 'general'),
('currency_symbol', 'S/', 'Símbolo de la moneda', 'string', 'general'),
('items_per_page', '12', 'Productos por página', 'number', 'paginacion'),
('max_upload_size', '5242880', 'Tamaño máximo de archivo en bytes (5MB)', 'number', 'uploads'),
('email_notifications', 'true', 'Habilitar notificaciones por email', 'boolean', 'notifications'),
('maintenance_mode', 'false', 'Modo de mantenimiento', 'boolean', 'system');

-- Insertar cupones de ejemplo
INSERT INTO `cupones` (`codigo`, `descripcion`, `tipo`, `valor`, `monto_minimo`, `usos_maximos`, `fecha_inicio`, `fecha_fin`, `activo`) VALUES
('BIENVENIDA10', 'Descuento de bienvenida del 10%', 'porcentaje', 10.00, 50.00, 100, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1),
('ENVIO_GRATIS', 'Envío gratis en compras mayores a S/ 100', 'fijo', 15.00, 100.00, 1000, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 1);

-- =====================================================
-- CREAR ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX `idx_productos_categoria_activo` ON `productos` (`categoria_id`, `activo`);
CREATE INDEX `idx_productos_destacado_activo` ON `productos` (`destacado`, `activo`);
CREATE INDEX `idx_pedidos_usuario_estado` ON `pedidos` (`usuario_id`, `estado`);
CREATE INDEX `idx_pedidos_fecha_estado` ON `pedidos` (`fecha_pedido`, `estado`);

-- =====================================================
-- CREAR VISTAS PARA CONSULTAS FRECUENTES
-- =====================================================

-- Vista de productos con información de categoría
CREATE VIEW `vista_productos_completa` AS
SELECT 
    p.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.precio_anterior,
    p.stock,
    p.imagen_principal,
    p.activo,
    p.destacado,
    p.nuevo,
    p.oferta,
    p.codigo_sku,
    p.marca,
    c.nombre as categoria_nombre,
    c.icono as categoria_icono,
    p.fecha_creacion,
    p.fecha_actualizacion
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.activo = 1;

-- Vista de pedidos con información del usuario
CREATE VIEW `vista_pedidos_completa` AS
SELECT 
    ped.id,
    ped.numero_pedido,
    ped.total,
    ped.estado,
    ped.estado_pago,
    ped.fecha_pedido,
    u.name as usuario_nombre,
    u.email as usuario_email,
    u.telefono as usuario_telefono
FROM pedidos ped
LEFT JOIN users u ON ped.usuario_id = u.id;

-- Vista de estadísticas de productos
CREATE VIEW `vista_estadisticas_productos` AS
SELECT 
    c.id as categoria_id,
    c.nombre as categoria_nombre,
    COUNT(p.id) as total_productos,
    COUNT(CASE WHEN p.activo = 1 THEN 1 END) as productos_activos,
    COUNT(CASE WHEN p.destacado = 1 THEN 1 END) as productos_destacados,
    AVG(p.precio) as precio_promedio,
    SUM(p.stock) as stock_total
FROM categorias c
LEFT JOIN productos p ON c.id = p.categoria_id
GROUP BY c.id, c.nombre;

-- =====================================================
-- CREAR PROCEDIMIENTOS ALMACENADOS
-- =====================================================
/*
DELIMITER //

-- Procedimiento para generar número de pedido único
CREATE PROCEDURE `GenerarNumeroPedido`(IN pedido_id INT)
BEGIN
    DECLARE numero_pedido VARCHAR(20);
    DECLARE contador INT DEFAULT 1;
    
    REPEAT
        SET numero_pedido = CONCAT('LEO-', YEAR(NOW()), '-', LPAD(contador, 6, '0'));
        SET contador = contador + 1;
    UNTIL NOT EXISTS (SELECT 1 FROM pedidos WHERE numero_pedido = numero_pedido) END REPEAT;
    
    UPDATE pedidos SET numero_pedido = numero_pedido WHERE id = pedido_id;
END //

-- Procedimiento para actualizar stock después de un pedido
CREATE PROCEDURE `ActualizarStockPedido`(IN pedido_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE producto_id INT;
    DECLARE cantidad INT;
    
    DECLARE cur CURSOR FOR 
        SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = pedido_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO producto_id, cantidad;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        UPDATE productos SET stock = stock - cantidad WHERE id = producto_id;
    END LOOP;
    
    CLOSE cur;
END //

DELIMITER ;

-- =====================================================
-- CREAR TRIGGERS
-- =====================================================

-- Trigger para generar número de pedido automáticamente
DELIMITER //
CREATE TRIGGER `tr_generar_numero_pedido` 
AFTER INSERT ON `pedidos`
FOR EACH ROW
BEGIN
    CALL GenerarNumeroPedido(NEW.id);
END //
DELIMITER ;

-- Trigger para actualizar fecha de actualización en productos
DELIMITER //
CREATE TRIGGER `tr_productos_actualizacion` 
BEFORE UPDATE ON `productos`
FOR EACH ROW
BEGIN
    SET NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
END //
DELIMITER ;
*/

-- =====================================================
-- FINALIZAR TRANSACCIÓN
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- =====================================================
-- VERIFICAR INSTALACIÓN
-- =====================================================

-- Mostrar resumen de tablas creadas
SELECT 
    TABLE_NAME as 'Tabla',
    TABLE_ROWS as 'Filas',
    DATA_LENGTH as 'Tamaño (bytes)',
    TABLE_COMMENT as 'Descripción'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
ORDER BY TABLE_NAME;

-- Mostrar resumen de vistas creadas
SELECT 
    TABLE_NAME as 'Vista',
    VIEW_DEFINITION as 'Definición'
FROM information_schema.VIEWS 
WHERE TABLE_SCHEMA = DATABASE();

-- Mostrar resumen de procedimientos creados
SELECT 
    ROUTINE_NAME as 'Procedimiento',
    ROUTINE_DEFINITION as 'Definición'
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_TYPE = 'PROCEDURE';

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================

-- Mensaje de finalización
SELECT 'Script de migración de MongoDB a MySQL completado exitosamente' as 'Estado';
