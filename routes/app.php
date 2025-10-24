<?php
/**
 * Archivo principal de rutas - Similar a app.js de Express
 * Define todas las rutas de la aplicación
 */

require_once __DIR__ . '/../includes/Router.php';
require_once __DIR__ . '/../controllers/BaseController.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/ProductoController.php';
require_once __DIR__ . '/../controllers/CategoriaController.php';
require_once __DIR__ . '/../controllers/CarritoController.php';
require_once __DIR__ . '/../controllers/PedidoController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/ReporteController.php';
require_once __DIR__ . '/../controllers/StatsController.php';
require_once __DIR__ . '/../controllers/ConfigController.php';

// Crear instancia del router
$app = new Router('/api');

// =====================================================
// MIDDLEWARES GLOBALES
// =====================================================

// Middleware de CORS
$app->use('*', function($path) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    
    // Manejar preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
    
    return true;
});

// Middleware de logging con más detalle
$app->use('*', function($path) {
    $logMessage = date('Y-m-d H:i:s') . ' - ' . $_SERVER['REQUEST_METHOD'] . ' ' . $path;
    
    // Log adicional para PUT requests
    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = file_get_contents('php://input');
        $logMessage .= ' - BODY_SIZE: ' . strlen($input) . ' bytes';
        if (strlen($input) < 1000) {
            $logMessage .= ' - BODY: ' . $input;
        }
    }
    
    error_log('ROUTING_LOG: ' . $logMessage);
    return true;
});

// Middleware de validación de JSON
$app->use('*', function($path) {
    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (strpos($contentType, 'application/json') !== false) {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'JSON inválido']);
                return false;
            }
        }
    }
    return true;
});

// =====================================================
// RUTAS DE AUTENTICACIÓN
// =====================================================

$app->post('/auth/register', 'AuthController@register');
$app->post('/auth/login', 'AuthController@login');
$app->post('/auth/logout', 'AuthController@logout');
$app->get('/auth/profile', 'AuthController@getProfile');
$app->put('/auth/profile', 'AuthController@updateProfile');
$app->get('/auth/check', 'AuthController@checkAuth');
$app->post('/auth/change-password', 'AuthController@changePassword');

// =====================================================
// RUTAS DE PRODUCTOS
// =====================================================

// Rutas específicas de productos
$app->get('/productos/categoria/:id', 'ProductoController@getByCategoria');
$app->get('/productos/destacados', 'ProductoController@getDestacados');
$app->get('/productos/promociones', 'ProductoController@getPromociones');
$app->get('/productos/buscar', 'ProductoController@search');
$app->get('/productos/stock-bajo', 'ProductoController@getLowStock');
$app->get('/productos/mas-vendidos', 'ProductoController@getBestSellers');
$app->get('/productos/estadisticas', 'ProductoController@getStats');

// Rutas de promociones (solo administradores)
$app->post('/productos/:id/promocion', 'ProductoController@setPrecioPromocional');
$app->delete('/productos/:id/promocion', 'ProductoController@removePrecioPromocional');

$app->get('/productos', 'ProductoController@getAll');
$app->get('/productos/all', 'ProductoController@getAllProducts');
$app->get('/productos/:id', 'ProductoController@getById');
$app->post('/productos', 'ProductoController@create');
$app->put('/productos/:id', 'ProductoController@update');
$app->delete('/productos/:id', 'ProductoController@delete');

// =====================================================
// RUTAS DE IMAGENES
// =====================================================

// Rutas específicas de imagenes
$app->post('/imagenes/eliminar', 'ProductoController@deleteImagen');
$app->post('/imagenes/subir', 'ProductoController@postImagen');


// =====================================================
// RUTAS DE CATEGORÍAS
// =====================================================

$app->get('/categorias', 'CategoriaController@getAll');
$app->get('/categorias/:id', 'CategoriaController@getById');
$app->post('/categorias', 'CategoriaController@create');
$app->put('/categorias/:id', 'CategoriaController@update');
$app->delete('/categorias/:id', 'CategoriaController@delete');

// Rutas específicas de categorías
$app->get('/categorias/buscar', 'CategoriaController@search');
$app->get('/categorias/con-conteo', 'CategoriaController@getWithProductCount');
$app->get('/categorias/estadisticas', 'CategoriaController@getStats');

// =====================================================
// RUTAS DE CARRITO
// =====================================================

$app->get('/carrito', 'CarritoController@getCart');
$app->post('/carrito', 'CarritoController@addProduct');
$app->put('/carrito/:id', 'CarritoController@updateQuantity');
$app->delete('/carrito/:id', 'CarritoController@removeItem');
$app->delete('/carrito', 'CarritoController@clearCart');

// Rutas específicas de carrito
$app->get('/carrito/validar', 'CarritoController@validateCart');
$app->get('/carrito/cantidad', 'CarritoController@getItemCount');
$app->get('/carrito/producto/:id', 'CarritoController@isInCart');
$app->get('/carrito/estadisticas', 'CarritoController@getStats');

// =====================================================
// RUTAS DE PEDIDOS
// =====================================================

$app->get('/pedidos', 'PedidoController@getUserOrders');
$app->get('/pedidos/:id', 'PedidoController@getById');
$app->post('/pedidos', 'PedidoController@create');
$app->put('/pedidos/:id/estado', 'PedidoController@updateStatus');
$app->post('/pedidos/:id/cancelar', 'PedidoController@cancel');

// Rutas de administración de pedidos
$app->get('/admin/pedidos', 'PedidoController@getAllOrders');
$app->get('/pedidos/recientes', 'PedidoController@getRecent');
$app->get('/pedidos/por-fecha', 'PedidoController@getByDateRange');
$app->get('/pedidos/estadisticas', 'PedidoController@getStats');

// =====================================================
// RUTAS DE USUARIOS (ADMIN)
// =====================================================

$app->get('/admin/users', 'UserController@getAll');
$app->get('/admin/users/:id', 'UserController@getById');
$app->post('/admin/users', 'UserController@create');
$app->put('/admin/users/:id', 'UserController@update');
$app->delete('/admin/users/:id', 'UserController@delete');
$app->get('/admin/users/estadisticas', 'UserController@getStats');

// =====================================================
// RUTAS DE PERFIL DE USUARIO
// =====================================================

$app->get('/users/:id', 'UserController@getProfile');
$app->put('/users/:id', 'UserController@updateProfile');
$app->put('/users/:id/password', 'UserController@changePassword');

// =====================================================
// RUTAS DE REPORTES (ADMIN)
// =====================================================

$app->get('/admin/reportes/ventas', 'ReporteController@getVentas');
$app->get('/admin/reportes/productos', 'ReporteController@getProductos');
$app->get('/admin/reportes/clientes', 'ReporteController@getClientes');
$app->get('/admin/reportes/inventario', 'ReporteController@getInventario');

// =====================================================
// RUTAS DE CONFIGURACIÓN (ADMIN)
// =====================================================

$app->get('/admin/config', 'ConfigController@getAll');
$app->put('/admin/config/:key', 'ConfigController@update');
$app->get('/admin/logs', 'LogController@getLogs');
$app->get('/admin/alertas', 'AlertaController@getAlertas');

// =====================================================
// RUTAS DE ARCHIVOS
// =====================================================

$app->post('/upload/imagen', 'UploadController@uploadImage');
$app->delete('/upload/imagen/:filename', 'UploadController@deleteImage');

// =====================================================
// RUTAS DE ESTADÍSTICAS GENERALES
// =====================================================

$app->get('/stats/dashboard', 'StatsController@getDashboard');
$app->get('/stats/ventas', 'StatsController@getVentas');
$app->get('/stats/productos', 'StatsController@getProductos');

// =====================================================
// RUTA DE SALUD DEL SISTEMA
// =====================================================

$app->get('/health', function($params) {
    return [
        'status' => 'ok',
        'timestamp' => date('Y-m-d H:i:s'),
        'version' => '1.0.0',
        'database' => 'connected'
    ];
});

// =====================================================
// RUTA DE LOGGING DE ERRORES
// =====================================================

$app->post('/errors', function($params) {
    try {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!$input || !isset($input['error'])) {
            return [
                'success' => false,
                'message' => 'Datos de error no válidos'
            ];
        }
        
        // Log del error en el archivo de log del servidor
        $logMessage = sprintf(
            "[%s] Frontend Error - Type: %s, Message: %s, URL: %s, User: %s\n",
            $input['timestamp'] ?? date('Y-m-d H:i:s'),
            $input['error']['type'] ?? 'unknown',
            $input['error']['message'] ?? 'No message',
            $input['url'] ?? 'Unknown URL',
            $input['userId'] ?? 'Anonymous'
        );
        
        error_log($logMessage, 3, __DIR__ . '/../error_log.txt');
        
        return [
            'success' => true,
            'message' => 'Error logged successfully'
        ];
        
    } catch (Exception $e) {
        error_log("Error logging frontend error: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Error al procesar el log'
        ];
    }
});

// =====================================================
// MANEJAR REQUEST
// =====================================================

// Obtener la URI de la request
$requestUri = $_SERVER['REQUEST_URI'];

// Remover el directorio base si existe
$scriptName = $_SERVER['SCRIPT_NAME'];
$basePath = dirname($scriptName);
if ($basePath !== '/') {
    $requestUri = str_replace($basePath, '', $requestUri);
}

// Manejar la request
$app->handle($requestUri);

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Función para obtener parámetros de la URL
 */
function getUrlParams() {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = str_replace('/leopardo_ecommerce_php/api/', '', $path);
    return explode('/', trim($path, '/'));
}

/**
 * Función para obtener parámetros de consulta
 */
function getQueryParams() {
    return $_GET;
}

/**
 * Función para obtener datos JSON del request
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON inválido']);
        exit();
    }
    
    return $data;
}

/**
 * Función para enviar respuesta JSON
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Función para enviar respuesta de error
 */
function errorResponse($message, $statusCode = 400, $details = null) {
    $response = ['error' => $message];
    if ($details) {
        $response['details'] = $details;
    }
    jsonResponse($response, $statusCode);
}

/**
 * Función para enviar respuesta de éxito
 */
function successResponse($message, $data = null, $statusCode = 200) {
    $response = ['message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    jsonResponse($response, $statusCode);
}
?>

