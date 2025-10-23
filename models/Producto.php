<?php
/**
 * Modelo de Producto
 */

require_once __DIR__ . '/BaseModel.php';

class Producto extends BaseModel {
    
    protected $table = 'productos2';
    
    /**
     * Crear un nuevo producto y sus tallas/stock
     */
    public function createProducto($data) {
        $productoData = [
            'codigo' => $data['codigo'],
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'precio' => (float)$data['precio'],
            'precio_promocional' => empty($data['precio_promocional']) || $data['precio_promocional'] === '' || $data['precio_promocional'] === null ? null : (float)$data['precio_promocional'],
            'categoria_id' => (int)$data['categoria_id'],
            'imagen_principal' => $data['imagen_principal'] ?? null,
            'imagenes_adicionales' => isset($data['imagenes_adicionales']) ? json_encode($data['imagenes_adicionales']) : null,
            'tipo' => $data['tipo'] ?? null,
            'material' => $data['material'] ?? null,
            'espesor_cuero' => $data['espesor_cuero'] ?? null,
            'forro' => $data['forro'] ?? null,
            'puntera' => $data['puntera'] ?? null,
            'impermeable' => (int)($data['impermeable'] ?? 0),
            'suela' => $data['suela'] ?? null,
            'plantilla' => $data['plantilla'] ?? null,
            'aislamiento' => $data['aislamiento'] ?? null,
            'caracteristicas' => isset($data['caracteristicas']) ? json_encode($data['caracteristicas']) : null,
            'activo' => (int)($data['activo'] ?? 1),
            'destacado' => (int)($data['destacado'] ?? 0)
        ];
        
        $productoId = $this->create($productoData);
        // Insertar tallas/stock en producto_tallas_stock
        if (isset($data['tallas_stock']) && is_array($data['tallas_stock'])) {
            foreach ($data['tallas_stock'] as $talla => $stock) {
                $this->addTallaStock($productoId, $talla, $stock);
            }
        }
        return $productoId;
    }
    /**
     * Agregar o actualizar una talla/stock para un producto
     */
    public function addTallaStock($productoId, $talla, $stock) {
        $sql = "INSERT INTO producto_tallas_stock (producto_id, talla, stock) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE stock = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$productoId, $talla, $stock, $stock]);
    }

    /**
     * Obtener todas las tallas/stock de un producto
     */
    public function getTallasStock($productoId) {
        $sql = "SELECT talla, stock FROM producto_tallas_stock WHERE producto_id = ? ORDER BY talla ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$productoId]);
        $result = [];
        foreach ($stmt->fetchAll() as $row) {
            $result[$row['talla']] = (int)$row['stock'];
        }
        return $result;
    }

    /**
     * Actualizar stock de una talla específica
     */
    public function updateStockTalla($productoId, $talla, $nuevoStock) {
        return $this->addTallaStock($productoId, $talla, $nuevoStock);
    }

    /**
     * Verificar si hay stock suficiente sumando todas las tallas
     */
    public function hasStock($productoId, $cantidad) {
        $sql = "SELECT SUM(stock) as total_stock FROM producto_tallas_stock WHERE producto_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$productoId]);
        $totalStock = $stmt->fetchColumn();
        return $totalStock !== false && $totalStock >= $cantidad;
    }

    /**
     * Verificar si hay stock suficiente para una talla
     */
    public function hasStockTalla($productoId, $talla, $cantidad) {
        $sql = "SELECT stock FROM producto_tallas_stock WHERE producto_id = ? AND talla = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$productoId, $talla]);
        $stock = $stmt->fetchColumn();
        return $stock !== false && $stock >= $cantidad;
    }
    
    /**
     * Obtener todos los productos
     */
    public function getAllProductos($limit = null, $offset = 0) {
        $sql = "SELECT p.*, c.nombre as categoria_nombre FROM {$this->table} p 
                LEFT JOIN categorias c ON p.categoria_id = c.id 
                ORDER BY p.fecha_creacion DESC";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    
    /**
     * Obtener todos los productos activos
     */
    public function getAllActive($limit = null, $offset = 0) {
        $sql = "SELECT p.*, c.nombre as categoria_nombre FROM {$this->table} p 
                LEFT JOIN categorias c ON p.categoria_id = c.id 
                WHERE p.activo = 1 
                ORDER BY p.fecha_creacion DESC";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener productos destacados
     */
    public function getDestacados($limit = null) {
        $sql = "SELECT p.*, c.nombre as categoria_nombre FROM {$this->table} p 
                LEFT JOIN categorias c ON p.categoria_id = c.id 
                WHERE p.activo = 1 AND p.destacado = 1 
                ORDER BY p.fecha_creacion DESC";
        
        if ($limit) {
            $sql .= " LIMIT {$limit}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener productos por categoría
     */
    public function getByCategoria($categoriaId, $limit = null, $offset = 0) {
        $sql = "SELECT p.*, c.nombre as categoria_nombre FROM {$this->table} p 
                LEFT JOIN categorias c ON p.categoria_id = c.id 
                WHERE p.activo = 1 AND p.categoria_id = ? 
                ORDER BY p.fecha_creacion DESC";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$categoriaId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Buscar productos
     */
    public function search($term, $limit = null, $offset = 0) {
        $sql = "SELECT p.*, c.nombre as categoria_nombre FROM {$this->table} p 
                LEFT JOIN categorias c ON p.categoria_id = c.id 
                WHERE p.activo = 1 
                AND (p.nombre LIKE ? OR p.descripcion LIKE ?) 
                ORDER BY p.fecha_creacion DESC";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        $searchTerm = "%{$term}%";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$searchTerm, $searchTerm]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener producto por ID con información de categoría
     */
    public function getByIdWithCategory($id) {
        $sql = "SELECT p.*, c.nombre as categoria_nombre FROM {$this->table} p 
                LEFT JOIN categorias c ON p.categoria_id = c.id 
                WHERE p.id = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    /**
     * Actualizar producto y sus tallas/stock
     */
    public function updateProducto($id, $data) {
        try {
            error_log("=== MODELO updateProducto ===");
            error_log("Product ID: " . $id);
            error_log("Data recibida: " . json_encode($data, JSON_PRETTY_PRINT));
            error_log("Tabla que se usará: " . $this->table);
            
            // Verificar que el producto existe
            $existingProduct = $this->getById($id);
            if (!$existingProduct) {
                error_log("❌ Producto no encontrado en tabla {$this->table} con ID: {$id}");
                throw new Exception("Producto no encontrado");
            }
            error_log("✅ Producto encontrado: " . json_encode($existingProduct));

            $allowedFields = ['codigo', 'nombre', 'descripcion', 'precio', 'precio_promocional', 'categoria_id', 'imagen_principal', 'imagenes_adicionales', 'tipo', 'material', 'espesor_cuero', 'forro', 'puntera', 'impermeable', 'suela', 'plantilla', 'aislamiento', 'caracteristicas', 'activo', 'destacado'];
            $updateData = [];
            
            error_log("📋 Procesando campos permitidos:");
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    if (in_array($field, ['imagenes_adicionales', 'caracteristicas']) && is_array($data[$field])) {
                        $updateData[$field] = json_encode($data[$field], JSON_UNESCAPED_UNICODE);
                        error_log("  - {$field}: JSON array → " . $updateData[$field]);
                    } elseif ($field === 'precio_promocional') {
                        // Manejar precio_promocional especialmente
                        if (empty($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                            $updateData[$field] = null;
                            error_log("  - {$field}: VACÍO → NULL");
                        } else {
                            $updateData[$field] = (float)$data[$field];
                            error_log("  - {$field}: {$data[$field]} → " . $updateData[$field]);
                        }
                    } elseif (in_array($field, ['precio'])) {
                        // Asegurar que precio sea float
                        $updateData[$field] = (float)$data[$field];
                        error_log("  - {$field}: {$data[$field]} → " . $updateData[$field]);
                    } elseif (in_array($field, ['categoria_id', 'activo', 'destacado', 'impermeable'])) {
                        // Asegurar que sean enteros
                        $updateData[$field] = (int)$data[$field];
                        error_log("  - {$field}: {$data[$field]} → " . $updateData[$field]);
                    } else {
                        $updateData[$field] = $data[$field];
                        error_log("  - {$field}: " . (is_array($data[$field]) ? 'ARRAY' : $data[$field]));
                    }
                } else {
                    error_log("  - {$field}: NO PRESENTE");
                }
            }
            
            error_log("💾 Datos finales para actualizar: " . json_encode($updateData, JSON_PRETTY_PRINT));
            
            if (!empty($updateData)) {
                error_log("🔄 Ejecutando update en BaseModel...");
                $result = $this->update($id, $updateData);
                error_log("✅ Resultado del update: " . ($result ? 'SUCCESS' : 'FAILED'));
                
                if (!$result) {
                    error_log("❌ Error: update() retornó false");
                    throw new Exception("Error al actualizar datos del producto");
                }
            } else {
                error_log("⚠️ No hay datos para actualizar en la tabla principal");
            }
            
            // Actualizar tallas/stock
            if (isset($data['tallas_stock']) && is_array($data['tallas_stock'])) {
                error_log("👟 Actualizando tallas/stock:");
                foreach ($data['tallas_stock'] as $talla => $stock) {
                    error_log("  - Procesando talla {$talla} con stock {$stock}");
                    $tallaResult = $this->addTallaStock($id, $talla, $stock);
                    error_log("  - Resultado: " . ($tallaResult ? 'SUCCESS' : 'FAILED'));
                    
                    if (!$tallaResult) {
                        error_log("❌ Error actualizando talla {$talla}");
                    }
                }
            } else {
                error_log("⚠️ No hay tallas/stock para actualizar o no es array");
            }
            
            error_log("✅ updateProducto completado exitosamente");
            return true;
            
        } catch (Exception $e) {
            error_log("💥 EXCEPTION en updateProducto: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
    }
    
    /**
     * Eliminar producto y todas sus dependencias (eliminación física definitiva)
     */
    public function deleteProducto($id) {
        try {
            // Iniciar transacción
            $this->db->beginTransaction();

            // 1. Eliminar dependencias relacionadas con el producto
            $tablasDependientes = [
                'producto_tallas_stock' => 'producto_id',
                'carrito' => 'producto_id',
                'wishlist' => 'producto_id',
                'detalle_pedidos' => 'producto_id',
                'reseñas' => 'producto_id'
            ];

            foreach ($tablasDependientes as $tabla => $columna) {
                $stmt = $this->db->prepare("DELETE FROM {$tabla} WHERE {$columna} = ?");
                $stmt->execute([$id]);
            }

            // 2. Eliminar el producto principal en productos2
            $stmt = $this->db->prepare("DELETE FROM productos2 WHERE id = ?");
            $stmt->execute([$id]);

            // 3. Confirmar los cambios
            $this->db->commit();

            return true;

        } catch (Exception $e) {
            // Revertir si algo falla
            $this->db->rollBack();
            error_log("Error al eliminar producto y dependencias: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Establecer precio promocional para un producto
     */
    public function setPrecioPromocional($id, $precioPromocional) {
        return $this->update($id, ['precio_promocional' => $precioPromocional]);
    }
    
    /**
     * Remover precio promocional de un producto
     */
    public function removePrecioPromocional($id) {
        return $this->update($id, ['precio_promocional' => null]);
    }
    
    /**
     * Obtener productos en promoción
     */
    public function getEnPromocion($limit = null, $offset = 0) {
        $sql = "SELECT p.*, c.nombre as categoria_nombre FROM {$this->table} p 
                LEFT JOIN categorias c ON p.categoria_id = c.id 
                WHERE p.activo = 1 AND p.precio_promocional IS NOT NULL 
                ORDER BY p.fecha_creacion DESC";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Verificar si un producto tiene precio promocional
     */
    public function tienePromocion($id) {
        $sql = "SELECT precio_promocional FROM {$this->table} WHERE id = ? AND precio_promocional IS NOT NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetchColumn() !== false;
    }
    
    /**
     * Obtener el precio efectivo (promocional si existe, normal si no)
     */
    public function getPrecioEfectivo($producto) {
        return $producto['precio_promocional'] ?? $producto['precio'];
    }
    
    /**
     * Calcular porcentaje de descuento
     */
    public function getPorcentajeDescuento($producto) {
        if (!$producto['precio_promocional'] || $producto['precio_promocional'] >= $producto['precio']) {
            return 0;
        }
        
        $descuento = (($producto['precio'] - $producto['precio_promocional']) / $producto['precio']) * 100;
        return round($descuento, 0);
    }
    
    // ...existing code...
    
    // ...existing code...
    
    /**
     * Obtener productos con stock bajo en alguna talla
     */
    public function getLowStock($threshold = 10) {
        $sql = "SELECT p.*, c.nombre as categoria_nombre, ts.talla, ts.stock as stock_talla FROM {$this->table} p 
                LEFT JOIN categorias c ON p.categoria_id = c.id 
                LEFT JOIN producto_tallas_stock ts ON p.id = ts.producto_id 
                WHERE p.activo = 1 AND ts.stock <= ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$threshold]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener productos más vendidos
     */
    public function getBestSellers($limit = 10) {
        $sql = "
            SELECT p.*, c.nombre as categoria_nombre, SUM(dp.cantidad) as total_vendido 
            FROM {$this->table} p 
            LEFT JOIN categorias c ON p.categoria_id = c.id 
            LEFT JOIN detalle_pedidos dp ON p.id = dp.producto_id 
            LEFT JOIN pedidos ped ON dp.pedido_id = ped.id 
            WHERE p.activo = 1 AND ped.estado != 'cancelado' 
            GROUP BY p.id 
            ORDER BY total_vendido DESC 
            LIMIT ?
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener estadísticas de productos
     */
    public function getStats() {
        $stats = [];
        
        // Total de productos activos
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE activo = 1");
        $stmt->execute();
        $stats['total_active'] = $stmt->fetchColumn();
        
        // Total de productos inactivos
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE activo = 0");
        $stmt->execute();
        $stats['total_inactive'] = $stmt->fetchColumn();
        
        // Productos destacados
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE activo = 1 AND destacado = 1");
        $stmt->execute();
        $stats['destacados'] = $stmt->fetchColumn();
        
        // Productos con stock bajo
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE activo = 1 AND stock <= 10");
        $stmt->execute();
        $stats['stock_bajo'] = $stmt->fetchColumn();
        
        // Valor total del inventario
        $stmt = $this->db->prepare("SELECT SUM(precio * stock) FROM {$this->table} WHERE activo = 1");
        $stmt->execute();
        $stats['valor_inventario'] = $stmt->fetchColumn() ?? 0;
        
        return $stats;
    }
    
    /**
     * Convertir producto a array (incluye todos los campos y tallas/stock)
     */
    public function toArray($producto) {
        if (!$producto) {
            return null;
        }
        $imagenesAdicionales = [];
        if (!empty($producto['imagenes_adicionales'])) {
            $imagenesAdicionales = json_decode($producto['imagenes_adicionales'], true) ?? [];
        }
        $caracteristicas = [];
        if (!empty($producto['caracteristicas'])) {
            $caracteristicas = json_decode($producto['caracteristicas'], true) ?? [];
        }
        $tallasStock = $this->getTallasStock($producto['id']);
        return [
            'id' => (int)$producto['id'],
            'codigo' => $producto['codigo'] ?? null,
            'nombre' => $producto['nombre'],
            'descripcion' => $producto['descripcion'],
            'precio' => (float)$producto['precio'],
            'precio_promocional' => $producto['precio_promocional'] ? (float)$producto['precio_promocional'] : null,
            'categoria_id' => (int)$producto['categoria_id'],
            'categoria_nombre' => $producto['categoria_nombre'] ?? null,
            'imagen_principal' => $producto['imagen_principal'],
            'imagenes_adicionales' => $imagenesAdicionales,
            'tipo' => $producto['tipo'] ?? null,
            'material' => $producto['material'] ?? null,
            'espesor_cuero' => $producto['espesor_cuero'] ?? null,
            'forro' => $producto['forro'] ?? null,
            'puntera' => $producto['puntera'] ?? null,
            'impermeable' => (bool)$producto['impermeable'],
            'suela' => $producto['suela'] ?? null,
            'plantilla' => $producto['plantilla'] ?? null,
            'aislamiento' => $producto['aislamiento'] ?? null,
            'caracteristicas' => $caracteristicas,
            'activo' => (bool)$producto['activo'],
            'destacado' => (bool)$producto['destacado'],
            'fecha_creacion' => $producto['fecha_creacion'],
            'fecha_actualizacion' => $producto['fecha_actualizacion'],
            'tallas_stock' => $tallasStock
        ];
    }
}
?>

