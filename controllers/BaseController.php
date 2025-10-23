<?php
/**
 * Controlador base para todos los controladores
 */

require_once __DIR__ . '/../config/config.php';

abstract class BaseController {
    
    /**
     * Enviar respuesta JSON
     */
    protected function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    /**
     * Enviar respuesta de error
     */
    protected function errorResponse($message, $statusCode = 400, $details = null) {
        $response = ['error' => $message];
        if ($details) {
            $response['details'] = $details;
        }
        $this->jsonResponse($response, $statusCode);
    }
    
    /**
     * Enviar respuesta de éxito
     */
    protected function successResponse($message, $data = null, $statusCode = 200) {
        $response = ['message' => $message];
        if ($data !== null) {
            $response['data'] = $data;
        }
        $this->jsonResponse($response, $statusCode);
    }
    
    /**
     * Obtener datos JSON del request
     */
    protected function getJsonInput() {
        $input = file_get_contents('php://input');
        
        // Log para debugging
        error_log('BASE_CONTROLLER_INPUT: ' . $input);
        error_log('BASE_CONTROLLER_INPUT_LENGTH: ' . strlen($input));
        
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('BASE_CONTROLLER_JSON_ERROR: ' . json_last_error_msg());
            $this->errorResponse('JSON inválido', 400);
        }
        
        error_log('BASE_CONTROLLER_PARSED_DATA: ' . json_encode($data));
        
        return $data;
    }
    
    /**
     * Validar campos requeridos
     */
    protected function validateRequired($data, $requiredFields) {
        $missing = [];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }
        
        if (!empty($missing)) {
            $this->errorResponse('Campos requeridos: ' . implode(', ', $missing), 400);
        }
    }
    
    /**
     * Obtener parámetros de la URL
     */
    protected function getUrlParams() {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path = str_replace('/leopardo_ecommerce_php/api/', '', $path);
        return explode('/', trim($path, '/'));
    }
    
    /**
     * Obtener parámetros de consulta
     */
    protected function getQueryParams() {
        return $_GET;
    }
    
    /**
     * Verificar si el usuario está autenticado
     */
    protected function requireAuth() {
        session_start();
        
        if (!isset($_SESSION['usuario_id'])) {
            $this->errorResponse('Usuario no autenticado', 401);
        }
        
        return $_SESSION['usuario_id'];
    }
    
    /**
     * Verificar si el usuario es administrador
     */
    protected function requireAdmin() {
        $usuarioId = $this->requireAuth();
        
        session_start();
        if (!isset($_SESSION['es_admin']) || !$_SESSION['es_admin']) {
            $this->errorResponse('Acceso denegado. Se requieren permisos de administrador', 403);
        }
        
        return $usuarioId;
    }

    /**
     * Obtener información del usuario actual autenticado
     */
    protected function getCurrentUser() {
        session_start();
        
        if (!isset($_SESSION['usuario_id'])) {
            $this->errorResponse('Usuario no autenticado', 401);
        }
        
        // Devolver información del usuario de la sesión
        return [
            'id' => $_SESSION['usuario_id'],
            'name' => $_SESSION['nombre'] ?? null,
            'email' => $_SESSION['email'] ?? null,
            'es_admin' => $_SESSION['es_admin'] ?? false,
            'telefono' => $_SESSION['telefono'] ?? null,
            'direccion' => $_SESSION['direccion'] ?? null
        ];
    }

    /**
     * Sanitizar entrada de datos
     */
    protected function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([$this, 'sanitizeInput'], $data);
        }
        
        return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Validar email
     */
    protected function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Validar número
     */
    protected function validateNumber($number, $min = null, $max = null) {
        if (!is_numeric($number)) {
            return false;
        }
        
        $number = (float)$number;
        
        if ($min !== null && $number < $min) {
            return false;
        }
        
        if ($max !== null && $number > $max) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Generar token CSRF
     */
    protected function generateCSRFToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        return $token;
    }
    
    /**
     * Verificar token CSRF
     */
    protected function verifyCSRFToken($token) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Log de errores
     */
    protected function logError($message, $context = []) {
        // Archivo de log en la raíz del proyecto
        $logFile = __DIR__ . '/../error_log.txt';
        
        $logMessage = date('Y-m-d H:i:s') . ' - ERROR - ' . $message;
        if (!empty($context)) {
            $logMessage .= ' - Context: ' . json_encode($context, JSON_UNESCAPED_UNICODE);
        }
        $logMessage .= PHP_EOL;
        
        // Escribir al archivo de log personalizado
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
        
        // También al log del sistema por si acaso
        error_log($logMessage);
    }
    
    /**
     * Log de información general
     */
    protected function logInfo($message, $context = []) {
        // Archivo de log en la raíz del proyecto
        $logFile = __DIR__ . '/../app_log.txt';
        
        $logMessage = date('Y-m-d H:i:s') . ' - INFO - ' . $message;
        if (!empty($context)) {
            $logMessage .= ' - Context: ' . json_encode($context, JSON_UNESCAPED_UNICODE);
        }
        $logMessage .= PHP_EOL;
        
        // Escribir al archivo de log personalizado
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Manejar excepciones
     */
    protected function handleException($e) {
        // Log detallado del error
        $errorDetails = [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'N/A',
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'N/A',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'N/A',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'N/A'
        ];
        
        $this->logError('EXCEPTION_CAUGHT: ' . $e->getMessage(), $errorDetails);
        
        // En desarrollo, mostrar más detalles
        if (defined('DEBUG') && DEBUG === true) {
            $this->errorResponse('Error interno del servidor', 500, [
                'debug_message' => $e->getMessage(),
                'debug_file' => basename($e->getFile()),
                'debug_line' => $e->getLine()
            ]);
        } else {
            $this->errorResponse('Error interno del servidor', 500);
        }
    }
}
?>

