<?php
/**
 * Clase base para todos los modelos
 */

require_once __DIR__ . '/../config/database.php';

abstract class BaseModel {
    protected $db;
    protected $table;
    protected $primaryKey = 'id';
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Obtener todos los registros
     */
    public function getAll($conditions = [], $orderBy = null, $limit = null) {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];
        
        if (!empty($conditions)) {
            $whereClause = [];
            foreach ($conditions as $field => $value) {
                $whereClause[] = "{$field} = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(" AND ", $whereClause);
        }
        
        if ($orderBy) {
            $sql .= " ORDER BY {$orderBy}";
        }
        
        if ($limit) {
            $sql .= " LIMIT {$limit}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener un registro por ID
     */
    public function getById($id) {
        $sql = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    /**
     * Obtener un registro por condiciones
     */
    public function getBy($conditions) {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];
        
        if (!empty($conditions)) {
            $whereClause = [];
            foreach ($conditions as $field => $value) {
                $whereClause[] = "{$field} = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(" AND ", $whereClause);
        }
        
        $sql .= " LIMIT 1";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch();
    }
    
    /**
     * Crear un nuevo registro
     */
    public function create($data) {
        $fields = array_keys($data);
        $placeholders = array_fill(0, count($fields), '?');
        
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($data));
        
        return $this->db->lastInsertId();
    }
    
    /**
     * Actualizar un registro
     */
    public function update($id, $data) {
        try {
            error_log("=== BASEMODEL UPDATE ===");
            error_log("Tabla: {$this->table}");
            error_log("ID: {$id}");
            error_log("Data: " . json_encode($data, JSON_PRETTY_PRINT));
            
            $fields = [];
            $params = [];
            
            foreach ($data as $field => $value) {
                $fields[] = "{$field} = ?";
                $params[] = $value;
                error_log("Campo: {$field} = " . (is_array($value) ? 'ARRAY' : $value));
            }
            
            $params[] = $id;
            
            $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE {$this->primaryKey} = ?";
            error_log("SQL generado: " . $sql);
            error_log("Parámetros: " . json_encode($params));
            
            $stmt = $this->db->prepare($sql);
            
            // Configurar PDO para lanzar excepciones
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            $result = $stmt->execute($params);
            
            error_log("Resultado execute: " . ($result ? 'SUCCESS' : 'FAILED'));
            error_log("Filas afectadas: " . $stmt->rowCount());
            
            return $result;
            
        } catch (PDOException $e) {
            error_log("💥 PDO EXCEPTION en BaseModel::update: " . $e->getMessage());
            error_log("Error SQLSTATE: " . $e->getCode());
            
            // Si es un error de duplicado, lanzar mensaje específico
            if ($e->getCode() == '23000' && strpos($e->getMessage(), 'Duplicate entry') !== false) {
                preg_match("/Duplicate entry '([^']+)' for key '([^']+)'/", $e->getMessage(), $matches);
                $duplicateValue = $matches[1] ?? '';
                $duplicateKey = $matches[2] ?? '';
                
                throw new Exception("El {$duplicateKey} '{$duplicateValue}' ya existe. Por favor, usa un valor diferente.");
            }
            
            throw $e;
            
        } catch (Exception $e) {
            error_log("💥 EXCEPTION en BaseModel::update: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            throw $e;
        }
    }
    
    /**
     * Eliminar un registro
     */
    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$id]);
    }
    
    /**
     * Contar registros
     */
    public function count($conditions = []) {
        $sql = "SELECT COUNT(*) FROM {$this->table}";
        $params = [];
        
        if (!empty($conditions)) {
            $whereClause = [];
            foreach ($conditions as $field => $value) {
                $whereClause[] = "{$field} = ?";
                $params[] = $value;
            }
            $sql .= " WHERE " . implode(" AND ", $whereClause);
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn();
    }
    
    /**
     * Ejecutar consulta personalizada
     */
    protected function query($sql, $params = []) {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    /**
     * Iniciar transacción
     */
    protected function beginTransaction() {
        return $this->db->beginTransaction();
    }
    
    /**
     * Confirmar transacción
     */
    protected function commit() {
        return $this->db->commit();
    }
    
    /**
     * Revertir transacción
     */
    protected function rollback() {
        return $this->db->rollback();
    }
}
?>

