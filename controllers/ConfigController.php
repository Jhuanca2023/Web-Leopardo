<?php
/**
 * Controlador de Configuraciones (Administración)
 */

require_once __DIR__ . '/BaseController.php';

class ConfigController extends BaseController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Obtener todas las configuraciones
     */
    public function getAll() {
        try {
            $this->requireAdmin();
            
            $params = $this->getQueryParams();
            $categoria = $params['categoria'] ?? null;
            
            $sql = "SELECT * FROM configuraciones";
            $params_sql = [];
            
            if ($categoria) {
                $sql .= " WHERE categoria = ?";
                $params_sql[] = $categoria;
            }
            
            $sql .= " ORDER BY categoria, clave";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params_sql);
            $configs = $stmt->fetchAll();
            
            // Organizar por categorías
            $result = [];
            foreach ($configs as $config) {
                $result[$config['categoria']][] = [
                    'clave' => $config['clave'],
                    'valor' => $this->parseValue($config['valor'], $config['tipo']),
                    'descripcion' => $config['descripcion'],
                    'tipo' => $config['tipo']
                ];
            }
            
            $this->jsonResponse($result);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Actualizar configuración
     */
    public function update($params) {
        try {
            $this->requireAdmin();
            
            $clave = $params['key'] ?? null;
            if (!$clave) {
                $this->errorResponse('Clave de configuración requerida', 400);
            }
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            if (!isset($data['valor'])) {
                $this->errorResponse('Valor requerido', 400);
            }
            
            // Verificar que la configuración existe
            $stmt = $this->db->prepare("SELECT * FROM configuraciones WHERE clave = ?");
            $stmt->execute([$clave]);
            $config = $stmt->fetch();
            
            if (!$config) {
                $this->errorResponse('Configuración no encontrada', 404);
            }
            
            // Validar valor según el tipo
            $valor = $this->validateValue($data['valor'], $config['tipo']);
            
            // Actualizar configuración
            $stmt = $this->db->prepare("
                UPDATE configuraciones 
                SET valor = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
                WHERE clave = ?
            ");
            $success = $stmt->execute([$valor, $clave]);
            
            if (!$success) {
                $this->errorResponse('Error al actualizar la configuración', 500);
            }
            
            // Log del cambio
            $this->logConfigChange($clave, $config['valor'], $valor);
            
            $this->successResponse('Configuración actualizada correctamente', [
                'clave' => $clave,
                'valor' => $this->parseValue($valor, $config['tipo']),
                'tipo' => $config['tipo']
            ]);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener configuración específica
     */
    public function get($params) {
        try {
            $this->requireAdmin();
            
            $clave = $params['key'] ?? null;
            if (!$clave) {
                $this->errorResponse('Clave de configuración requerida', 400);
            }
            
            $stmt = $this->db->prepare("SELECT * FROM configuraciones WHERE clave = ?");
            $stmt->execute([$clave]);
            $config = $stmt->fetch();
            
            if (!$config) {
                $this->errorResponse('Configuración no encontrada', 404);
            }
            
            $result = [
                'clave' => $config['clave'],
                'valor' => $this->parseValue($config['valor'], $config['tipo']),
                'descripcion' => $config['descripcion'],
                'tipo' => $config['tipo'],
                'categoria' => $config['categoria'],
                'fecha_actualizacion' => $config['fecha_actualizacion']
            ];
            
            $this->jsonResponse($result);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Crear nueva configuración
     */
    public function create() {
        try {
            $this->requireAdmin();
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar campos requeridos
            $this->validateRequired($data, ['clave', 'valor', 'tipo']);
            
            // Verificar que la clave no existe
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM configuraciones WHERE clave = ?");
            $stmt->execute([$data['clave']]);
            if ($stmt->fetchColumn() > 0) {
                $this->errorResponse('La clave ya existe', 400);
            }
            
            // Validar valor según el tipo
            $valor = $this->validateValue($data['valor'], $data['tipo']);
            
            // Crear configuración
            $stmt = $this->db->prepare("
                INSERT INTO configuraciones (clave, valor, descripcion, tipo, categoria) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $success = $stmt->execute([
                $data['clave'],
                $valor,
                $data['descripcion'] ?? null,
                $data['tipo'],
                $data['categoria'] ?? 'general'
            ]);
            
            if (!$success) {
                $this->errorResponse('Error al crear la configuración', 500);
            }
            
            $this->successResponse('Configuración creada correctamente', [
                'clave' => $data['clave'],
                'valor' => $this->parseValue($valor, $data['tipo']),
                'tipo' => $data['tipo']
            ], 201);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Eliminar configuración
     */
    public function delete($params) {
        try {
            $this->requireAdmin();
            
            $clave = $params['key'] ?? null;
            if (!$clave) {
                $this->errorResponse('Clave de configuración requerida', 400);
            }
            
            // Verificar que la configuración existe
            $stmt = $this->db->prepare("SELECT * FROM configuraciones WHERE clave = ?");
            $stmt->execute([$clave]);
            $config = $stmt->fetch();
            
            if (!$config) {
                $this->errorResponse('Configuración no encontrada', 404);
            }
            
            // No permitir eliminar configuraciones críticas
            $configuracionesCriticas = [
                'app_name', 'app_version', 'currency', 'currency_symbol'
            ];
            
            if (in_array($clave, $configuracionesCriticas)) {
                $this->errorResponse('No se puede eliminar esta configuración crítica', 400);
            }
            
            // Eliminar configuración
            $stmt = $this->db->prepare("DELETE FROM configuraciones WHERE clave = ?");
            $success = $stmt->execute([$clave]);
            
            if (!$success) {
                $this->errorResponse('Error al eliminar la configuración', 500);
            }
            
            $this->successResponse('Configuración eliminada correctamente');
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener configuraciones por categoría
     */
    public function getByCategory($params) {
        try {
            $this->requireAdmin();
            
            $categoria = $params['category'] ?? null;
            if (!$categoria) {
                $this->errorResponse('Categoría requerida', 400);
            }
            
            $stmt = $this->db->prepare("
                SELECT * FROM configuraciones 
                WHERE categoria = ? 
                ORDER BY clave
            ");
            $stmt->execute([$categoria]);
            $configs = $stmt->fetchAll();
            
            $result = [];
            foreach ($configs as $config) {
                $result[] = [
                    'clave' => $config['clave'],
                    'valor' => $this->parseValue($config['valor'], $config['tipo']),
                    'descripcion' => $config['descripcion'],
                    'tipo' => $config['tipo']
                ];
            }
            
            $this->jsonResponse($result);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Validar valor según el tipo
     */
    private function validateValue($valor, $tipo) {
        switch ($tipo) {
            case 'number':
                if (!is_numeric($valor)) {
                    throw new Exception('El valor debe ser numérico');
                }
                return (string)$valor;
                
            case 'boolean':
                if (is_bool($valor)) {
                    return $valor ? 'true' : 'false';
                } elseif (is_string($valor)) {
                    $valor = strtolower($valor);
                    if (in_array($valor, ['true', '1', 'yes', 'on'])) {
                        return 'true';
                    } elseif (in_array($valor, ['false', '0', 'no', 'off'])) {
                        return 'false';
                    }
                }
                throw new Exception('El valor debe ser booleano');
                
            case 'json':
                if (is_array($valor) || is_object($valor)) {
                    $json = json_encode($valor);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        throw new Exception('JSON inválido');
                    }
                    return $json;
                } elseif (is_string($valor)) {
                    json_decode($valor);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        throw new Exception('JSON inválido');
                    }
                    return $valor;
                }
                throw new Exception('El valor debe ser JSON válido');
                
            case 'string':
            default:
                return (string)$valor;
        }
    }
    
    /**
     * Parsear valor según el tipo
     */
    private function parseValue($valor, $tipo) {
        switch ($tipo) {
            case 'number':
                return is_numeric($valor) ? (float)$valor : 0;
                
            case 'boolean':
                return in_array(strtolower($valor), ['true', '1', 'yes', 'on']);
                
            case 'json':
                $decoded = json_decode($valor, true);
                return $decoded !== null ? $decoded : $valor;
                
            case 'string':
            default:
                return $valor;
        }
    }
    
    /**
     * Log de cambios en configuraciones
     */
    private function logConfigChange($clave, $valorAnterior, $valorNuevo) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO logs (nivel, mensaje, contexto, usuario_id) 
                VALUES (?, ?, ?, ?)
            ");
            
            $mensaje = "Configuración '{$clave}' actualizada";
            $contexto = json_encode([
                'clave' => $clave,
                'valor_anterior' => $valorAnterior,
                'valor_nuevo' => $valorNuevo,
                'fecha' => date('Y-m-d H:i:s')
            ]);
            
            $usuarioId = $_SESSION['usuario_id'] ?? null;
            
            $stmt->execute(['INFO', $mensaje, $contexto, $usuarioId]);
        } catch (Exception $e) {
            // Log del error pero no fallar la operación principal
            error_log("Error al logear cambio de configuración: " . $e->getMessage());
        }
    }
}
?>

