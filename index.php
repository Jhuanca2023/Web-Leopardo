<?php
/**
 * Punto de entrada principal de la aplicación
 */

// Configurar manejo de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Incluir archivos de configuración
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';

// Inicializar base de datos y crear tablas si no existen
try {
    $db = Database::getInstance();
    $db->createTables();
    $db->insertInitialData();
} catch (Exception $e) {
    error_log("Error inicializando base de datos: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de configuración de base de datos']);
    exit();
}

// Obtener la ruta solicitada
$requestUri = $_SERVER['REQUEST_URI'];

// Remover el directorio base de la ruta

$path = parse_url($requestUri, PHP_URL_PATH); // Solo la ruta, sin query
$path = ltrim($path, '/'); // Quita solo la barra inicial

// Dividir la ruta en segmentos
$segments = explode('/', $path);

// Determinar si es una petición API
$isApiRequest = isset($segments[0]) && $segments[0] === 'api';

if ($isApiRequest) {
    // Usar el sistema de rutas similar a Express.js
    require_once __DIR__ . '/routes/app.php';
    
} else {
    // Servir archivos estáticos o la página principal
    $filePath = __DIR__ . '/' . $path;
    
    if ($path === '' || $path === 'index.html') {
        // Servir la página principal
        $indexPath = __DIR__ . '/index.html';
        if (file_exists($indexPath)) {
            readfile($indexPath);
        } else {
            // Crear una página HTML básica si no existe
            echo '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leopardo E-commerce</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .api-info { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .endpoint { margin: 10px 0; padding: 10px; background: white; border-left: 3px solid #007cba; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🦁 Leopardo E-commerce</h1>
            <p>API REST para tienda de calzado de seguridad</p>
        </div>
        
        <div class="api-info">
            <h2>Endpoints disponibles:</h2>
            
            <div class="endpoint">
                <strong>GET /api/productos</strong> - Obtener todos los productos
            </div>
            
            <div class="endpoint">
                <strong>GET /api/productos/{id}</strong> - Obtener producto por ID
            </div>
            
            <div class="endpoint">
                <strong>GET /api/categorias</strong> - Obtener todas las categorías
            </div>
            
            <div class="endpoint">
                <strong>POST /api/auth/login</strong> - Iniciar sesión
            </div>
            
            <div class="endpoint">
                <strong>POST /api/auth/register</strong> - Registrar usuario
            </div>
            
            <div class="endpoint">
                <strong>GET /api/carrito</strong> - Obtener carrito del usuario
            </div>
            
            <div class="endpoint">
                <strong>POST /api/carrito</strong> - Agregar producto al carrito
            </div>
            
            <div class="endpoint">
                <strong>POST /api/pedidos</strong> - Crear nuevo pedido
            </div>
            
            <p><em>Para más información, consulte la documentación de la API.</em></p>
        </div>
    </div>
</body>
</html>';
        }
    } elseif (file_exists($filePath) && is_file($filePath)) {
        // Servir archivo estático
        $mimeType = mime_content_type($filePath);
        header('Content-Type: ' . $mimeType);
        readfile($filePath);
    } else {
        // Archivo no encontrado
        http_response_code(404);
        echo json_encode(['error' => 'Archivo no encontrado']);
    }
}
?>


