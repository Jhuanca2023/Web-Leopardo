<?php
/**
 * Script de instalación para Leopardo E-commerce PHP
 */

// Configurar manejo de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Instalación - Leopardo E-commerce</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .step { margin: 20px 0; padding: 20px; border-left: 4px solid #007cba; background: #f9f9f9; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; }
        .btn { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🦁 Instalación de Leopardo E-commerce</h1>
            <p>Configuración inicial del sistema</p>
        </div>";

try {
    echo "<div class='step'>";
    echo "<h3>Paso 1: Verificar configuración de PHP</h3>";
    
    // Verificar versión de PHP
    if (version_compare(PHP_VERSION, '7.4.0', '>=')) {
        echo "<p class='success'>✓ PHP " . PHP_VERSION . " - Compatible</p>";
    } else {
        echo "<p class='error'>✗ PHP " . PHP_VERSION . " - Se requiere PHP 7.4 o superior</p>";
        throw new Exception("Versión de PHP incompatible");
    }
    
    // Verificar extensiones requeridas
    $requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'session'];
    foreach ($requiredExtensions as $ext) {
        if (extension_loaded($ext)) {
            echo "<p class='success'>✓ Extensión {$ext} - Disponible</p>";
        } else {
            echo "<p class='error'>✗ Extensión {$ext} - No disponible</p>";
            throw new Exception("Extensión {$ext} requerida");
        }
    }
    
    echo "</div>";
    
    echo "<div class='step'>";
    echo "<h3>Paso 2: Configurar base de datos</h3>";
    
    // Incluir configuración
    require_once __DIR__ . '/config/config.php';
    require_once __DIR__ . '/config/database.php';
    
    echo "<p class='info'>Configuración de base de datos:</p>";
    echo "<div class='code'>";
    echo "Host: " . DB_HOST . "<br>";
    echo "Base de datos: " . DB_NAME . "<br>";
    echo "Usuario: " . DB_USER . "<br>";
    echo "Charset: " . DB_CHARSET;
    echo "</div>";
    
    // Probar conexión
    try {
        $db = Database::getInstance();
        echo "<p class='success'>✓ Conexión a base de datos exitosa</p>";
    } catch (Exception $e) {
        echo "<p class='error'>✗ Error de conexión: " . $e->getMessage() . "</p>";
        echo "<p class='warning'>Asegúrese de que:</p>";
        echo "<ul>";
        echo "<li>MySQL esté ejecutándose</li>";
        echo "<li>La base de datos '" . DB_NAME . "' exista</li>";
        echo "<li>El usuario '" . DB_USER . "' tenga permisos</li>";
        echo "<li>Las credenciales en config/config.php sean correctas</li>";
        echo "</ul>";
        throw $e;
    }
    
    echo "</div>";
    
    echo "<div class='step'>";
    echo "<h3>Paso 3: Crear tablas de base de datos</h3>";
    
    try {
        $db->createTables();
        echo "<p class='success'>✓ Tablas creadas exitosamente</p>";
    } catch (Exception $e) {
        echo "<p class='error'>✗ Error al crear tablas: " . $e->getMessage() . "</p>";
        throw $e;
    }
    
    echo "</div>";
    
    echo "<div class='step'>";
    echo "<h3>Paso 4: Insertar datos iniciales</h3>";
    
    try {
        $db->insertInitialData();
        echo "<p class='success'>✓ Datos iniciales insertados</p>";
        echo "<p class='info'>Usuario administrador creado:</p>";
        echo "<div class='code'>Email: admin@leopardo.com<br>Contraseña: admin123</div>";
    } catch (Exception $e) {
        echo "<p class='error'>✗ Error al insertar datos: " . $e->getMessage() . "</p>";
        throw $e;
    }
    
    echo "</div>";
    
    echo "<div class='step'>";
    echo "<h3>Paso 5: Verificar permisos de archivos</h3>";
    
    $directories = [
        'assets/uploads' => 'Para subir imágenes de productos',
        'config' => 'Para archivos de configuración'
    ];
    
    foreach ($directories as $dir => $description) {
        $fullPath = __DIR__ . '/' . $dir;
        if (!is_dir($fullPath)) {
            if (mkdir($fullPath, 0755, true)) {
                echo "<p class='success'>✓ Directorio {$dir} creado</p>";
            } else {
                echo "<p class='error'>✗ No se pudo crear el directorio {$dir}</p>";
            }
        } else {
            echo "<p class='success'>✓ Directorio {$dir} existe</p>";
        }
    }
    
    echo "</div>";
    
    echo "<div class='step'>";
    echo "<h3>Paso 6: Configuración del servidor web</h3>";
    echo "<p class='info'>Para usar la aplicación, configure su servidor web para apuntar al directorio 'public':</p>";
    echo "<div class='code'>";
    echo "DocumentRoot: " . __DIR__ . "/public<br>";
    echo "URL: http://localhost/leopardo_ecommerce_php/public/";
    echo "</div>";
    echo "</div>";
    
    echo "<div class='step'>";
    echo "<h3>✅ Instalación completada</h3>";
    echo "<p class='success'>El sistema ha sido instalado correctamente.</p>";
    echo "<p>Puede acceder a la aplicación en: <a href='public/' class='btn'>Ir a la aplicación</a></p>";
    echo "<p>O probar la API directamente: <a href='public/api/productos' class='btn'>Ver API</a></p>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div class='step'>";
    echo "<h3 class='error'>❌ Error en la instalación</h3>";
    echo "<p class='error'>" . $e->getMessage() . "</p>";
    echo "<p>Por favor, corrija los errores y ejecute la instalación nuevamente.</p>";
    echo "</div>";
}

echo "</div></body></html>";
?>

