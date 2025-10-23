<?php
/**
 * Modelo de Usuario
 */

require_once __DIR__ . '/BaseModel.php';

class User extends BaseModel {
    protected $table = 'users';
    
    /**
     * Crear un nuevo usuario
     */
    public function createUser($data) {
        $userData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'password_hash' => $this->hashPassword($data['password']),
            'telefono' => $data['telefono'] ?? null,
            'direccion' => $data['direccion'] ?? null,
            // Asegura que es_admin sea 0 o 1
            'es_admin' => isset($data['es_admin']) ? ($data['es_admin'] ? 1 : 0) : 0
        ];
        
        return $this->create($userData);
    }
    
    /**
     * Crear usuario administrador
     */
    public function createAdmin($name, $email, $password, $telefono = null, $direccion = null) {
        $userData = [
            'name' => $name,
            'email' => $email,
            'password_hash' => $this->hashPassword($password),
            'telefono' => $telefono,
            'direccion' => $direccion,
            'es_admin' => true
        ];
        
        return $this->create($userData);
    }
    
    /**
     * Verificar credenciales de login
     */
    public function verifyCredentials($email, $password) {
        $user = $this->getBy(['email' => $email]);
        
        if ($user && $this->verifyPassword($password, $user['password_hash'])) {
            return $user;
        }
        
        return false;
    }
    
    /**
     * Actualizar perfil de usuario
     */
    public function updateProfile($id, $data) {
        $allowedFields = ['name', 'telefono', 'direccion'];
        $updateData = [];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        // Si se proporciona nueva contraseña
        if (isset($data['password']) && !empty($data['password'])) {
            $updateData['password_hash'] = $this->hashPassword($data['password']);
        }
        
        if (!empty($updateData)) {
            return $this->update($id, $updateData);
        }
        
        return false;
    }
    
    /**
     * Obtener usuario por email
     */
    public function getByEmail($email) {
        return $this->getBy(['email' => $email]);
    }
    
    /**
     * Verificar si el email ya existe
     */
    public function emailExists($email, $excludeId = null) {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE email = ?";
        $params = [$email];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchColumn() > 0;
    }
    
    /**
     * Obtener todos los usuarios (para administración)
     */
    public function getAllUsers($limit = null, $offset = 0) {
        $sql = "SELECT * FROM {$this->table} ORDER BY fecha_creacion DESC";
        
        if ($limit) {
            $sql .= " LIMIT {$limit} OFFSET {$offset}";
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Convertir usuario a array (sin password)
     */
    public function toArray($user) {
        if (!$user) {
            return null;
        }
        
        unset($user['password_hash']);
        return $user;
    }
    
    /**
     * Hash de contraseña
     */
    private function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }
    
    /**
     * Verificar contraseña
     */
    private function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Obtener estadísticas de usuarios
     */
    public function getStats() {
        $stats = [];
        
        // Total de usuarios
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table}");
        $stmt->execute();
        $stats['total'] = $stmt->fetchColumn();
        
        // Usuarios administradores
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE es_admin = 1");
        $stmt->execute();
        $stats['admins'] = $stmt->fetchColumn();
        
        // Usuarios registrados este mes
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE MONTH(fecha_creacion) = MONTH(CURRENT_DATE()) AND YEAR(fecha_creacion) = YEAR(CURRENT_DATE())");
        $stmt->execute();
        $stats['this_month'] = $stmt->fetchColumn();
        
        return $stats;
    }
}
?>

