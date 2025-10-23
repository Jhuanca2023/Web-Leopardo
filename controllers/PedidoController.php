<?php
/**
 * Controlador de Pedidos
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Pedido.php';
require_once __DIR__ . '/../models/Carrito.php';
require_once __DIR__ . '/../models/Producto.php';

class PedidoController extends BaseController {
    private $pedidoModel;
    private $carritoModel;
    private $productoModel;
    
    public function __construct() {
        $this->pedidoModel = new Pedido();
        $this->carritoModel = new Carrito();
        $this->productoModel = new Producto();
    }
    
    /**
     * Obtener pedidos del usuario autenticado
     */
    public function getUserOrders() {
        try {
            $usuarioId = $this->requireAuth();
            
            $params = $this->getQueryParams();
            $limit = isset($params['limit']) ? (int)$params['limit'] : null;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
            
            $pedidos = $this->pedidoModel->getByUsuario($usuarioId, $limit, $offset);
            $pedidosArray = array_map([$this->pedidoModel, 'toArray'], $pedidos);
            
            $this->jsonResponse($pedidosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener pedido por ID
     */
    public function getById($id) {
        try {
            $usuarioId = $this->requireAuth();
            
            if (!is_numeric($id)) {
                $this->errorResponse('ID de pedido inválido', 400);
            }
            
            $pedido = $this->pedidoModel->getByIdWithDetails($id);
            
            if (!$pedido) {
                $this->errorResponse('Pedido no encontrado', 404);
            }
            
            // Verificar que el pedido pertenece al usuario (a menos que sea admin)
            session_start();
            if (!$_SESSION['es_admin'] && $pedido['usuario_id'] != $usuarioId) {
                $this->errorResponse('No autorizado', 403);
            }
            
            $this->jsonResponse($this->pedidoModel->toArray($pedido));
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Crear nuevo pedido
     */
    public function create() {
        try {
            $usuarioId = $this->requireAuth();
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar campos requeridos
            $this->validateRequired($data, ['direccion_envio']);
            
            // Validar y obtener items del carrito
            $validation = $this->carritoModel->validateCart($usuarioId);
            
            if (!$validation['valid']) {
                $this->errorResponse('Carrito contiene items inválidos', 400, $validation['errors']);
            }
            
            if (empty($validation['items'])) {
                $this->errorResponse('El carrito está vacío', 400);
            }
            
            // Calcular total
            $total = 0;
            $detalles = [];
            
            foreach ($validation['items'] as $item) {
                $subtotal = (float)$item['precio'] * (int)$item['cantidad'];
                $total += $subtotal;
                
                $detalles[] = [
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio']
                ];
            }
            
            // Crear pedido
            $pedidoData = [
                'usuario_id' => $usuarioId,
                'total' => $total,
                'direccion_envio' => $data['direccion_envio'],
                'telefono_contacto' => $data['telefono_contacto'] ?? null,
                'notas' => $data['notas'] ?? null,
                'detalles' => $detalles
            ];
            
            $pedidoId = $this->pedidoModel->createPedido($pedidoData);
            
            // Actualizar stock de productos
            foreach ($validation['items'] as $item) {
                $nuevoStock = $item['stock'] - $item['cantidad'];
                $this->productoModel->updateStock($item['producto_id'], $nuevoStock);
            }
            
            // Vaciar carrito
            $this->carritoModel->clearByUsuario($usuarioId);
            
            // Obtener pedido creado
            $pedido = $this->pedidoModel->getByIdWithDetails($pedidoId);
            
            $this->successResponse(
                'Pedido creado correctamente',
                $this->pedidoModel->toArray($pedido),
                201
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener todos los pedidos (solo administradores)
     */
    public function getAllOrders() {
        try {
            $this->requireAdmin();
            
            $params = $this->getQueryParams();
            $limit = isset($params['limit']) ? (int)$params['limit'] : null;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
            $estado = $params['estado'] ?? null;
            
            $pedidos = $this->pedidoModel->getAllPedidos($limit, $offset, $estado);
            $pedidosArray = array_map([$this->pedidoModel, 'toArray'], $pedidos);
            
            $this->jsonResponse($pedidosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Actualizar estado del pedido (solo administradores)
     */
    public function updateStatus($id) {
        try {
            $this->requireAdmin();
            
            if (!is_numeric($id)) {
                $this->errorResponse('ID de pedido inválido', 400);
            }
            
            $pedido = $this->pedidoModel->getById($id);
            if (!$pedido) {
                $this->errorResponse('Pedido no encontrado', 404);
            }
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar campos requeridos
            $this->validateRequired($data, ['estado']);
            
            // Actualizar estado
            $success = $this->pedidoModel->updateEstado($id, $data['estado']);
            
            if (!$success) {
                $this->errorResponse('Error al actualizar el estado del pedido', 500);
            }
            
            $pedido = $this->pedidoModel->getByIdWithDetails($id);
            
            $this->successResponse(
                'Estado del pedido actualizado correctamente',
                $this->pedidoModel->toArray($pedido)
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener pedidos por estado (solo administradores)
     */
    public function getByStatus($estado) {
        try {
            $this->requireAdmin();
            
            $params = $this->getQueryParams();
            $limit = isset($params['limit']) ? (int)$params['limit'] : null;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
            
            $pedidos = $this->pedidoModel->getByEstado($estado, $limit, $offset);
            $pedidosArray = array_map([$this->pedidoModel, 'toArray'], $pedidos);
            
            $this->jsonResponse($pedidosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener pedidos recientes (solo administradores)
     */
    public function getRecent() {
        try {
            $this->requireAdmin();
            
            $params = $this->getQueryParams();
            $limit = isset($params['limit']) ? (int)$params['limit'] : 10;
            
            $pedidos = $this->pedidoModel->getRecent($limit);
            $pedidosArray = array_map([$this->pedidoModel, 'toArray'], $pedidos);
            
            $this->jsonResponse($pedidosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener pedidos por rango de fechas (solo administradores)
     */
    public function getByDateRange() {
        try {
            $this->requireAdmin();
            
            $params = $this->getQueryParams();
            $fechaInicio = $params['fecha_inicio'] ?? null;
            $fechaFin = $params['fecha_fin'] ?? null;
            $limit = isset($params['limit']) ? (int)$params['limit'] : null;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
            
            if (!$fechaInicio || !$fechaFin) {
                $this->errorResponse('Fechas de inicio y fin son requeridas', 400);
            }
            
            $pedidos = $this->pedidoModel->getByDateRange($fechaInicio, $fechaFin, $limit, $offset);
            $pedidosArray = array_map([$this->pedidoModel, 'toArray'], $pedidos);
            
            $this->jsonResponse($pedidosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener estadísticas de pedidos (solo administradores)
     */
    public function getStats() {
        try {
            $this->requireAdmin();
            
            $stats = $this->pedidoModel->getStats();
            $this->jsonResponse($stats);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Cancelar pedido
     */
    public function cancel($id) {
        try {
            $usuarioId = $this->requireAuth();
            
            if (!is_numeric($id)) {
                $this->errorResponse('ID de pedido inválido', 400);
            }
            
            $pedido = $this->pedidoModel->getById($id);
            if (!$pedido) {
                $this->errorResponse('Pedido no encontrado', 404);
            }
            
            // Verificar que el pedido pertenece al usuario
            if ($pedido['usuario_id'] != $usuarioId) {
                $this->errorResponse('No autorizado', 403);
            }
            
            // Solo se puede cancelar si está pendiente o procesando
            if (!in_array($pedido['estado'], ['pendiente', 'procesando'])) {
                $this->errorResponse('No se puede cancelar un pedido en estado: ' . $pedido['estado'], 400);
            }
            
            // Actualizar estado a cancelado
            $success = $this->pedidoModel->updateEstado($id, 'cancelado');
            
            if (!$success) {
                $this->errorResponse('Error al cancelar el pedido', 500);
            }
            
            // Restaurar stock de productos
            $detalles = $this->pedidoModel->getByIdWithDetails($id)['detalles'];
            foreach ($detalles as $detalle) {
                $producto = $this->productoModel->getById($detalle['producto_id']);
                if ($producto) {
                    $nuevoStock = $producto['stock'] + $detalle['cantidad'];
                    $this->productoModel->updateStock($detalle['producto_id'], $nuevoStock);
                }
            }
            
            $this->successResponse('Pedido cancelado correctamente');
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>
