<?php
/**
 * Modelo de Pedido
 */

require_once __DIR__ . '/BaseModel.php';

class Pedido extends BaseModel {
    protected $table = 'pedidos';
    
    /**
     * Crear un nuevo pedido
     */
    public function createPedido($data) {
        $this->beginTransaction();
        
        try {
            // Crear el pedido
            $pedidoData = [
                'usuario_id' => $data['usuario_id'],
                'total' => $data['total'],
                'estado' => $data['estado'] ?? 'pendiente',
                'direccion_envio' => $data['direccion_envio'],
                'telefono_contacto' => $data['telefono_contacto'] ?? null,
                'notas' => $data['notas'] ?? null
            ];
            
            $pedidoId = $this->create($pedidoData);
            
            // Crear detalles del pedido
            if (isset($data['detalles']) && is_array($data['detalles'])) {
                $detalleModel = new DetallePedido();
                foreach ($data['detalles'] as $detalle) {
                    $detalle['pedido_id'] = $pedidoId;
                    $detalleModel->create($detalle);
                }
            }
            
            $this->commit();
            return $pedidoId;
            
        } catch (Exception $e) {
            $this->rollback();
            throw $e;
        }
    }
    
    /**
     * Obtener pedidos de un usuario
     */
    public function getByUsuario($usuarioId, $limit = null, $offset = 0) {
        $sql = "
            SELECT p.*, u.name as usuario_nombre, u.email as usuario_email 
            FROM {$this->table} p 
            LEFT JOIN users u ON p.usuario_id = u.id 
            WHERE p.usuario_id = ? 
            ORDER BY p.fecha_pedido DESC
        ";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$usuarioId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener todos los pedidos (para administración)
     */
    public function getAllPedidos($limit = null, $offset = 0, $estado = null) {
        $sql = "
            SELECT p.*, u.name as usuario_nombre, u.email as usuario_email 
            FROM {$this->table} p 
            LEFT JOIN users u ON p.usuario_id = u.id 
        ";
        
        $params = [];
        
        if ($estado) {
            $sql .= " WHERE p.estado = ?";
            $params[] = $estado;
        }
        
        $sql .= " ORDER BY p.fecha_pedido DESC";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener pedido por ID con detalles
     */
    public function getByIdWithDetails($id) {
        $pedido = $this->getById($id);
        if (!$pedido) {
            return null;
        }
        
        // Obtener detalles del pedido
        $detalleModel = new DetallePedido();
        $detalles = $detalleModel->getByPedido($id);
        
        $pedido['detalles'] = $detalles;
        
        return $pedido;
    }
    
    /**
     * Actualizar estado del pedido
     */
    public function updateEstado($id, $nuevoEstado) {
        $estadosValidos = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
        
        if (!in_array($nuevoEstado, $estadosValidos)) {
            throw new Exception('Estado no válido');
        }
        
        return $this->update($id, ['estado' => $nuevoEstado]);
    }
    
    /**
     * Obtener pedidos por estado
     */
    public function getByEstado($estado, $limit = null, $offset = 0) {
        return $this->getAllPedidos($limit, $offset, $estado);
    }
    
    /**
     * Obtener pedidos recientes
     */
    public function getRecent($limit = 10) {
        $sql = "
            SELECT p.*, u.name as usuario_nombre, u.email as usuario_email 
            FROM {$this->table} p 
            LEFT JOIN users u ON p.usuario_id = u.id 
            ORDER BY p.fecha_pedido DESC 
            LIMIT ?
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener estadísticas de pedidos
     */
    public function getStats() {
        $stats = [];
        
        // Total de pedidos
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table}");
        $stmt->execute();
        $stats['total'] = $stmt->fetchColumn();
        
        // Pedidos por estado
        $estados = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
        $stats['por_estado'] = [];
        
        foreach ($estados as $estado) {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE estado = ?");
            $stmt->execute([$estado]);
            $stats['por_estado'][$estado] = $stmt->fetchColumn();
        }
        
        // Ingresos totales
        $stmt = $this->db->prepare("SELECT SUM(total) FROM {$this->table} WHERE estado = 'entregado'");
        $stmt->execute();
        $stats['ingresos_totales'] = (float)($stmt->fetchColumn() ?? 0);
        
        // Ingresos del mes actual
        $stmt = $this->db->prepare("
            SELECT SUM(total) FROM {$this->table} 
            WHERE estado = 'entregado' 
            AND MONTH(fecha_pedido) = MONTH(CURRENT_DATE()) 
            AND YEAR(fecha_pedido) = YEAR(CURRENT_DATE())
        ");
        $stmt->execute();
        $stats['ingresos_mes'] = (float)($stmt->fetchColumn() ?? 0);
        
        // Promedio de pedido
        $stmt = $this->db->prepare("SELECT AVG(total) FROM {$this->table} WHERE estado = 'entregado'");
        $stmt->execute();
        $stats['promedio_pedido'] = (float)($stmt->fetchColumn() ?? 0);
        
        return $stats;
    }
    
    /**
     * Obtener pedidos por rango de fechas
     */
    public function getByDateRange($fechaInicio, $fechaFin, $limit = null, $offset = 0) {
        $sql = "
            SELECT p.*, u.name as usuario_nombre, u.email as usuario_email 
            FROM {$this->table} p 
            LEFT JOIN users u ON p.usuario_id = u.id 
            WHERE DATE(p.fecha_pedido) BETWEEN ? AND ? 
            ORDER BY p.fecha_pedido DESC
        ";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$fechaInicio, $fechaFin]);
        return $stmt->fetchAll();
    }
    
    /**
     * Convertir pedido a array
     */
    public function toArray($pedido) {
        if (!$pedido) {
            return null;
        }
        
        return [
            'id' => (int)$pedido['id'],
            'usuario_id' => (int)$pedido['usuario_id'],
            'usuario_nombre' => $pedido['usuario_nombre'] ?? null,
            'usuario_email' => $pedido['usuario_email'] ?? null,
            'total' => (float)$pedido['total'],
            'estado' => $pedido['estado'],
            'direccion_envio' => $pedido['direccion_envio'],
            'telefono_contacto' => $pedido['telefono_contacto'],
            'notas' => $pedido['notas'],
            'fecha_pedido' => $pedido['fecha_pedido'],
            'fecha_actualizacion' => $pedido['fecha_actualizacion'],
            'detalles' => $pedido['detalles'] ?? []
        ];
    }
}

/**
 * Modelo de Detalle de Pedido
 */
class DetallePedido extends BaseModel {
    protected $table = 'detalle_pedidos';
    
    /**
     * Crear detalle de pedido
     */
    public function createDetalle($data) {
        $detalleData = [
            'pedido_id' => $data['pedido_id'],
            'producto_id' => $data['producto_id'],
            'cantidad' => $data['cantidad'],
            'precio_unitario' => $data['precio_unitario'],
            'subtotal' => $data['cantidad'] * $data['precio_unitario']
        ];
        
        return $this->create($detalleData);
    }
    
    /**
     * Obtener detalles por pedido
     */
    public function getByPedido($pedidoId) {
        $sql = "
            SELECT d.*, p.nombre as producto_nombre, p.imagen_principal as producto_imagen 
            FROM {$this->table} d 
            LEFT JOIN productos p ON d.producto_id = p.id 
            WHERE d.pedido_id = ? 
            ORDER BY d.id
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$pedidoId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener productos más vendidos
     */
    public function getBestSellingProducts($limit = 10) {
        $sql = "
            SELECT p.id, p.nombre, p.imagen_principal, 
                   SUM(d.cantidad) as total_vendido,
                   SUM(d.subtotal) as ingresos_totales
            FROM {$this->table} d 
            LEFT JOIN productos p ON d.producto_id = p.id 
            LEFT JOIN pedidos ped ON d.pedido_id = ped.id 
            WHERE ped.estado != 'cancelado' 
            GROUP BY p.id 
            ORDER BY total_vendido DESC 
            LIMIT ?
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Convertir detalle a array
     */
    public function toArray($detalle) {
        if (!$detalle) {
            return null;
        }
        
        return [
            'id' => (int)$detalle['id'],
            'pedido_id' => (int)$detalle['pedido_id'],
            'producto_id' => (int)$detalle['producto_id'],
            'producto_nombre' => $detalle['producto_nombre'] ?? null,
            'producto_imagen' => $detalle['producto_imagen'] ?? null,
            'cantidad' => (int)$detalle['cantidad'],
            'precio_unitario' => (float)$detalle['precio_unitario'],
            'subtotal' => (float)$detalle['subtotal']
        ];
    }
}
?>
