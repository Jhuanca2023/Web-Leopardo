<?php
/**
 * Controlador de Autenticación
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/User.php';

class AuthController extends BaseController {
    private $userModel;
    
    public function __construct() {
        $this->userModel = new User();
    }
    
    /**
     * Registrar nuevo usuario
     */
    public function register() {
        try {
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
            
            // Iniciar sesión
            session_start();
            $_SESSION['usuario_id'] = $user['id'];
            $_SESSION['es_admin'] = $user['es_admin'];
            
            $this->successResponse(
                'Usuario registrado correctamente',
                $this->userModel->toArray($user),
                201
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Iniciar sesión
     */
    public function login() {
        try {
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar campos requeridos
            $this->validateRequired($data, ['email', 'password']);
            
            // Validar email
            if (!$this->validateEmail($data['email'])) {
                $this->errorResponse('Email inválido', 400);
            }
            
            // Verificar credenciales
            $user = $this->userModel->verifyCredentials($data['email'], $data['password']);
            
            if (!$user) {
                $this->errorResponse('Credenciales inválidas', 401);
            }
            
            // Iniciar sesión
            session_start();
            $_SESSION['usuario_id'] = $user['id'];
            $_SESSION['es_admin'] = $user['es_admin'];
            
            $this->successResponse(
                'Inicio de sesión exitoso',
                $this->userModel->toArray($user)
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Cerrar sesión
     */
    public function logout() {
        try {
            session_start();
            session_destroy();
            
            $this->successResponse('Sesión cerrada correctamente');
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener perfil del usuario autenticado
     */
    public function getProfile() {
        try {
            $usuarioId = $this->requireAuth();
            
            $user = $this->userModel->getById($usuarioId);
            if (!$user) {
                $this->errorResponse('Usuario no encontrado', 404);
            }
            
            $this->jsonResponse($this->userModel->toArray($user));
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Actualizar perfil del usuario autenticado
     */
    public function updateProfile() {
        try {
            $usuarioId = $this->requireAuth();
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar email si se proporciona
            if (isset($data['email'])) {
                if (!$this->validateEmail($data['email'])) {
                    $this->errorResponse('Email inválido', 400);
                }
                
                if ($this->userModel->emailExists($data['email'], $usuarioId)) {
                    $this->errorResponse('El email ya está registrado', 400);
                }
            }
            
            // Validar contraseña si se proporciona
            if (isset($data['password']) && !empty($data['password'])) {
                if (strlen($data['password']) < 6) {
                    $this->errorResponse('La contraseña debe tener al menos 6 caracteres', 400);
                }
            }
            
            // Actualizar perfil
            $success = $this->userModel->updateProfile($usuarioId, $data);
            
            if (!$success) {
                $this->errorResponse('Error al actualizar el perfil', 500);
            }
            
            $user = $this->userModel->getById($usuarioId);
            
            $this->successResponse(
                'Perfil actualizado correctamente',
                $this->userModel->toArray($user)
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Verificar estado de autenticación
     */
    public function checkAuth() {
        try {
            session_start();
            
            if (!isset($_SESSION['usuario_id'])) {
                $this->jsonResponse(['authenticated' => false]);
            }
            
            $user = $this->userModel->getById($_SESSION['usuario_id']);
            if (!$user) {
                session_destroy();
                $this->jsonResponse(['authenticated' => false]);
            }
            
            $this->jsonResponse([
                'authenticated' => true,
                'user' => $this->userModel->toArray($user)
            ]);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Cambiar contraseña
     */
    public function changePassword() {
        try {
            $usuarioId = $this->requireAuth();
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar campos requeridos
            $this->validateRequired($data, ['current_password', 'new_password']);
            
            // Obtener usuario actual
            $user = $this->userModel->getById($usuarioId);
            if (!$user) {
                $this->errorResponse('Usuario no encontrado', 404);
            }
            
            // Verificar contraseña actual
            if (!password_verify($data['current_password'], $user['password_hash'])) {
                $this->errorResponse('Contraseña actual incorrecta', 400);
            }
            
            // Validar nueva contraseña
            if (strlen($data['new_password']) < 6) {
                $this->errorResponse('La nueva contraseña debe tener al menos 6 caracteres', 400);
            }
            
            // Actualizar contraseña
            $success = $this->userModel->updateProfile($usuarioId, [
                'password' => $data['new_password']
            ]);
            
            if (!$success) {
                $this->errorResponse('Error al cambiar la contraseña', 500);
            }
            
            $this->successResponse('Contraseña cambiada correctamente');
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>

