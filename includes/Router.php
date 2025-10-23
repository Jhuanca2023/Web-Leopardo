<?php
/**
 * Router PHP similar a Express.js
 * Maneja las rutas de la aplicación de manera similar a Express
 */

class Router {
    private $routes = [];
    private $middlewares = [];
    private $basePath = '';
    
    public function __construct($basePath = '') {
        $this->basePath = $basePath;
    }
    
    /**
     * Agregar middleware
     */
    public function use($path, $middleware = null) {
        if ($middleware === null) {
            $middleware = $path;
            $path = '*';
        }
        
        $this->middlewares[] = [
            'path' => $path,
            'middleware' => $middleware
        ];
    }
    
    /**
     * Método GET
     */
    public function get($path, $handler) {
        $this->addRoute('GET', $path, $handler);
    }
    
    /**
     * Método POST
     */
    public function post($path, $handler) {
        $this->addRoute('POST', $path, $handler);
    }
    
    /**
     * Método PUT
     */
    public function put($path, $handler) {
        $this->addRoute('PUT', $path, $handler);
    }
    
    /**
     * Método DELETE
     */
    public function delete($path, $handler) {
        $this->addRoute('DELETE', $path, $handler);
    }
    
    /**
     * Método PATCH
     */
    public function patch($path, $handler) {
        $this->addRoute('PATCH', $path, $handler);
    }
    
    /**
     * Agregar ruta
     */
    private function addRoute($method, $path, $handler) {
        $fullPath = $this->basePath . $path;
        
        $this->routes[] = [
            'method' => $method,
            'path' => $fullPath,
            'pattern' => $this->pathToRegex($fullPath),
            'handler' => $handler,
            'params' => $this->extractParams($fullPath)
        ];
    }
    
    /**
     * Convertir path a regex
     */
    private function pathToRegex($path) {
        // Escapar caracteres especiales excepto : y *
        $pattern = preg_replace('/[\/]/', '\/', $path);
        
        // Convertir parámetros :param a regex
        $pattern = preg_replace('/:([a-zA-Z0-9_]+)/', '([a-zA-Z0-9_-]+)', $pattern);
        
        // Convertir wildcard * a regex
        $pattern = str_replace('*', '.*', $pattern);
        
        return '/^' . $pattern . '$/';
    }
    
    /**
     * Extraer parámetros del path
     */
    private function extractParams($path) {
        preg_match_all('/:([a-zA-Z0-9_]+)/', $path, $matches);
        return $matches[1];
    }
    
    /**
     * Manejar request
     */
    public function handle($requestUri, $method = null) {
        if ($method === null) {
            $method = $_SERVER['REQUEST_METHOD'];
        }
        
        // Remover query string
        $path = parse_url($requestUri, PHP_URL_PATH);
        
        // Ejecutar middlewares
        foreach ($this->middlewares as $middleware) {
            if ($this->matchPath($middleware['path'], $path)) {
                $result = $this->executeMiddleware($middleware['middleware'], $path);
                if ($result === false) {
                    return false; // Middleware bloqueó la request
                }
            }
        }
        
        // Buscar ruta coincidente
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['pattern'], $path, $matches)) {
                // Extraer parámetros
                $params = [];
                for ($i = 1; $i < count($matches); $i++) {
                    if (isset($route['params'][$i - 1])) {
                        $params[$route['params'][$i - 1]] = $matches[$i];
                    }
                }
                
                // Ejecutar handler
                return $this->executeHandler($route['handler'], $params);
            }
        }
        
        // Ruta no encontrada
        http_response_code(404);
        echo json_encode(['error' => 'Ruta no encontrada']);
        return false;
    }
    
    /**
     * Verificar si el path coincide con el patrón
     */
    private function matchPath($pattern, $path) {
        if ($pattern === '*') {
            return true;
        }
        
        $regex = $this->pathToRegex($pattern);
        return preg_match($regex, $path);
    }
    
    /**
     * Ejecutar middleware
     */
    private function executeMiddleware($middleware, $path) {
        if (is_callable($middleware)) {
            return $middleware($path);
        } elseif (is_string($middleware)) {
            // Middleware como string (nombre de función)
            if (function_exists($middleware)) {
                return $middleware($path);
            }
        }
        
        return true;
    }
    
    /**
     * Ejecutar handler
     */
    private function executeHandler($handler, $params) {
        if (is_callable($handler)) {
            return $handler($params);
        } elseif (is_string($handler)) {
            // Handler como string (Controller@method)
            if (strpos($handler, '@') !== false) {
                list($controller, $method) = explode('@', $handler);
                
                if (class_exists($controller)) {
                    $instance = new $controller();
                    if (method_exists($instance, $method)) {
                        return $instance->$method($params);
                    }
                }
            } elseif (function_exists($handler)) {
                return $handler($params);
            }
        }
        
        http_response_code(500);
        echo json_encode(['error' => 'Handler no válido']);
        return false;
    }
    
    /**
     * Obtener todas las rutas registradas
     */
    public function getRoutes() {
        return $this->routes;
    }
    
    /**
     * Obtener middlewares registrados
     */
    public function getMiddlewares() {
        return $this->middlewares;
    }
}
?>
