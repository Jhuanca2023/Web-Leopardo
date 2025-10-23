-- =====================================================
-- Scripts de Migración y Optimización
-- Leopardo E-commerce - MongoDB a MySQL
-- =====================================================

-- =====================================================
-- 1. SCRIPT DE MIGRACIÓN DE DATOS DESDE MONGODB
-- =====================================================

-- Este script asume que tienes datos exportados desde MongoDB
-- en formato JSON o CSV que necesitas importar a MySQL

-- Ejemplo de migración de usuarios desde JSON
-- (Requiere que los datos estén en formato compatible)

/*
-- Migrar usuarios desde archivo JSON
LOAD DATA INFILE '/path/to/users.json'
INTO TABLE users
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
(name, email, password_hash, telefono, direccion, es_admin, activo);
*/

-- =====================================================
-- 2. SCRIPT DE OPTIMIZACIÓN DE RENDIMIENTO
-- =====================================================

-- Analizar tablas para optimización
ANALYZE TABLE users, categorias, productos, carrito, pedidos, detalle_pedidos;

-- Optimizar tablas
OPTIMIZE TABLE users, categorias, productos, carrito, pedidos, detalle_pedidos;

-- =====================================================
-- 3. SCRIPT DE RESPALDO Y RESTAURACIÓN
-- =====================================================

-- Crear respaldo completo de la base de datos
-- mysqldump -u root -p leopardo_ecommerce > backup_leopardo_$(date +%Y%m%d_%H%M%S).sql

-- Restaurar desde respaldo
-- mysql -u root -p leopardo_ecommerce < backup_leopardo_20240101_120000.sql

-- =====================================================
-- 4. SCRIPT DE LIMPIEZA Y MANTENIMIENTO
-- =====================================================

-- Limpiar carritos antiguos (más de 30 días)
DELETE FROM carrito 
WHERE fecha_agregado < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Limpiar logs antiguos (más de 90 días)
DELETE FROM logs 
WHERE fecha_creacion < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Limpiar sesiones expiradas (si usas tabla de sesiones)
-- DELETE FROM sessions WHERE last_activity < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 1 DAY));

-- =====================================================
-- 5. SCRIPT DE ACTUALIZACIÓN DE ESTADÍSTICAS
-- =====================================================

-- Actualizar estadísticas de productos por categoría
UPDATE categorias c SET 
    orden = (
        SELECT COUNT(*) 
        FROM productos p 
        WHERE p.categoria_id = c.id AND p.activo = 1
    );

-- Actualizar contador de usos de cupones
UPDATE cupones c SET 
    usos_actuales = (
        SELECT COUNT(*) 
        FROM cupon_usos cu 
        WHERE cu.cupon_id = c.id
    );

-- =====================================================
-- 6. SCRIPT DE VALIDACIÓN DE INTEGRIDAD
-- =====================================================

-- Verificar integridad referencial
SELECT 'Verificando integridad referencial...' as 'Estado';

-- Productos sin categoría válida
SELECT 'Productos sin categoría válida:' as 'Error';
SELECT p.id, p.nombre, p.categoria_id 
FROM productos p 
LEFT JOIN categorias c ON p.categoria_id = c.id 
WHERE c.id IS NULL;

-- Carrito con productos inactivos
SELECT 'Carrito con productos inactivos:' as 'Error';
SELECT c.id, c.usuario_id, c.producto_id, p.nombre 
FROM carrito c 
LEFT JOIN productos p ON c.producto_id = p.id 
WHERE p.activo = 0 OR p.id IS NULL;

-- Pedidos sin usuario válido
SELECT 'Pedidos sin usuario válido:' as 'Error';
SELECT ped.id, ped.usuario_id, ped.numero_pedido 
FROM pedidos ped 
LEFT JOIN users u ON ped.usuario_id = u.id 
WHERE u.id IS NULL;

-- =====================================================
-- 7. SCRIPT DE CONFIGURACIÓN DE USUARIOS Y PERMISOS
-- =====================================================

-- Crear usuario para la aplicación
-- CREATE USER 'leopardo_app'@'localhost' IDENTIFIED BY 'password_seguro_123';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON leopardo_ecommerce.* TO 'leopardo_app'@'localhost';

-- Crear usuario para respaldos
-- CREATE USER 'leopardo_backup'@'localhost' IDENTIFIED BY 'backup_password_123';
-- GRANT SELECT, LOCK TABLES ON leopardo_ecommerce.* TO 'leopardo_backup'@'localhost';

-- Crear usuario para reportes (solo lectura)
-- CREATE USER 'leopardo_reports'@'localhost' IDENTIFIED BY 'reports_password_123';
-- GRANT SELECT ON leopardo_ecommerce.* TO 'leopardo_reports'@'localhost';

-- =====================================================
-- 8. SCRIPT DE CONFIGURACIÓN DE VARIABLES DE MYSQL
-- =====================================================

-- Configuraciones recomendadas para el rendimiento
-- (Estas deben configurarse en my.cnf o my.ini)

/*
[mysqld]
# Configuración de memoria
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_log_buffer_size = 16M

# Configuración de conexiones
max_connections = 100
max_connect_errors = 1000

# Configuración de consultas
query_cache_size = 32M
query_cache_type = 1
query_cache_limit = 2M

# Configuración de timeouts
wait_timeout = 28800
interactive_timeout = 28800

# Configuración de logs
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Configuración de charset
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
*/

-- =====================================================
-- 9. SCRIPT DE MONITOREO Y ALERTAS
-- =====================================================

-- Crear tabla para alertas del sistema
CREATE TABLE IF NOT EXISTS `alertas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('stock_bajo','error_sistema','pedido_pendiente','cupon_expirado') NOT NULL,
  `mensaje` text NOT NULL,
  `severidad` enum('baja','media','alta','critica') NOT NULL DEFAULT 'media',
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_alertas_tipo` (`tipo`),
  KEY `idx_alertas_leida` (`leida`),
  KEY `idx_alertas_fecha` (`fecha_creacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Procedimiento para verificar stock bajo
DELIMITER //
CREATE PROCEDURE `VerificarStockBajo`()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE producto_id INT;
    DECLARE producto_nombre VARCHAR(200);
    DECLARE stock_actual INT;
    DECLARE stock_minimo INT;
    
    DECLARE cur CURSOR FOR 
        SELECT id, nombre, stock, stock_minimo 
        FROM productos 
        WHERE activo = 1 AND stock <= stock_minimo;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO producto_id, producto_nombre, stock_actual, stock_minimo;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO alertas (tipo, mensaje, severidad) VALUES (
            'stock_bajo',
            CONCAT('Producto "', producto_nombre, '" tiene stock bajo: ', stock_actual, ' (mínimo: ', stock_minimo, ')'),
            CASE 
                WHEN stock_actual = 0 THEN 'critica'
                WHEN stock_actual <= (stock_minimo * 0.5) THEN 'alta'
                ELSE 'media'
            END
        );
    END LOOP;
    
    CLOSE cur;
END //
DELIMITER ;

-- =====================================================
-- 10. SCRIPT DE REPORTES Y ESTADÍSTICAS
-- =====================================================

-- Vista para reporte de ventas por mes
CREATE VIEW `vista_ventas_mensual` AS
SELECT 
    YEAR(fecha_pedido) as año,
    MONTH(fecha_pedido) as mes,
    COUNT(*) as total_pedidos,
    SUM(total) as total_ventas,
    AVG(total) as promedio_pedido,
    COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as pedidos_entregados,
    COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as pedidos_cancelados
FROM pedidos 
WHERE estado != 'cancelado'
GROUP BY YEAR(fecha_pedido), MONTH(fecha_pedido)
ORDER BY año DESC, mes DESC;

-- Vista para reporte de productos más vendidos
CREATE VIEW `vista_productos_mas_vendidos` AS
SELECT 
    p.id,
    p.nombre,
    p.codigo_sku,
    c.nombre as categoria,
    SUM(dp.cantidad) as total_vendido,
    SUM(dp.subtotal) as ingresos_totales,
    COUNT(DISTINCT dp.pedido_id) as total_pedidos
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN detalle_pedidos dp ON p.id = dp.producto_id
LEFT JOIN pedidos ped ON dp.pedido_id = ped.id
WHERE ped.estado = 'entregado'
GROUP BY p.id, p.nombre, p.codigo_sku, c.nombre
ORDER BY total_vendido DESC;

-- Vista para reporte de clientes
CREATE VIEW `vista_clientes_activos` AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.telefono,
    COUNT(ped.id) as total_pedidos,
    SUM(ped.total) as total_gastado,
    AVG(ped.total) as promedio_pedido,
    MAX(ped.fecha_pedido) as ultimo_pedido,
    MIN(ped.fecha_pedido) as primer_pedido
FROM users u
LEFT JOIN pedidos ped ON u.id = ped.usuario_id
WHERE u.es_admin = 0 AND ped.estado != 'cancelado'
GROUP BY u.id, u.name, u.email, u.telefono
ORDER BY total_gastado DESC;

-- =====================================================
-- 11. SCRIPT DE ACTUALIZACIÓN DE PRECIOS
-- =====================================================

-- Procedimiento para actualizar precios con inflación
DELIMITER //
CREATE PROCEDURE `ActualizarPreciosInflacion`(IN porcentaje DECIMAL(5,2))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Guardar precios anteriores
    UPDATE productos 
    SET precio_anterior = precio 
    WHERE precio_anterior IS NULL;
    
    -- Aplicar inflación
    UPDATE productos 
    SET precio = ROUND(precio * (1 + porcentaje / 100), 2)
    WHERE activo = 1;
    
    -- Registrar en logs
    INSERT INTO logs (nivel, mensaje, contexto) VALUES (
        'INFO',
        'Actualización de precios por inflación',
        JSON_OBJECT('porcentaje', porcentaje, 'fecha', NOW())
    );
    
    COMMIT;
END //
DELIMITER ;

-- =====================================================
-- 12. SCRIPT DE LIMPIEZA DE DATOS DE PRUEBA
-- =====================================================

-- Eliminar datos de prueba (usar con precaución)
/*
-- Eliminar pedidos de prueba
DELETE FROM detalle_pedidos WHERE pedido_id IN (
    SELECT id FROM pedidos WHERE usuario_id IN (
        SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%prueba%'
    )
);

DELETE FROM pedidos WHERE usuario_id IN (
    SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%prueba%'
);

-- Eliminar carritos de prueba
DELETE FROM carrito WHERE usuario_id IN (
    SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%prueba%'
);

-- Eliminar usuarios de prueba
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%prueba%';
*/

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

-- Mostrar resumen final
SELECT 'Scripts de migración y optimización completados' as 'Estado';

-- Mostrar estadísticas finales
SELECT 
    'Estadísticas de la base de datos:' as 'Información',
    (SELECT COUNT(*) FROM users) as 'Total Usuarios',
    (SELECT COUNT(*) FROM categorias) as 'Total Categorías',
    (SELECT COUNT(*) FROM productos) as 'Total Productos',
    (SELECT COUNT(*) FROM pedidos) as 'Total Pedidos',
    (SELECT COUNT(*) FROM carrito) as 'Items en Carrito';

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
INSTRUCCIONES PARA USAR ESTOS SCRIPTS:

1. Ejecutar database_schema.sql primero para crear la estructura
2. Ejecutar migration_scripts.sql para optimizaciones y mantenimiento
3. Configurar usuarios y permisos según necesidades
4. Programar tareas de mantenimiento (cron jobs):
   - VerificarStockBajo() - diariamente
   - Limpieza de logs - semanalmente
   - Optimización de tablas - mensualmente

COMANDOS ÚTILES:

# Respaldar base de datos
mysqldump -u root -p leopardo_ecommerce > backup_$(date +%Y%m%d).sql

# Restaurar base de datos
mysql -u root -p leopardo_ecommerce < backup_20240101.sql

# Verificar estado de tablas
mysqlcheck -u root -p --check leopardo_ecommerce

# Optimizar tablas
mysqlcheck -u root -p --optimize leopardo_ecommerce

# Ver logs de MySQL
tail -f /var/log/mysql/error.log
tail -f /var/log/mysql/slow.log
*/
