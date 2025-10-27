<?php
/**
 * Configuración de la base de datos y constantes del sistema
 */

// ================================
// 🔹 Configuración de la base de datos MySQL
// ================================
define('DB_HOST', 'localhost');   // En cPanel casi siempre es localhost
define('DB_NAME', 'tcnsite_bdleo');
define('DB_USER', 'tcnsite_usuleo');
define('DB_PASS', 'jZ*Gl5|;EQL:M_Fg');
define('DB_CHARSET', 'utf8mb4');

// ================================
// 🔹 Configuración de la aplicación
// ================================
define('APP_NAME', 'Leopardo E-commerce');
define('APP_VERSION', '1.0.0');
define('APP_URL', 'https://calzadoindustrialleopardo.com');

// ================================
// 🔹 Configuración de sesiones
// ================================
define('SESSION_NAME', 'LEOPARDO_SESSION');
define('SESSION_LIFETIME', 3600); // 1 hora

// ================================
// 🔹 Configuración de seguridad
// ================================
define('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT');
define('PASSWORD_SALT', 'leopardo_salt_2024');

// ================================
// 🔹 Configuración de archivos
// ================================
define('UPLOAD_PATH', __DIR__ . '/../assets/uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB

// ================================
// 🔹 Configuración de paginación
// ================================
define('ITEMS_PER_PAGE', 12);

// ================================
// 🔹 Configuración de correo (SMTP)
// ================================
// Si usas correo corporativo (ej: ventas@tusitio.com), cámbialo aquí
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', '');
define('SMTP_PASS', '');

// ================================
// 🔹 Configuración de moneda
// ================================
define('CURRENCY', 'PEN');
if (!defined('CURRENCY_SYMBOL')) {
    define('CURRENCY_SYMBOL', 'S/');
}
// ================================
// 🔹 Estados de pedidos
// ================================
define('PEDIDO_ESTADOS', [
    'pendiente'   => 'Pendiente',
    'procesando'  => 'Procesando',
    'enviado'     => 'Enviado',
    'entregado'   => 'Entregado',
    'cancelado'   => 'Cancelado'
]);

// ================================
// 🔹 Configuración de errores
// ================================
define('DEVELOPMENT', false); // 🚨 ponlo en true si quieres depurar
if (DEVELOPMENT) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// ================================
// 🔹 Zona horaria
// ================================
date_default_timezone_set('America/Lima');

// ================================
// 🔹 Configuración de CORS
// ================================
// Mantiene compatibilidad con AJAX, pero sin forzar JSON en todo
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>

