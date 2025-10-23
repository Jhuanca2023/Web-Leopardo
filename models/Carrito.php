<?php
/**
 * Modelo de Carrito
 */

require_once __DIR__ . '/BaseModel.php';

class Carrito extends BaseModel {
    protected $table = 'carrito';
    
    /**
     * Agregar producto al carrito
     */
    public function addProduct($usuarioId, $productoId, $cantidad = 1, $talla = null) {
        // Verificar si el producto con esa talla ya está en el carrito
        $existingItem = null;
        
        if ($talla) {
            // Buscar por usuario, producto y talla específica
            $sql = "SELECT * FROM {$this->table} WHERE usuario_id = ? AND producto_id = ? AND talla = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$usuarioId, $productoId, $talla]);
            $existingItem = $stmt->fetch();
        } else {
            // Buscar por usuario y producto sin talla específica
            $sql = "SELECT * FROM {$this->table} WHERE usuario_id = ? AND producto_id = ? AND (talla IS NULL OR talla = '')";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$usuarioId, $productoId]);
            $existingItem = $stmt->fetch();
        }
        
        if ($existingItem) {
            // Actualizar cantidad del item existente
            $newCantidad = $existingItem['cantidad'] + $cantidad;
            $success = $this->update($existingItem['id'], ['cantidad' => $newCantidad]);
            return $success ? $existingItem['id'] : false;
        } else {
            // Crear nuevo item
            $itemData = [
                'usuario_id' => $usuarioId,
                'producto_id' => $productoId,
                'cantidad' => $cantidad,
                'talla' => $talla
            ];
            return $this->create($itemData);
        }
    }
    
    /**
     * Obtener carrito de un usuario
     */
    public function getByUsuario($usuarioId) {
        $sql = "
            SELECT c.*, 
                   p.nombre, p.precio, p.precio_promocional, p.descripcion, p.categoria_id, p.imagen_principal, p.imagenes_adicionales, p.tipo, p.material, p.espesor_cuero, p.forro, p.puntera, p.impermeable, p.suela, p.plantilla, p.aislamiento, p.caracteristicas, p.activo, p.destacado, p.fecha_creacion, p.fecha_actualizacion,
                   cat.nombre as categoria_nombre,
                   pts.stock as stock_disponible
            FROM {$this->table} c 
            LEFT JOIN productos2 p ON c.producto_id = p.id 
            LEFT JOIN categorias cat ON p.categoria_id = cat.id 
            LEFT JOIN producto_tallas_stock pts ON (c.producto_id = pts.producto_id AND c.talla = pts.talla)
            WHERE c.usuario_id = ? 
            ORDER BY c.fecha_agregado DESC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$usuarioId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Actualizar cantidad de un item
     */
    public function updateCantidad($itemId, $nuevaCantidad) {
        if ($nuevaCantidad <= 0) {
            return $this->delete($itemId);
        }
        
        return $this->update($itemId, ['cantidad' => $nuevaCantidad]);
    }
    
    /**
     * Eliminar item del carrito
     */
    public function removeItem($itemId) {
        return $this->delete($itemId);
    }
    
    /**
     * Vaciar carrito de un usuario
     */
    public function clearByUsuario($usuarioId) {
        $sql = "DELETE FROM {$this->table} WHERE usuario_id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$usuarioId]);
    }
    
    /**
     * Calcular total del carrito
     */
    public function calculateTotal($usuarioId) {
        $sql = "
            SELECT SUM(p.precio * c.cantidad) as total 
            FROM {$this->table} c 
            LEFT JOIN productos2 p ON c.producto_id = p.id 
            WHERE c.usuario_id = ? AND p.activo = 1
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$usuarioId]);
        $result = $stmt->fetch();
        return (float)($result['total'] ?? 0);
    }
    
    /**
     * Obtener cantidad total de items en el carrito
     */
    public function getItemCount($usuarioId) {
        $sql = "SELECT SUM(cantidad) as total FROM {$this->table} WHERE usuario_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$usuarioId]);
        $result = $stmt->fetch();
        return (int)($result['total'] ?? 0);
    }
    
    /**
     * Verificar si un producto está en el carrito
     */
    public function isInCart($usuarioId, $productoId) {
        $item = $this->getBy([
            'usuario_id' => $usuarioId,
            'producto_id' => $productoId
        ]);
        return $item !== false;
    }
    
    /**
     * Obtener cantidad de un producto en el carrito
     */
    public function getProductQuantity($usuarioId, $productoId) {
        $item = $this->getBy([
            'usuario_id' => $usuarioId,
            'producto_id' => $productoId
        ]);
        return $item ? (int)$item['cantidad'] : 0;
    }
    
    /**
     * Validar items del carrito (verificar stock y disponibilidad)
     */
    public function validateCart($usuarioId) {
        $items = $this->getByUsuario($usuarioId);
        $errors = [];
        $validItems = [];
        
        foreach ($items as $item) {
            if (!$item['activo']) {
                $errors[] = "El producto '{$item['nombre']}' ya no está disponible";
                continue;
            }
            
            if ($item['stock'] < $item['cantidad']) {
                $errors[] = "Stock insuficiente para '{$item['nombre']}'. Disponible: {$item['stock']}";
                continue;
            }
            
            $validItems[] = $item;
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'items' => $validItems
        ];
    }
    
    /**
     * Obtener estadísticas del carrito
     */
    public function getStats() {
        $stats = [];
        
        // Total de items en carritos
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table}");
        $stmt->execute();
        $stats['total_items'] = $stmt->fetchColumn();
        
        // Usuarios con carrito activo
        $stmt = $this->db->prepare("SELECT COUNT(DISTINCT usuario_id) FROM {$this->table}");
        $stmt->execute();
        $stats['active_carts'] = $stmt->fetchColumn();
        
        // Valor promedio de carritos
        $sql = "
            SELECT AVG(total) as promedio 
            FROM (
                SELECT SUM(p.precio * c.cantidad) as total 
                FROM {$this->table} c 
                LEFT JOIN productos2 p ON c.producto_id = p.id 
                WHERE p.activo = 1 
                GROUP BY c.usuario_id
            ) as cart_totals
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch();
        $stats['average_cart_value'] = (float)($result['promedio'] ?? 0);
        
        return $stats;
    }
    
    /**
     * Convertir item del carrito a array
     */
    public function toArray($item) {
        if (!$item) {
            return null;
        }
        
        // Usar precio promocional si existe y es menor al precio normal
        $precioEfectivo = $item['precio'];
        if (isset($item['precio_promocional']) && $item['precio_promocional'] > 0 && $item['precio_promocional'] < $item['precio']) {
            $precioEfectivo = $item['precio_promocional'];
        }
        
        $subtotal = (float)$precioEfectivo * (int)$item['cantidad'];
        
        // Obtener stock total sumando todas las tallas
        $sqlStock = "SELECT SUM(stock) as total_stock FROM producto_tallas_stock WHERE producto_id = ?";
        $stmtStock = $this->db->prepare($sqlStock);
        $stmtStock->execute([$item['producto_id']]);
        $totalStock = (int)($stmtStock->fetchColumn() ?? 0);

        $result = [
            'id' => (int)$item['id'],
            'usuario_id' => (int)$item['usuario_id'],
            'producto_id' => (int)$item['producto_id'],
            'cantidad' => (int)$item['cantidad'],
            'fecha_agregado' => $item['fecha_agregado'],
            'talla' => $item['talla'] ?? null,
            'stock_disponible' => isset($item['stock_disponible']) ? (int)$item['stock_disponible'] : null,
            'producto' => [
                'id' => (int)$item['producto_id'],
                'nombre' => $item['nombre'],
                'precio' => (float)$item['precio'],
                'precio_promocional' => isset($item['precio_promocional']) ? (float)$item['precio_promocional'] : null,
                'descripcion' => $item['descripcion'],
                'categoria_id' => (int)$item['categoria_id'],
                'imagen_principal' => $item['imagen_principal'],
                'imagenes_adicionales' => $item['imagenes_adicionales'],
                'tipo' => $item['tipo'],
                'material' => $item['material'],
                'espesor_cuero' => $item['espesor_cuero'],
                'forro' => $item['forro'],
                'puntera' => $item['puntera'],
                'impermeable' => (bool)$item['impermeable'],
                'suela' => $item['suela'],
                'plantilla' => $item['plantilla'],
                'aislamiento' => $item['aislamiento'],
                'caracteristicas' => $item['caracteristicas'],
                'activo' => (bool)$item['activo'],
                'destacado' => (bool)$item['destacado'],
                'fecha_creacion' => $item['fecha_creacion'],
                'fecha_actualizacion' => $item['fecha_actualizacion'],
                'categoria_nombre' => $item['categoria_nombre'],
                'stock_total' => $totalStock
            ],
            'subtotal' => $subtotal
        ];
        
        return $result;
    }
}
?>

