<?php
/**
 * Controlador de Categorías
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Categoria.php';

class CategoriaController extends BaseController {
    private $categoriaModel;
    
    public function __construct() {
        $this->categoriaModel = new Categoria();
    }
    
    /**
     * Obtener todas las categorías
     */
    public function getAll() {
        try {
            $params = $this->getQueryParams();
            $withCount = $params['with_count'] ?? false;
            
            if ($withCount === 'true') {
                $categorias = $this->categoriaModel->getWithProductCount();
            } else {
                $categorias = $this->categoriaModel->getAllActive();
            }
            
            $categoriasArray = array_map([$this->categoriaModel, 'toArray'], $categorias);
            
            $this->jsonResponse($categoriasArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener categoría por ID
     */
    public function getById($params) {
        $id = is_array($params) ? ($params['id'] ?? null) : $params;        
        try {
            if (!is_numeric($id)) {
                $this->errorResponse('ID de categoría inválido' . $id , 400);
            }
            
            $categoria = $this->categoriaModel->getById($id);
            
            if (!$categoria) {
                $this->errorResponse('Categoría no encontrada', 404);
            }
            
            $this->jsonResponse($this->categoriaModel->toArray($categoria));
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Crear nueva categoría (solo administradores)
     */
    public function create() {
        try {
            $this->requireAdmin();
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Validar campos requeridos
            $this->validateRequired($data, ['nombre']);
            
            // Verificar si el nombre ya existe
            if ($this->categoriaModel->nombreExists($data['nombre'])) {
                $this->errorResponse('Ya existe una categoría con ese nombre', 400);
            }
            
            // Crear categoría
            $categoriaId = $this->categoriaModel->createCategoria($data);
            $categoria = $this->categoriaModel->getById($categoriaId);
            
            $this->successResponse(
                'Categoría creada correctamente',
                $this->categoriaModel->toArray($categoria),
                201
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Actualizar categoría (solo administradores)
     */
    public function update($id) {
        try {
            $this->requireAdmin();
            
            if (!is_numeric($id)) {
                $this->errorResponse('ID de categoría inválido', 400);
            }
            
            $categoria = $this->categoriaModel->getById($id);
            if (!$categoria) {
                $this->errorResponse('Categoría no encontrada', 404);
            }
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);
            
            // Verificar si el nombre ya existe (excluyendo la categoría actual)
            if (isset($data['nombre']) && $this->categoriaModel->nombreExists($data['nombre'], $id)) {
                $this->errorResponse('Ya existe una categoría con ese nombre', 400);
            }
            
            // Actualizar categoría
            $success = $this->categoriaModel->updateCategoria($id, $data);
            
            if (!$success) {
                $this->errorResponse('Error al actualizar la categoría', 500);
            }
            
            $categoria = $this->categoriaModel->getById($id);
            
            $this->successResponse(
                'Categoría actualizada correctamente',
                $this->categoriaModel->toArray($categoria)
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Eliminar categoría (solo administradores)
     */
    public function delete($id) {
        try {
            $this->requireAdmin();
            
            if (!is_numeric($id)) {
                $this->errorResponse('ID de categoría inválido', 400);
            }
            
            $categoria = $this->categoriaModel->getById($id);
            if (!$categoria) {
                $this->errorResponse('Categoría no encontrada', 404);
            }
            
            // Eliminar categoría (soft delete)
            $success = $this->categoriaModel->deleteCategoria($id);
            
            if (!$success) {
                $this->errorResponse('Error al eliminar la categoría', 500);
            }
            
            $this->successResponse('Categoría eliminada correctamente');
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Buscar categorías
     */
    public function search() {
        try {
            $params = $this->getQueryParams();
            $term = $params['q'] ?? '';
            
            if (empty($term)) {
                $this->errorResponse('Término de búsqueda requerido', 400);
            }
            
            $categorias = $this->categoriaModel->search($term);
            $categoriasArray = array_map([$this->categoriaModel, 'toArray'], $categorias);
            
            $this->jsonResponse($categoriasArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener categorías con conteo de productos
     */
    public function getWithProductCount() {
        try {
            $categorias = $this->categoriaModel->getWithProductCount();
            $categoriasArray = array_map([$this->categoriaModel, 'toArray'], $categorias);
            
            $this->jsonResponse($categoriasArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener estadísticas de categorías (solo administradores)
     */
    public function getStats() {
        try {
            $this->requireAdmin();
            
            $stats = $this->categoriaModel->getStats();
            $this->jsonResponse($stats);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>
