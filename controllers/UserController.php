<?php
/**
 * Controlador de Usuarios (Administración)
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/User.php';

class UserController extends BaseController {
    private $userModel;
    
    public function __construct() {
        $this->userModel = new User();
    }
    
    /**
     * Obtener todos los usuarios (solo administradores)
     */
    public function getAll() {
        try {
            $this->requireAdmin();
            
            $params = $this->getQueryParams();
            $limit = isset($params['limit']) ? (int)$params['limit'] : null;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
            
            $users = $this->userModel->getAllUsers($limit, $offset);
            $usersArray = array_map([$this->userModel, 'toArray'], $users);
            
            $this->jsonResponse($usersArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener usuario por ID (solo administradores)
     */
    public function getById($params) {
        try {
            $this->requireAdmin();
            
            $id = $params['id'] ?? null;
            if (!is_numeric($id)) {
                $this->errorResponse('ID de usuario inválido', 400);
            }
            
            $user = $this->userModel->getById($id);
            if (!$user) {
                $this->errorResponse('Usuario no encontrado', 404);
            }
            
            $this->jsonResponse($this->userModel->toArray($user));
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Crear nuevo usuario (solo administradores)
     */
    public function create() {
        try {
            $this->requireAdmin();
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar campos requeridos
            $this->validateRequired($data, ['name', 'email', 'password']);
            
            // Validar email
            if (!$this->validateEmail($data['email'])) {
                $this->errorResponse('Email inválido', 400);
            }
            
            // Verificar si el email ya existe
            if ($this->userModel->emailExists($data['email'])) {
                $this->errorResponse('El email ya está registrado', 400);
            }
            
            // Validar contraseña
            if (strlen($data['password']) < 6) {
                $this->errorResponse('La contraseña debe tener al menos 6 caracteres', 400);
            }
            
            // Crear usuario
            $userId = $this->userModel->createUser($data);
            $user = $this->userModel->getById($userId);
            
            $this->successResponse(
                'Usuario creado correctamente',
                $this->userModel->toArray($user),
                201
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Actualizar usuario (solo administradores)
     */
    public function update($params) {
        try {
            $this->requireAdmin();
            
            $id = $params['id'] ?? null;
            if (!is_numeric($id)) {
                $this->errorResponse('ID de usuario inválido', 400);
            }
            
            $user = $this->userModel->getById($id);
            if (!$user) {
                $this->errorResponse('Usuario no encontrado', 404);
            }
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar email si se proporciona
            if (isset($data['email'])) {
                if (!$this->validateEmail($data['email'])) {
                    $this->errorResponse('Email inválido', 400);
                }
                
                if ($this->userModel->emailExists($data['email'], $id)) {
                    $this->errorResponse('El email ya está registrado', 400);
                }
            }
            
            // Validar contraseña si se proporciona
            if (isset($data['password']) && !empty($data['password'])) {
                if (strlen($data['password']) < 6) {
                    $this->errorResponse('La contraseña debe tener al menos 6 caracteres', 400);
                }
                // Hash de la contraseña
                $data['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
                unset($data['password']);
            }
            
            // Obtener usuario actual para validaciones
            $currentUser = $this->getCurrentUser();
            
            // Validaciones específicas para campos sensibles
            if (isset($data['es_admin'])) {
                // Solo super admin puede cambiar roles de admin
                if (!$currentUser['es_admin']) {
                    $this->errorResponse('No tienes permisos para cambiar roles de administrador', 403);
                }
                
                // No permitir que un admin se quite sus propios permisos de admin
                if ($currentUser['id'] == $id && !$data['es_admin']) {
                    $this->errorResponse('No puedes quitarte tus propios permisos de administrador', 400);
                }
                
                // No permitir quitar permisos de admin si es el último administrador
                if (!$data['es_admin'] && $user['es_admin']) {
                    $adminCount = $this->userModel->count(['es_admin' => 1, 'activo' => 1]);
                    if ($adminCount <= 1) {
                        $this->errorResponse('No se puede quitar permisos al último administrador activo', 400);
                    }
                }
            }
            
            if (isset($data['activo'])) {
                // Solo admin puede cambiar estado activo/inactivo
                if (!$currentUser['es_admin']) {
                    $this->errorResponse('No tienes permisos para cambiar el estado de usuarios', 403);
                }
                
                // No permitir que un admin se desactive a sí mismo
                if ($currentUser['id'] == $id && !$data['activo']) {
                    $this->errorResponse('No puedes desactivar tu propia cuenta', 400);
                }
                
                // No permitir desactivar el último administrador
                if (!$data['activo'] && $user['es_admin']) {
                    $adminCount = $this->userModel->count(['es_admin' => 1, 'activo' => 1]);
                    if ($adminCount <= 1) {
                        $this->errorResponse('No se puede desactivar al último administrador', 400);
                    }
                }
            }
            
            // Preparar datos para actualización
            $allowedFields = ['name', 'email', 'telefono', 'direccion'];
            
            // Campos adicionales solo para administradores
            if ($currentUser['es_admin']) {
                $allowedFields = array_merge($allowedFields, ['es_admin', 'activo']);
            }
            
            // Password hash se permite si se proporcionó contraseña
            if (isset($data['password_hash'])) {
                $allowedFields[] = 'password_hash';
            }
            
            $updateData = [];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            // Actualizar usuario directamente
            $success = $this->userModel->update($id, $updateData);
            
            if (!$success) {
                $this->errorResponse('Error al actualizar el usuario', 500);
            }
            
            $user = $this->userModel->getById($id);
            
            $this->successResponse(
                'Usuario actualizado correctamente',
                $this->userModel->toArray($user)
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Eliminar usuario (solo administradores)
     */
    public function delete($params) {
        try {
            $this->requireAdmin();
            
            $id = $params['id'] ?? null;
            if (!is_numeric($id)) {
                $this->errorResponse('ID de usuario inválido', 400);
            }
            
            $user = $this->userModel->getById($id);
            if (!$user) {
                $this->errorResponse('Usuario no encontrado', 404);
            }
            
            // No permitir eliminar el último administrador
            if ($user['es_admin']) {
                $adminCount = $this->userModel->count(['es_admin' => 1]);
                if ($adminCount <= 1) {
                    $this->errorResponse('No se puede eliminar el último administrador', 400);
                }
            }
            
            // Eliminación permanente
            $success = $this->userModel->delete($id);
            
            if (!$success) {
                $this->errorResponse('Error al eliminar el usuario', 500);
            }
            
            $this->successResponse('Usuario eliminado permanentemente');
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener perfil del usuario actual
     */
    public function getProfile($params) {
        try {
            $this->requireAuth();
            
            $userId = $params['id'] ?? null;
            $currentUser = $this->getCurrentUser();
            
            // Verificar que el usuario solo puede acceder a su propio perfil
            // (excepto administradores que pueden ver cualquier perfil)
            if (!$currentUser['es_admin'] && $currentUser['id'] != $userId) {
                $this->errorResponse('No tienes permisos para acceder a este perfil', 403);
            }
            
            if (!is_numeric($userId)) {
                $this->errorResponse('ID de usuario inválido', 400);
            }
            
            $user = $this->userModel->getById($userId);
            if (!$user) {
                $this->errorResponse('Usuario no encontrado', 404);
            }
            
            // No devolver información sensible
            unset($user['password_hash']);
            
            $this->jsonResponse($user);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Actualizar perfil del usuario actual
     */
    public function updateProfile($params) {
        try {
            $this->requireAuth();
            
            $userId = $params['id'] ?? null;
            $currentUser = $this->getCurrentUser();
            
            // Verificar que el usuario solo puede actualizar su propio perfil
            if ($currentUser['id'] != $userId) {
                $this->errorResponse('No tienes permisos para actualizar este perfil', 403);
            }
            
            if (!is_numeric($userId)) {
                $this->errorResponse('ID de usuario inválido', 400);
            }
            
            $data = $this->getJsonInput();
            
            // Validaciones
            if (empty($data['name'])) {
                $this->errorResponse('El nombre es obligatorio', 400);
            }
            
            if (empty($data['email'])) {
                $this->errorResponse('El email es obligatorio', 400);
            }
            
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $this->errorResponse('Email no válido', 400);
            }
            
            // Verificar si el email ya existe (en otro usuario)
            $existingUser = $this->userModel->getByEmail($data['email']);
            if ($existingUser && $existingUser['id'] != $userId) {
                $this->errorResponse('El email ya está en uso', 409);
            }
            
            // Preparar datos para actualizar
            $updateData = [
                'name' => trim($data['name']),
                'email' => trim($data['email']),
                'telefono' => isset($data['telefono']) ? trim($data['telefono']) : null,
                'direccion' => isset($data['direccion']) ? trim($data['direccion']) : null
            ];
            
            $success = $this->userModel->update($userId, $updateData);
            
            if (!$success) {
                $this->errorResponse('Error al actualizar el perfil', 500);
            }
            
            // Obtener usuario actualizado
            $updatedUser = $this->userModel->getById($userId);
            unset($updatedUser['password_hash']);
            
            $this->successResponse('Perfil actualizado correctamente', $updatedUser);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Cambiar contraseña del usuario actual
     */
    public function changePassword($params) {
        try {
            $this->requireAuth();
            
            $userId = $params['id'] ?? null;
            $currentUser = $this->getCurrentUser();
            
            // Verificar que el usuario solo puede cambiar su propia contraseña
            if ($currentUser['id'] != $userId) {
                $this->errorResponse('No tienes permisos para cambiar esta contraseña', 403);
            }
            
            if (!is_numeric($userId)) {
                $this->errorResponse('ID de usuario inválido', 400);
            }
            
            $data = $this->getJsonInput();
            
            // Validaciones
            if (empty($data['current_password']) || empty($data['new_password'])) {
                $this->errorResponse('Contraseña actual y nueva contraseña son obligatorias', 400);
            }
            
            if (strlen($data['new_password']) < 6) {
                $this->errorResponse('La nueva contraseña debe tener al menos 6 caracteres', 400);
            }
            
            // Verificar contraseña actual
            $user = $this->userModel->getById($userId);
            if (!$user || !password_verify($data['current_password'], $user['password_hash'])) {
                $this->errorResponse('Contraseña actual incorrecta', 400);
            }
            
            // Verificar que la nueva contraseña sea diferente
            if (password_verify($data['new_password'], $user['password_hash'])) {
                $this->errorResponse('La nueva contraseña debe ser diferente a la actual', 400);
            }
            
            // Actualizar contraseña
            $newPasswordHash = password_hash($data['new_password'], PASSWORD_DEFAULT);
            $success = $this->userModel->update($userId, ['password_hash' => $newPasswordHash]);
            
            if (!$success) {
                $this->errorResponse('Error al cambiar la contraseña', 500);
            }
            
            $this->successResponse('Contraseña actualizada correctamente');
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener estadísticas de usuarios (solo administradores)
     */
    public function getStats() {
        try {
            $this->requireAdmin();
            
            $stats = $this->userModel->getStats();
            $this->jsonResponse($stats);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>

