<?php
/**
 * Script de instalación automatizada de la base de datos
 * Leopardo E-commerce - Migración MongoDB a MySQL
 */

// Configurar manejo de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Instalación de Base de Datos - Leopardo E-commerce</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .step { margin: 20px 0; padding: 20px; border-left: 4px solid #007cba; background: #f9f9f9; }
        .success { color: #28a745; border-left-color: #28a745; }
        .error { color: #dc3545; border-left-color: #dc3545; }
        .warning { color: #ffc107; border-left-color: #ffc107; }
        .info { color: #17a2b8; border-left-color: #17a2b8; }
        .code { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; margin: 10px 0; }
        .btn { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; margin: 5px; }
        .btn:hover { background: #0056b3; }
        .btn-success { background: #28a745; }
        .btn-danger { background: #dc3545; }
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .progress { width: 100%; background: #e9ecef; border-radius: 5px; margin: 10px 0; }
        .progress-bar { height: 20px; background: #007cba; border-radius: 5px; transition: width 0.3s; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #007cba; }
        .stat-label { color: #6c757d; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🦁 Instalación de Base de Datos</h1>
            <p>Migración de MongoDB a MySQL - Leopardo E-commerce</p>
        </div>";

try {
    // Paso 1: Verificar configuración
    echo "<div class='step'>";
    echo "<h3>Paso 1: Verificar configuración</h3>";
    
    if (!file_exists(__DIR__ . '/config/config.php')) {
        throw new Exception("Archivo de configuración no encontrado");
    }
    
    require_once __DIR__ . '/config/config.php';
    echo "<p class='success'>✓ Configuración cargada correctamente</p>";
    
    // Verificar extensiones PHP
    $requiredExtensions = ['pdo', 'pdo_mysql', 'json'];
    foreach ($requiredExtensions as $ext) {
        if (extension_loaded($ext)) {
            echo "<p class='success'>✓ Extensión {$ext} disponible</p>";
        } else {
            throw new Exception("Extensión {$ext} requerida");
        }
    }
    
    echo "</div>";
    
    // Paso 2: Conectar a MySQL
    echo "<div class='step'>";
    echo "<h3>Paso 2: Conectar a MySQL</h3>";
    
    try {
        $dsn = "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET;
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true
        ]);
        echo "<p class='success'>✓ Conexión a MySQL exitosa</p>";
    } catch (PDOException $e) {
        throw new Exception("Error de conexión: " . $e->getMessage());
    }
    
    echo "</div>";
    
    // Paso 3: Crear base de datos
    echo "<div class='step'>";
    echo "<h3>Paso 3: Crear base de datos</h3>";
    
    try {
        $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE " . DB_NAME);
        echo "<p class='success'>✓ Base de datos '" . DB_NAME . "' creada/seleccionada</p>";
    } catch (PDOException $e) {
        throw new Exception("Error al crear base de datos: " . $e->getMessage());
    }
    
    echo "</div>";
    
    // Paso 4: Ejecutar script de creación de tablas
    echo "<div class='step'>";
    echo "<h3>Paso 4: Crear tablas y estructura</h3>";
    
    if (!file_exists(__DIR__ . '/database_schema.sql')) {
        throw new Exception("Archivo database_schema.sql no encontrado");
    }
    
    $sql = file_get_contents(__DIR__ . '/database_schema.sql');
    
    // Dividir el script en declaraciones individuales
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $totalStatements = count($statements);
    $executedStatements = 0;
    
    echo "<div class='progress'>";
    echo "<div class='progress-bar' style='width: 0%' id='progress'></div>";
    echo "</div>";
    echo "<p id='progress-text'>Ejecutando declaraciones SQL...</p>";
    
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        
        try {
            $pdo->exec($statement);
            $executedStatements++;
            
            $progress = ($executedStatements / $totalStatements) * 100;
            echo "<script>document.getElementById('progress').style.width = '{$progress}%';</script>";
            echo "<script>document.getElementById('progress-text').textContent = 'Ejecutando declaraciones SQL... ({$executedStatements}/{$totalStatements})';</script>";
            flush();
            
        } catch (PDOException $e) {
            // Ignorar errores de "tabla ya existe" y similares
            if (strpos($e->getMessage(), 'already exists') === false && 
                strpos($e->getMessage(), 'Duplicate') === false) {
                echo "<p class='warning'>⚠ Advertencia: " . $e->getMessage() . "</p>";
            }
        }
    }
    
    echo "<p class='success'>✓ Estructura de base de datos creada ({$executedStatements} declaraciones ejecutadas)</p>";
    echo "</div>";
    
    // Paso 5: Verificar tablas creadas
    echo "<div class='step'>";
    echo "<h3>Paso 5: Verificar instalación</h3>";
    
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "<p class='success'>✓ Tablas creadas: " . count($tables) . "</p>";
    
    echo "<div class='code'>";
    foreach ($tables as $table) {
        echo "• {$table}<br>";
    }
    echo "</div>";
    
    // Verificar datos iniciales
    $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $categoryCount = $pdo->query("SELECT COUNT(*) FROM categorias")->fetchColumn();
    $productCount = $pdo->query("SELECT COUNT(*) FROM productos")->fetchColumn();
    
    echo "<div class='stats'>";
    echo "<div class='stat-card'>";
    echo "<div class='stat-number'>{$userCount}</div>";
    echo "<div class='stat-label'>Usuarios</div>";
    echo "</div>";
    echo "<div class='stat-card'>";
    echo "<div class='stat-number'>{$categoryCount}</div>";
    echo "<div class='stat-label'>Categorías</div>";
    echo "</div>";
    echo "<div class='stat-card'>";
    echo "<div class='stat-number'>{$productCount}</div>";
    echo "<div class='stat-label'>Productos</div>";
    echo "</div>";
    echo "</div>";
    
    echo "</div>";
    
    // Paso 6: Verificar vistas y procedimientos
    echo "<div class='step'>";
    echo "<h3>Paso 6: Verificar vistas y procedimientos</h3>";
    
    $views = $pdo->query("SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = '" . DB_NAME . "'")->fetchAll(PDO::FETCH_COLUMN);
    $procedures = $pdo->query("SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = '" . DB_NAME . "' AND ROUTINE_TYPE = 'PROCEDURE'")->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<p class='success'>✓ Vistas creadas: " . count($views) . "</p>";
    echo "<p class='success'>✓ Procedimientos creados: " . count($procedures) . "</p>";
    
    echo "</div>";
    
    // Paso 7: Configurar permisos y optimizaciones
    echo "<div class='step'>";
    echo "<h3>Paso 7: Optimizaciones finales</h3>";
    
    // Analizar tablas
    $pdo->exec("ANALYZE TABLE users, categorias, productos, carrito, pedidos, detalle_pedidos");
    echo "<p class='success'>✓ Tablas analizadas para optimización</p>";
    
    // Verificar índices
    $indexes = $pdo->query("SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = '" . DB_NAME . "'")->fetchColumn();
    echo "<p class='success'>✓ Índices creados: {$indexes}</p>";
    
    echo "</div>";
    
    // Resumen final
    echo "<div class='step success'>";
    echo "<h3>✅ Instalación completada exitosamente</h3>";
    echo "<p>La base de datos ha sido migrada de MongoDB a MySQL correctamente.</p>";
    echo "<div class='code'>";
    echo "<strong>Credenciales de acceso:</strong><br>";
    echo "Email: admin@leopardo.com<br>";
    echo "Contraseña: admin123<br><br>";
    echo "<strong>URLs de acceso:</strong><br>";
    echo "• API: <a href='public/api/productos' target='_blank'>public/api/productos</a><br>";
    echo "• Test API: <a href='public/test_api.html' target='_blank'>public/test_api.html</a><br>";
    echo "• Aplicación: <a href='public/' target='_blank'>public/</a>";
    echo "</div>";
    echo "</div>";
    
    // Información adicional
    echo "<div class='step info'>";
    echo "<h3>📋 Información adicional</h3>";
    echo "<p><strong>Archivos creados:</strong></p>";
    echo "<ul>";
    echo "<li>database_schema.sql - Script completo de creación</li>";
    echo "<li>migration_scripts.sql - Scripts de migración y optimización</li>";
    echo "<li>MONGODB_TO_MYSQL_MAPPING.md - Documentación de migración</li>";
    echo "</ul>";
    echo "<p><strong>Próximos pasos:</strong></p>";
    echo "<ul>";
    echo "<li>Configurar respaldos automáticos</li>";
    echo "<li>Programar tareas de mantenimiento</li>";
    echo "<li>Configurar monitoreo de rendimiento</li>";
    echo "<li>Probar todas las funcionalidades</li>";
    echo "</ul>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='step error'>";
    echo "<h3>❌ Error en la instalación</h3>";
    echo "<p class='error'>" . $e->getMessage() . "</p>";
    echo "<p>Por favor, verifique la configuración y ejecute la instalación nuevamente.</p>";
    echo "</div>";
}

echo "</div></body></html>";
?>

