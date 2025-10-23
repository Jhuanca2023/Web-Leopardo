<?php
/**
 * Modelo de Categoría
 */

require_once __DIR__ . '/BaseModel.php';

class Categoria extends BaseModel {
    protected $table = 'categorias';
    
    /**
     * Crear una nueva categoría
     */
    public function createCategoria($data) {
        $categoriaData = [
            'nombre' => $data['nombre'],
            'descripcion' => $data['descripcion'] ?? null,
            'icono' => $data['icono'] ?? null,
            'activo' => $data['activo'] ?? true
        ];
        
        return $this->create($categoriaData);
    }
    
    /**
     * Obtener todas las categorías activas
     */
    public function getAllActive() {
        return $this->getAll(['activo' => 1], 'nombre ASC');
    }
    
    /**
     * Obtener categoría por ID
     */
    public function getById($id) {
        return parent::getById($id);
    }
    
    /**
     * Actualizar categoría
     */
    public function updateCategoria($id, $data) {
        $allowedFields = ['nombre', 'descripcion', 'icono', 'activo'];
        $updateData = [];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (!empty($updateData)) {
            return $this->update($id, $updateData);
        }
        
        return false;
    }
    
    /**
     * Eliminar categoría (soft delete)
     */
    public function deleteCategoria($id) {
        // Verificar si tiene productos asociados
        $productoModel = new Producto();
        $productos = $productoModel->getAll(['categoria_id' => $id, 'activo' => 1]);
        
        if (!empty($productos)) {
            throw new Exception('No se puede eliminar una categoría con productos asociados');
        }
        
        return $this->update($id, ['activo' => 0]);
    }
    
    /**
     * Verificar si el nombre de categoría ya existe
     */
    public function nombreExists($nombre, $excludeId = null) {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE nombre = ?";
        $params = [$nombre];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }
    
    /**
     * Obtener categorías con conteo de productos
     */
    public function getWithProductCount() {
        $sql = "
            SELECT c.*, COUNT(p.id) as total_productos 
            FROM {$this->table} c 
            LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = 1 
            WHERE c.activo = 1 
            GROUP BY c.id 
            ORDER BY c.nombre ASC
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Buscar categorías
     */
    public function search($term) {
        $sql = "
            SELECT * FROM {$this->table} 
            WHERE activo = 1 
            AND (nombre LIKE ? OR descripcion LIKE ?) 
            ORDER BY nombre ASC
        ";
        
        $searchTerm = "%{$term}%";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$searchTerm, $searchTerm]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener estadísticas de categorías
     */
    public function getStats() {
        $stats = [];
        
        // Total de categorías activas
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE activo = 1");
        $stmt->execute();
        $stats['total_active'] = $stmt->fetchColumn();
        
        // Total de categorías inactivas
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE activo = 0");
        $stmt->execute();
        $stats['total_inactive'] = $stmt->fetchColumn();
        
        // Categoría con más productos
        $sql = "
            SELECT c.nombre, COUNT(p.id) as total_productos 
            FROM {$this->table} c 
            LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = 1 
            WHERE c.activo = 1 
            GROUP BY c.id 
            ORDER BY total_productos DESC 
            LIMIT 1
        ";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $stats['most_products'] = $stmt->fetch();
        
        return $stats;
    }
    
    /**
     * Convertir categoría a array
     */
    public function toArray($categoria) {
        if (!$categoria) {
            return null;
        }
        
        return [
            'id' => (int)$categoria['id'],
            'nombre' => $categoria['nombre'],
            'descripcion' => $categoria['descripcion'],
            'icono' => $categoria['icono'],
            'activo' => (bool)$categoria['activo'],
            'fecha_creacion' => $categoria['fecha_creacion']
        ];
    }
}
?>
