<?php
/**
 * Controlador de Productos
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Producto.php';
require_once __DIR__ . '/../models/Categoria.php';

class ProductoController extends BaseController {
    private $productoModel;
    private $categoriaModel;
    
    public function __construct() {
        $this->productoModel = new Producto();
        $this->categoriaModel = new Categoria();
    }
    
    /**
     * Subir nuevas imágenes al servidor (solo administradores)
     */
    public function postImagen($params = null)
    {
        try {
            error_log("=== INICIO postImagen ===");

            $this->requireAdmin(); // Quita si no usas autenticación de admin

            if (empty($_FILES)) {
                error_log("❌ No se recibieron archivos");
                return $this->errorResponse('No se recibieron archivos', 400);
            }

            $directorioDestino = $_SERVER['DOCUMENT_ROOT'] . '/assets/images/';
            if (!is_dir($directorioDestino)) {
                mkdir($directorioDestino, 0775, true);
                error_log("📁 Directorio creado: $directorioDestino");
            }

            $subidas = [];
            $errores = [];

            foreach ($_FILES as $nombreCampo => $archivo) {
                // Limpia el nombre (reemplaza espacios y caracteres especiales)
                $nombreLimpio = preg_replace('/[^A-Za-z0-9_\.-]/', '_', basename($archivo['name']));
                $rutaDestino = $directorioDestino . $nombreLimpio;

                if (is_uploaded_file($archivo['tmp_name'])) {
                    if (move_uploaded_file($archivo['tmp_name'], $rutaDestino)) {
                        $rutaPublica = '/assets/images/' . $nombreLimpio;
                        $subidas[] = $rutaPublica;
                        error_log("✅ Imagen subida correctamente: $rutaPublica");
                    } else {
                        $errores[] = $archivo['name'];
                        error_log("❌ Error al mover el archivo: " . $archivo['name']);
                    }
                } else {
                    $errores[] = $archivo['name'];
                    error_log("❌ Archivo no válido: " . $archivo['name']);
                }
            }

            if (!empty($errores)) {
                return $this->errorResponse([
                    'mensaje' => 'Algunas imágenes no se pudieron subir',
                    'errores' => $errores,
                    'subidas' => $subidas
                ], 207); // 207 Multi-Status
            }

            return $this->successResponse([
                'mensaje' => 'Imágenes subidas correctamente',
                'subidas' => $subidas
            ]);
        } catch (Exception $e) {
            error_log("💥 EXCEPTION en postImagen: " . $e->getMessage());
            return $this->handleException($e);
        }
    }

    /**
     * Eliminar imágenes del servidor (solo administradores)
     */
    public function deleteImagen($params = null)
    {
        try {
            error_log("=== INICIO deleteImagen ===");

            $this->requireAdmin(); // Quita si no usas autenticación

            $input = json_decode(file_get_contents("php://input"), true);
            $rutas = $input['rutas'] ?? [];

            if (empty($rutas) || !is_array($rutas)) {
                error_log("❌ No se proporcionaron rutas válidas");
                return $this->errorResponse('No se proporcionaron rutas válidas', 400);
            }

            $eliminadas = [];
            $noEncontradas = [];

            foreach ($rutas as $ruta) {
                // Elimina solo archivos dentro de assets/images/ por seguridad
                $rutaRelativa = str_replace(['..', '\\'], '', $ruta);
                $rutaAbsoluta = $_SERVER['DOCUMENT_ROOT'] . $rutaRelativa;

                if (file_exists($rutaAbsoluta)) {
                    if (unlink($rutaAbsoluta)) {
                        $eliminadas[] = $rutaRelativa;
                        error_log("🗑️ Imagen eliminada: $rutaRelativa");
                    } else {
                        error_log("⚠️ No se pudo eliminar: $rutaRelativa");
                    }
                } else {
                    $noEncontradas[] = $rutaRelativa;
                    error_log("❌ Imagen no encontrada: $rutaRelativa");
                }
            }

            return $this->successResponse([
                'mensaje' => 'Proceso de eliminación completado',
                'eliminadas' => $eliminadas,
                'no_encontradas' => $noEncontradas
            ]);
        } catch (Exception $e) {
            error_log("💥 EXCEPTION en deleteImagen: " . $e->getMessage());
            return $this->handleException($e);
        }
    }
    
    /**
     * Obtener todos los productos
     */
    public function getAllProducts() {
        try {
            $params = $this->getQueryParams();
            
            $categoriaId = $params['categoria_id'] ?? null;
            $destacados = $params['destacados'] ?? null;
            $busqueda = $params['q'] ?? null;
            $limit = isset($params['limit']) ? (int)$params['limit'] : null;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
            
            if ($categoriaId) {
                $productos = $this->productoModel->getByCategoria($categoriaId, $limit, $offset);
            } elseif ($destacados === 'true') {
                $productos = $this->productoModel->getDestacados($limit);
            } elseif ($busqueda) {
                $productos = $this->productoModel->search($busqueda, $limit, $offset);
            } else {
                $productos = $this->productoModel->getAllProductos($limit, $offset);
            }
            
            $productosArray = array_map([$this->productoModel, 'toArray'], $productos);
            
            $this->jsonResponse($productosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener todos los productos
     */
    public function getAll() {
        try {
            $params = $this->getQueryParams();
            
            $categoriaId = $params['categoria_id'] ?? null;
            $destacados = $params['destacados'] ?? null;
            $busqueda = $params['q'] ?? null;
            $limit = isset($params['limit']) ? (int)$params['limit'] : null;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
            
            if ($categoriaId) {
                $productos = $this->productoModel->getByCategoria($categoriaId, $limit, $offset);
            } elseif ($destacados === 'true') {
                $productos = $this->productoModel->getDestacados($limit);
            } elseif ($busqueda) {
                $productos = $this->productoModel->search($busqueda, $limit, $offset);
            } else {
                $productos = $this->productoModel->getAllActive($limit, $offset);
            }
            
            $productosArray = array_map([$this->productoModel, 'toArray'], $productos);
            
            $this->jsonResponse($productosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener producto por ID
     */
    public function getById($params) {
        try {
            $id = is_array($params) ? ($params['id'] ?? null) : $params;
            if (!is_numeric($id)) {
                $this->errorResponse('ID de producto inválido', 400);
            }
            
            $producto = $this->productoModel->getByIdWithCategory($id);
            
            if (!$producto) {
                $this->errorResponse('Producto no encontrado', 404);
            }
            
            $this->jsonResponse($this->productoModel->toArray($producto));
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Crear nuevo producto (solo administradores)
     */
    public function create() {
        try {
            $this->requireAdmin();
            
            $data = $this->getJsonInput();
            $data = $this->sanitizeInput($data);

            // Procesar campos JSON si vienen como string
            if (isset($data['imagenes_adicionales']) && is_string($data['imagenes_adicionales'])) {
                $json = json_decode($data['imagenes_adicionales'], true);
                $data['imagenes_adicionales'] = is_array($json) ? $json : [];
            }
            if (isset($data['caracteristicas']) && is_string($data['caracteristicas'])) {
                $json = json_decode($data['caracteristicas'], true);
                $data['caracteristicas'] = is_array($json) ? $json : [];
            }
            // Procesar tallas_stock si viene como string (ejemplo: "38:10,39:5,40:8")
            if (isset($data['tallas_stock']) && is_string($data['tallas_stock'])) {
                $tallas = [];
                $pairs = explode(',', $data['tallas_stock']);
                foreach ($pairs as $pair) {
                    $parts = explode(':', $pair);
                    if (count($parts) === 2) {
                        $talla = trim($parts[0]);
                        $stock = (int)trim($parts[1]);
                        if ($talla !== '' && $stock >= 0) {
                            $tallas[$talla] = $stock;
                        }
                    }
                }
                $data['tallas_stock'] = $tallas;
            }

            // Validar campos requeridos (adaptados al nuevo modelo)
            $required = ['codigo', 'nombre', 'descripcion', 'precio', 'categoria_id'];
            $this->validateRequired($data, $required);

            // Validar precio
            if (!$this->validateNumber($data['precio'], 0)) {
                $this->errorResponse('Precio inválido', 400);
            }

            // Validar tallas_stock si se proporciona
            if (isset($data['tallas_stock']) && is_array($data['tallas_stock'])) {
                foreach ($data['tallas_stock'] as $talla => $stock) {
                    $talla = (string)$talla;
                    if (!is_numeric($stock)|| !is_numeric($stock) || $stock < 0) {
                        $this->errorResponse('Formato de tallas/stock inválido', 400);
                    }
                }
            }

            if (!is_numeric($data['categoria_id'])) {
                $this->errorResponse('ID de categoría inválido', 400);
            }

            // Verificar que la categoría existe
            $categoria = $this->categoriaModel->getById($data['categoria_id']);
            if (!$categoria) {
                $this->errorResponse('Categoría no encontrada', 404);
            }

            // Crear producto
            $productoId = $this->productoModel->createProducto($data);
            $producto = $this->productoModel->getByIdWithCategory($productoId);

            $this->successResponse(
                'Producto creado correctamente',
                $this->productoModel->toArray($producto),
                201
            );
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Actualizar producto (solo administradores)
     */
    public function update($params) {
        try {
            error_log("=== INICIO UPDATE PRODUCTO ===");
            
            $id = is_array($params) ? ($params['id'] ?? null) : $params;
            error_log("Product ID: " . $id);
            error_log("Params recibidos: " . json_encode($params));

            $this->requireAdmin();
            error_log("✅ Admin verificado");
            
            if (!is_numeric($id)) {
                error_log("❌ ID inválido: " . $id);
                $this->errorResponse('ID de producto inválido', 400);
            }
            
            $producto = $this->productoModel->getById($id);
            if (!$producto) {
                error_log("❌ Producto no encontrado con ID: " . $id);
                $this->errorResponse('Producto no encontrado', 404);
            }
            error_log("✅ Producto existente encontrado: " . $producto['nombre']);
            
            $rawInput = file_get_contents('php://input');
            error_log("📥 Raw input recibido: " . $rawInput);
            
            $data = $this->getJsonInput();
            error_log("📦 Datos parseados JSON: " . json_encode($data, JSON_PRETTY_PRINT));
            
            $data = $this->sanitizeInput($data);
            error_log("🧹 Datos sanitizados: " . json_encode($data, JSON_PRETTY_PRINT));

            // Procesar campos JSON si vienen como string
            if (isset($data['imagenes_adicionales']) && is_string($data['imagenes_adicionales'])) {
                $json = json_decode($data['imagenes_adicionales'], true);
                $data['imagenes_adicionales'] = is_array($json) ? $json : [];
                error_log("🖼️ Imágenes adicionales procesadas: " . json_encode($data['imagenes_adicionales']));
            }
            if (isset($data['caracteristicas']) && is_string($data['caracteristicas'])) {
                $json = json_decode($data['caracteristicas'], true);
                $data['caracteristicas'] = is_array($json) ? $json : [];
                error_log("🏷️ Características procesadas: " . json_encode($data['caracteristicas']));
            }
            // Procesar tallas_stock si viene como string (ejemplo: "38:10,39:5,40:8")
            if (isset($data['tallas_stock']) && is_string($data['tallas_stock'])) {
                error_log("👟 Tallas_stock es string: " . $data['tallas_stock']);
                $tallas = [];
                $pairs = explode(',', $data['tallas_stock']);
                foreach ($pairs as $pair) {
                    $parts = explode(':', $pair);
                    if (count($parts) === 2) {
                        $talla = trim($parts[0]);
                        $stock = (int)trim($parts[1]);
                        if ($talla !== '' && $stock >= 0) {
                            $tallas[$talla] = $stock;
                        }
                    }
                }
                $data['tallas_stock'] = $tallas;
                error_log("👟 Tallas_stock procesadas: " . json_encode($tallas));
            } else {
                error_log("👟 Tallas_stock recibidas como: " . gettype($data['tallas_stock']) . " = " . json_encode($data['tallas_stock']));
            }

            // Validar precio si se proporciona
            if (isset($data['precio']) && !$this->validateNumber($data['precio'], 0)) {
                error_log("❌ Precio inválido: " . $data['precio']);
                $this->errorResponse('Precio inválido', 400);
            }
            error_log("✅ Precio válido: " . ($data['precio'] ?? 'no proporcionado'));

            if (isset($data['tallas_stock']) && is_array($data['tallas_stock'])) {
                error_log("🔍 Validando tallas_stock array:");
                foreach ($data['tallas_stock'] as $talla => $stock) {
                    error_log("  - Talla: $talla, Stock: $stock (tipo: " . gettype($stock) . ")");
                    $talla = (string)$talla;
                    if (!is_numeric($stock) || $stock < 0) {
                        error_log("❌ Formato de tallas/stock inválido: talla=$talla, stock=$stock");
                        $this->errorResponse('Formato de tallas/stock inválido', 400);
                    }
                }
                error_log("✅ Todas las tallas/stock son válidas");
            }

            // Validar categoria_id si se proporciona
            if (isset($data['categoria_id']) && !is_numeric($data['categoria_id'])) {
                error_log("❌ ID de categoría inválido: " . $data['categoria_id']);
                $this->errorResponse('ID de categoría inválido', 400);
            }
            error_log("✅ Categoria_id válida: " . ($data['categoria_id'] ?? 'no proporcionada'));

            // Verificar categoría si se proporciona
            if (isset($data['categoria_id'])) {
                $categoria = $this->categoriaModel->getById($data['categoria_id']);
                if (!$categoria) {
                    error_log("❌ Categoría no encontrada: " . $data['categoria_id']);
                    $this->errorResponse('Categoría no encontrada', 404);
                }
                error_log("✅ Categoría encontrada: " . $categoria['nombre']);
            }

            error_log("📤 Enviando datos al modelo updateProducto:");
            error_log("ID: " . $id);
            error_log("Data: " . json_encode($data, JSON_PRETTY_PRINT));

            // Actualizar producto
            $success = $this->productoModel->updateProducto($id, $data);

            if (!$success) {
                error_log("❌ updateProducto retornó false");
                $this->errorResponse('Error al actualizar el producto', 500);
            }

            error_log("✅ updateProducto exitoso");
            $producto = $this->productoModel->getByIdWithCategory($id);
            error_log("✅ Producto actualizado obtenido: " . json_encode($producto));

            $this->successResponse(
                'Producto actualizado correctamente',
                $this->productoModel->toArray($producto)
            );
            
        } catch (Exception $e) {
            error_log("💥 EXCEPTION en update: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            $this->handleException($e);
        }
    }
    
    /**
     * Eliminar producto (solo administradores)
     */
    public function delete($params) {
        try {
            $id = is_array($params) ? ($params['id'] ?? null) : $params;
            $this->requireAdmin();
            
            if (!is_numeric($id)) {
                $this->errorResponse('ID de producto inválido', 400);
            }
            
            $producto = $this->productoModel->getById($id);
            if (!$producto) {
                $this->errorResponse('Producto no encontrado', 404);
            }
            
            // Soft delete
            $success = $this->productoModel->deleteProducto($id);
            
            if (!$success) {
                $this->errorResponse('Error al eliminar el producto', 500);
            }
            
            $this->successResponse('Producto eliminado correctamente');
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /* Obtener Productos por categoria */
    public function getByCategoria($params) {
        $id = is_array($params) ? ($params['id'] ?? null) : $params;
        try {
            if (!is_numeric($id)) {
                $this->errorResponse('ID de categoría inválido: ' . $id, 400);
            }

            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

            $productos = $this->productoModel->getByCategoria($id, $limit, $offset);
            $productosArray = array_map([$this->productoModel, 'toArray'], $productos);

            $this->jsonResponse($productosArray);

        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener productos destacados
     */
    public function getDestacados() {
        try {
            $params = $this->getQueryParams();
            $limit = isset($params['limit']) ? (int)$params['limit'] : null;
            
            $productos = $this->productoModel->getDestacados($limit);
            $productosArray = array_map([$this->productoModel, 'toArray'], $productos);
            
            $this->jsonResponse($productosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Buscar productos
     */
    public function search() {
        try {
            $params = $this->getQueryParams();
            $term = $params['q'] ?? '';
            $limit = isset($params['limit']) ? (int)$params['limit'] : null;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
            
            if (empty($term)) {
                $this->errorResponse('Término de búsqueda requerido', 400);
            }
            
            $productos = $this->productoModel->search($term, $limit, $offset);
            $productosArray = array_map([$this->productoModel, 'toArray'], $productos);
            
            $this->jsonResponse($productosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener productos con stock bajo (solo administradores)
     */
    public function getLowStock() {
        try {
            $this->requireAdmin();
            
            $params = $this->getQueryParams();
            $threshold = isset($params['threshold']) ? (int)$params['threshold'] : 10;
            
            $productos = $this->productoModel->getLowStock($threshold);
            $productosArray = array_map([$this->productoModel, 'toArray'], $productos);
            
            $this->jsonResponse($productosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener productos más vendidos
     */
    public function getBestSellers() {
        try {
            $params = $this->getQueryParams();
            $limit = isset($params['limit']) ? (int)$params['limit'] : 10;
            
            $productos = $this->productoModel->getBestSellers($limit);
            $productosArray = array_map([$this->productoModel, 'toArray'], $productos);
            
            $this->jsonResponse($productosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener estadísticas de productos (solo administradores)
     */
    public function getStats() {
        try {
            $this->requireAdmin();
            
            $stats = $this->productoModel->getStats();
            $this->jsonResponse($stats);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener productos en promoción
     */
    public function getPromociones() {
        try {
            $params = $this->getQueryParams();
            $limit = isset($params['limit']) ? (int)$params['limit'] : null;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;
            
            $productos = $this->productoModel->getEnPromocion($limit, $offset);
            $productosArray = array_map([$this->productoModel, 'toArray'], $productos);
            
            $this->jsonResponse($productosArray);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Establecer precio promocional para un producto (solo administradores)
     */
    public function setPrecioPromocional($id) {
        try {
            $this->requireAdmin();
            $data = $this->getJsonInput();
            
            if (!isset($data['precio_promocional'])) {
                throw new Exception('El precio promocional es requerido');
            }
            
            $precioPromocional = (float)$data['precio_promocional'];
            
            if ($precioPromocional <= 0) {
                throw new Exception('El precio promocional debe ser mayor a 0');
            }
            
            // Verificar que el producto existe
            $producto = $this->productoModel->getById($id);
            if (!$producto) {
                throw new Exception('Producto no encontrado');
            }
            
            // Verificar que el precio promocional es menor al precio normal
            if ($precioPromocional >= $producto['precio']) {
                throw new Exception('El precio promocional debe ser menor al precio normal');
            }
            
            $success = $this->productoModel->setPrecioPromocional($id, $precioPromocional);
            
            if ($success) {
                $this->jsonResponse(['message' => 'Precio promocional establecido correctamente']);
            } else {
                throw new Exception('Error al establecer el precio promocional');
            }
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Remover precio promocional de un producto (solo administradores)
     */
    public function removePrecioPromocional($id) {
        try {
            $this->requireAdmin();
            
            // Verificar que el producto existe
            $producto = $this->productoModel->getById($id);
            if (!$producto) {
                throw new Exception('Producto no encontrado');
            }
            
            $success = $this->productoModel->removePrecioPromocional($id);
            
            if ($success) {
                $this->jsonResponse(['message' => 'Precio promocional removido correctamente']);
            } else {
                throw new Exception('Error al remover el precio promocional');
            }
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>

