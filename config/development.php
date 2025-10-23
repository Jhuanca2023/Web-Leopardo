<?php
/**
 * Configuración para entorno de desarrollo
 */

// Habilitar modo desarrollo
define('DEVELOPMENT', true);

// Configuración de errores para desarrollo
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');

// Configuración de base de datos para desarrollo
define('DB_HOST_DEV', 'localhost');
define('DB_NAME_DEV', 'leopardo_ecommerce_dev');
define('DB_USER_DEV', 'root');
define('DB_PASS_DEV', '');

// Configuración de la aplicación para desarrollo
define('APP_URL_DEV', 'http://localhost/leopardo_ecommerce_php/public');
define('DEBUG_MODE', true);

// Configuración de sesiones para desarrollo
ini_set('session.cookie_lifetime', 0);
ini_set('session.cookie_secure', 0);
ini_set('session.cookie_httponly', 1);

// Configuración de CORS para desarrollo
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Función para debug
function debug($data, $die = false) {
    if (DEBUG_MODE) {
        echo '<pre style="background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px; margin: 10px 0;">';
        print_r($data);
        echo '</pre>';
        
        if ($die) {
            die();
        }
    }
}

// Función para log personalizado
function logMessage($message, $level = 'INFO') {
    if (DEBUG_MODE) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] [{$level}] {$message}" . PHP_EOL;
        file_put_contents(__DIR__ . '/../logs/app.log', $logMessage, FILE_APPEND | LOCK_EX);
    }
}

// Crear directorio de logs si no existe
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

// Configuración de timezone
date_default_timezone_set('America/Lima');

// Configuración de memoria y tiempo de ejecución para desarrollo
ini_set('memory_limit', '256M');
ini_set('max_execution_time', 300);

// Configuración de uploads para desarrollo
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '10M');
ini_set('max_file_uploads', 20);

// Configuración de sesiones
ini_set('session.gc_maxlifetime', 3600);
ini_set('session.gc_probability', 1);
ini_set('session.gc_divisor', 100);

// Configuración de cookies
ini_set('session.cookie_samesite', 'Lax');

// Configuración de headers de seguridad para desarrollo
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Configuración de cache para desarrollo (deshabilitado)
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Función para mostrar información del sistema
function showSystemInfo() {
    if (DEBUG_MODE) {
        echo '<div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; font-size: 12px;">';
        echo '<strong>Información del Sistema:</strong><br>';
        echo 'PHP Version: ' . PHP_VERSION . '<br>';
        echo 'Server: ' . $_SERVER['SERVER_SOFTWARE'] . '<br>';
        echo 'Document Root: ' . $_SERVER['DOCUMENT_ROOT'] . '<br>';
        echo 'Script Name: ' . $_SERVER['SCRIPT_NAME'] . '<br>';
        echo 'Request URI: ' . $_SERVER['REQUEST_URI'] . '<br>';
        echo 'Request Method: ' . $_SERVER['REQUEST_METHOD'] . '<br>';
        echo 'Memory Usage: ' . memory_get_usage(true) / 1024 / 1024 . ' MB<br>';
        echo 'Peak Memory: ' . memory_get_peak_usage(true) / 1024 / 1024 . ' MB<br>';
        echo '</div>';
    }
}

// Función para mostrar queries SQL en desarrollo
function logQuery($sql, $params = []) {
    if (DEBUG_MODE) {
        $message = "SQL Query: {$sql}";
        if (!empty($params)) {
            $message .= " | Params: " . json_encode($params);
        }
        logMessage($message, 'SQL');
    }
}

// Función para medir tiempo de ejecución
$startTime = microtime(true);
function getExecutionTime() {
    global $startTime;
    return microtime(true) - $startTime;
}

// Mostrar tiempo de ejecución al final
register_shutdown_function(function() {
    if (DEBUG_MODE) {
        $executionTime = getExecutionTime();
        echo '<div style="position: fixed; bottom: 10px; right: 10px; background: #007cba; color: white; padding: 10px; border-radius: 5px; font-size: 12px;">';
        echo 'Tiempo de ejecución: ' . round($executionTime * 1000, 2) . 'ms';
        echo '</div>';
    }
});

// Configuración de base de datos para desarrollo
if (DEVELOPMENT) {
    // Sobrescribir configuración de base de datos si está en modo desarrollo
    if (!defined('DB_HOST')) {
        define('DB_HOST', DB_HOST_DEV);
        define('DB_NAME', DB_NAME_DEV);
        define('DB_USER', DB_USER_DEV);
        define('DB_PASS', DB_PASS_DEV);
    }
}

// Configuración de URL para desarrollo
if (DEVELOPMENT && !defined('APP_URL')) {
    define('APP_URL', APP_URL_DEV);
}
?>

