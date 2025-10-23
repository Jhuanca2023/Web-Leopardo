<?php
/**
 * Controlador de Carrito
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Carrito.php';
require_once __DIR__ . '/../models/Producto.php';

class CarritoController extends BaseController {
    private $carritoModel;
    private $productoModel;
    
    public function __construct() {
        $this->carritoModel = new Carrito();
        $this->productoModel = new Producto();
    }
    
    /**
     * Obtener carrito del usuario autenticado
     */
    public function getCart() {
        try {
            $usuarioId = $this->requireAuth();
            
            $items = $this->carritoModel->getByUsuario($usuarioId);
            $total = $this->carritoModel->calculateTotal($usuarioId);
            $itemCount = $this->carritoModel->getItemCount($usuarioId);
            
            $itemsArray = array_map([$this->carritoModel, 'toArray'], $items);
            
            $this->jsonResponse([
                'items' => $itemsArray,
                'total' => $total,
                'cantidad_items' => $itemCount
            ]);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Agregar producto al carrito
     */
    public function addProduct() {
        try {
            $usuarioId = $this->requireAuth();
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar campos requeridos
            $this->validateRequired($data, ['producto_id']);
            
            $productoId = (int)$data['producto_id'];
            $cantidad = isset($data['cantidad']) ? (int)$data['cantidad'] : 1;
            $talla = $data['talla'] ?? null;
            
            // Validar cantidad
            if ($cantidad <= 0) {
                $this->errorResponse('La cantidad debe ser mayor a 0', 400);
            }
            
            // Verificar que el producto existe
            $producto = $this->productoModel->getById($productoId);
            if (!$producto) {
                $this->errorResponse('Producto no encontrado', 404);
            }
            
            // Verificar que el producto está activo
            if (!$producto['activo']) {
                $this->errorResponse('El producto no está disponible', 400);
            }
            
            // Verificar stock por talla específica o total
            if ($talla) {
                if (!$this->productoModel->hasStockTalla($productoId, $talla, $cantidad)) {
                    $this->errorResponse('Stock insuficiente para la talla ' . $talla, 400);
                }
            } else {
                if (!$this->productoModel->hasStock($productoId, $cantidad)) {
                    $this->errorResponse('Stock insuficiente', 400);
                }
            }
            
            // Agregar al carrito
            $itemId = $this->carritoModel->addProduct($usuarioId, $productoId, $cantidad, $talla);
            
            if (!$itemId) {
                $this->errorResponse('Error al agregar producto al carrito', 500);
            }
            
            $item = $this->carritoModel->getById($itemId);
            
            if (!$item) {
                $this->errorResponse('Error al obtener item del carrito', 500);
            }
            
            $this->successResponse(
                'Producto agregado al carrito',
                $this->carritoModel->toArray($item),
                201
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Actualizar cantidad de un item en el carrito
     */
    public function updateQuantity($params) {
        try {
            $itemId = is_array($params) ? ($params['id'] ?? null) : $params;

            $usuarioId = $this->requireAuth();
            
            if (!is_numeric($itemId)) {
                $this->errorResponse('ID de producto inválido', 400);
            }


            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar campos requeridos
            $this->validateRequired($data, ['cantidad']);
            
            $nuevaCantidad = (int)$data['cantidad'];
            
            // Validar cantidad
            if ($nuevaCantidad < 0) {
                $this->errorResponse('La cantidad no puede ser negativa', 400);
            }
            
            // Verificar que el item existe y pertenece al usuario
            $item = $this->carritoModel->getById($itemId);
            if (!$item || $item['usuario_id'] != $usuarioId) {
                $this->errorResponse('Item no encontrado', 404);
            }
            
            // Si la cantidad es 0, eliminar el item
            if ($nuevaCantidad == 0) {
                $this->carritoModel->removeItem($itemId);
                $this->successResponse('Item eliminado del carrito');
                return;
            }
            
            // Verificar stock si se está aumentando la cantidad
            if ($nuevaCantidad > $item['cantidad']) {
                $producto = $this->productoModel->getById($item['producto_id']);
                if (!$producto || !$producto['activo']) {
                    $this->errorResponse('El producto ya no está disponible', 400);
                }
                
                // Verificar stock por talla específica si existe
                if (isset($item['talla']) && $item['talla']) {
                    if (!$this->productoModel->hasStockTalla($item['producto_id'], $item['talla'], $nuevaCantidad)) {
                        $this->errorResponse('Stock insuficiente para la talla ' . $item['talla'], 400);
                    }
                } else {
                    if (!$this->productoModel->hasStock($item['producto_id'], $nuevaCantidad)) {
                        $this->errorResponse('Stock insuficiente', 400);
                    }
                }
            }
            
            // Actualizar cantidad
            $success = $this->carritoModel->updateCantidad($itemId, $nuevaCantidad);
            
            if (!$success) {
                $this->errorResponse('Error al actualizar la cantidad', 500);
            }
            
            $item = $this->carritoModel->getById($itemId);
            
            $this->successResponse(
                'Cantidad actualizada correctamente',
                $this->carritoModel->toArray($item)
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Eliminar item del carrito
     */
    public function removeItem($params) {
        try {
            $itemId = is_array($params) ? ($params['id'] ?? null) : $params;

            $usuarioId = $this->requireAuth();
            
            if (!is_numeric($itemId)) {
                $this->errorResponse('ID de producto inválido', 400);
            }
            
            // Verificar que el item existe y pertenece al usuario
            $item = $this->carritoModel->getById($itemId);
            if (!$item || $item['usuario_id'] != $usuarioId) {
                $this->errorResponse('Item no encontrado', 404);
            }
            
            // Eliminar item
            $success = $this->carritoModel->removeItem($itemId);
            
            if (!$success) {
                $this->errorResponse('Error al eliminar el item', 500);
            }
            
            $this->successResponse('Item eliminado del carrito');
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Vaciar carrito
     */
    public function clearCart() {
        try {
            $usuarioId = $this->requireAuth();
            
            $success = $this->carritoModel->clearByUsuario($usuarioId);
            
            if (!$success) {
                $this->errorResponse('Error al vaciar el carrito', 500);
            }
            
            $this->successResponse('Carrito vaciado correctamente');
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Validar carrito
     */
    public function validateCart() {
        try {
            $usuarioId = $this->requireAuth();
            
            $validation = $this->carritoModel->validateCart($usuarioId);
            
            if (!$validation['valid']) {
                $this->errorResponse('Carrito contiene items inválidos', 400, $validation['errors']);
            }
            
            $itemsArray = array_map([$this->carritoModel, 'toArray'], $validation['items']);
            
            $this->jsonResponse([
                'valid' => true,
                'items' => $itemsArray
            ]);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener cantidad de items en el carrito
     */
    public function getItemCount() {
        try {
            $usuarioId = $this->requireAuth();
            
            $count = $this->carritoModel->getItemCount($usuarioId);
            
            $this->jsonResponse(['count' => $count]);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Verificar si un producto está en el carrito
     */
    public function isInCart($params) {
        try {
            $productoId = is_array($params) ? ($params['id'] ?? null) : $params;

            $usuarioId = $this->requireAuth();
            
            if (!is_numeric($productoId)) {
                $this->errorResponse('ID de producto inválido', 400);
            }
            
            $isInCart = $this->carritoModel->isInCart($usuarioId, $productoId);
            $quantity = $isInCart ? $this->carritoModel->getProductQuantity($usuarioId, $productoId) : 0;
            
            $this->jsonResponse([
                'in_cart' => $isInCart,
                'quantity' => $quantity
            ]);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener estadísticas del carrito (solo administradores)
     */
    public function getStats() {
        try {
            $this->requireAdmin();
            
            $stats = $this->carritoModel->getStats();
            $this->jsonResponse($stats);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>

