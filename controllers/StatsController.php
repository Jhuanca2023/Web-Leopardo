<?php
/**
 * Controlador de Estadísticas
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Pedido.php';
require_once __DIR__ . '/../models/Producto.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Carrito.php';

class StatsController extends BaseController {
    private $pedidoModel;
    private $productoModel;
    private $userModel;
    private $carritoModel;
    
    public function __construct() {
        $this->pedidoModel = new Pedido();
        $this->productoModel = new Producto();
        $this->userModel = new User();
        $this->carritoModel = new Carrito();
    }
    
    /**
     * Obtener estadísticas del dashboard
     */
    public function getDashboard() {
        try {
            $this->requireAuth();
            
            $stats = [
                'resumen_general' => $this->getResumenGeneral(),
                'ventas_recientes' => $this->getVentasRecientes(),
                'productos_destacados' => $this->getProductosDestacados(),
                'estado_pedidos' => $this->getEstadoPedidos(),
                'actividad_reciente' => $this->getActividadReciente()
            ];
            
            $this->jsonResponse($stats);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener estadísticas de ventas
     */
    public function getVentas() {
        try {
            $this->requireAuth();
            
            $params = $this->getQueryParams();
            $periodo = $params['periodo'] ?? 'mes'; // dia, semana, mes, año
            
            $stats = [
                'periodo' => $periodo,
                'ventas_totales' => $this->getVentasTotales($periodo),
                'ventas_por_periodo' => $this->getVentasPorPeriodo($periodo),
                'comparacion_periodo_anterior' => $this->getComparacionPeriodoAnterior($periodo),
                'tendencias' => $this->getTendenciasVentas($periodo)
            ];
            
            $this->jsonResponse($stats);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener estadísticas de productos
     */
    public function getProductos() {
        try {
            $this->requireAuth();
            
            $stats = [
                'resumen' => $this->productoModel->getStats(),
                'productos_mas_vendidos' => $this->productoModel->getBestSellers(5),
                'productos_stock_bajo' => $this->productoModel->getLowStock(5),
                'productos_por_categoria' => $this->getProductosPorCategoria(),
                'nuevos_productos' => $this->getNuevosProductos()
            ];
            
            $this->jsonResponse($stats);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener resumen general
     */
    private function getResumenGeneral() {
        $db = Database::getInstance()->getConnection();
        
        // Ventas del mes actual
        $sql = "
            SELECT 
                COUNT(*) as pedidos_mes,
                SUM(total) as ventas_mes,
                AVG(total) as promedio_pedido
            FROM pedidos 
            WHERE MONTH(fecha_pedido) = MONTH(CURRENT_DATE()) 
            AND YEAR(fecha_pedido) = YEAR(CURRENT_DATE())
            AND estado != 'cancelado'
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $ventasMes = $stmt->fetch();
        
        // Productos en stock
        $sql = "
            SELECT 
                COUNT(*) as total_productos,
                COUNT(CASE WHEN stock > 0 THEN 1 END) as productos_con_stock,
                COUNT(CASE WHEN stock <= 10 THEN 1 END) as productos_stock_bajo
            FROM productos 
            WHERE activo = 1
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $productos = $stmt->fetch();
        
        // Usuarios activos
        $sql = "
            SELECT 
                COUNT(*) as total_usuarios,
                COUNT(CASE WHEN fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as usuarios_nuevos_mes
            FROM users 
            WHERE es_admin = 0 AND activo = 1
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $usuarios = $stmt->fetch();
        
        return [
            'ventas_mes' => $ventasMes,
            'productos' => $productos,
            'usuarios' => $usuarios
        ];
    }
    
    /**
     * Obtener ventas recientes
     */
    private function getVentasRecientes() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                p.id,
                p.numero_pedido,
                p.total,
                p.estado,
                p.fecha_pedido,
                u.name as cliente
            FROM pedidos p
            LEFT JOIN users u ON p.usuario_id = u.id
            WHERE p.fecha_pedido >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY p.fecha_pedido DESC
            LIMIT 10
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener productos destacados
     */
    private function getProductosDestacados() {
        return $this->productoModel->getDestacados(6);
    }
    
    /**
     * Obtener estado de pedidos
     */
    private function getEstadoPedidos() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                estado,
                COUNT(*) as cantidad
            FROM pedidos 
            WHERE fecha_pedido >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY estado
            ORDER BY cantidad DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener actividad reciente
     */
    private function getActividadReciente() {
        $db = Database::getInstance()->getConnection();
        
        // Últimos pedidos
        $sql = "
            SELECT 
                'pedido' as tipo,
                p.id as id,
                CONCAT('Nuevo pedido #', p.numero_pedido) as descripcion,
                p.fecha_pedido as fecha,
                u.name as usuario
            FROM pedidos p
            LEFT JOIN users u ON p.usuario_id = u.id
            WHERE p.fecha_pedido >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            
            UNION ALL
            
            SELECT 
                'usuario' as tipo,
                u.id as id,
                CONCAT('Nuevo usuario: ', u.name) as descripcion,
                u.fecha_creacion as fecha,
                u.name as usuario
            FROM users u
            WHERE u.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND u.es_admin = 0
            
            ORDER BY fecha DESC
            LIMIT 10
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener ventas totales por período
     */
    private function getVentasTotales($periodo) {
        $db = Database::getInstance()->getConnection();
        
        $whereClause = $this->getWhereClauseForPeriod($periodo);
        
        $sql = "
            SELECT 
                COUNT(*) as total_pedidos,
                SUM(total) as total_ventas,
                AVG(total) as promedio_pedido,
                COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as pedidos_entregados
            FROM pedidos 
            WHERE {$whereClause}
            AND estado != 'cancelado'
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    /**
     * Obtener ventas por período
     */
    private function getVentasPorPeriodo($periodo) {
        $db = Database::getInstance()->getConnection();
        
        $groupBy = $this->getGroupByForPeriod($periodo);
        $dateFormat = $this->getDateFormatForPeriod($periodo);
        
        $sql = "
            SELECT 
                {$dateFormat} as periodo,
                COUNT(*) as pedidos,
                SUM(total) as ventas
            FROM pedidos 
            WHERE fecha_pedido >= DATE_SUB(NOW(), INTERVAL 1 {$periodo})
            AND estado != 'cancelado'
            GROUP BY {$groupBy}
            ORDER BY periodo
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener comparación con período anterior
     */
    private function getComparacionPeriodoAnterior($periodo) {
        $db = Database::getInstance()->getConnection();
        
        $whereClause = $this->getWhereClauseForPeriod($periodo);
        $whereClauseAnterior = $this->getWhereClauseForPreviousPeriod($periodo);
        
        // Período actual
        $sql = "
            SELECT 
                COUNT(*) as pedidos_actual,
                SUM(total) as ventas_actual
            FROM pedidos 
            WHERE {$whereClause}
            AND estado != 'cancelado'
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $actual = $stmt->fetch();
        
        // Período anterior
        $sql = "
            SELECT 
                COUNT(*) as pedidos_anterior,
                SUM(total) as ventas_anterior
            FROM pedidos 
            WHERE {$whereClauseAnterior}
            AND estado != 'cancelado'
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $anterior = $stmt->fetch();
        
        // Calcular porcentajes de cambio
        $cambioPedidos = 0;
        $cambioVentas = 0;
        
        if ($anterior['pedidos_anterior'] > 0) {
            $cambioPedidos = (($actual['pedidos_actual'] - $anterior['pedidos_anterior']) / $anterior['pedidos_anterior']) * 100;
        }
        
        if ($anterior['ventas_anterior'] > 0) {
            $cambioVentas = (($actual['ventas_actual'] - $anterior['ventas_anterior']) / $anterior['ventas_anterior']) * 100;
        }
        
        return [
            'actual' => $actual,
            'anterior' => $anterior,
            'cambio_pedidos' => round($cambioPedidos, 2),
            'cambio_ventas' => round($cambioVentas, 2)
        ];
    }
    
    /**
     * Obtener tendencias de ventas
     */
    private function getTendenciasVentas($periodo) {
        $db = Database::getInstance()->getConnection();
        
        $groupBy = $this->getGroupByForPeriod($periodo);
        $dateFormat = $this->getDateFormatForPeriod($periodo);
        
        $sql = "
            SELECT 
                {$dateFormat} as fecha,
                SUM(total) as ventas,
                COUNT(*) as pedidos
            FROM pedidos 
            WHERE fecha_pedido >= DATE_SUB(NOW(), INTERVAL 3 {$periodo})
            AND estado != 'cancelado'
            GROUP BY {$groupBy}
            ORDER BY fecha
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener productos por categoría
     */
    private function getProductosPorCategoria() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                c.nombre as categoria,
                COUNT(p.id) as total_productos,
                AVG(p.precio) as precio_promedio,
                SUM(p.stock) as stock_total
            FROM categorias c
            LEFT JOIN productos p ON c.id = p.categoria_id AND p.activo = 1
            WHERE c.activo = 1
            GROUP BY c.id, c.nombre
            ORDER BY total_productos DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener nuevos productos
     */
    private function getNuevosProductos() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT p.*, c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = 1
            AND p.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY p.fecha_creacion DESC
            LIMIT 5
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener cláusula WHERE para período
     */
    private function getWhereClauseForPeriod($periodo) {
        switch ($periodo) {
            case 'dia':
                return "DATE(fecha_pedido) = CURDATE()";
            case 'semana':
                return "YEARWEEK(fecha_pedido) = YEARWEEK(CURDATE())";
            case 'mes':
                return "MONTH(fecha_pedido) = MONTH(CURDATE()) AND YEAR(fecha_pedido) = YEAR(CURDATE())";
            case 'año':
                return "YEAR(fecha_pedido) = YEAR(CURDATE())";
            default:
                return "MONTH(fecha_pedido) = MONTH(CURDATE()) AND YEAR(fecha_pedido) = YEAR(CURDATE())";
        }
    }
    
    /**
     * Obtener cláusula WHERE para período anterior
     */
    private function getWhereClauseForPreviousPeriod($periodo) {
        switch ($periodo) {
            case 'dia':
                return "DATE(fecha_pedido) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
            case 'semana':
                return "YEARWEEK(fecha_pedido) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK))";
            case 'mes':
                return "MONTH(fecha_pedido) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(fecha_pedido) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))";
            case 'año':
                return "YEAR(fecha_pedido) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 YEAR))";
            default:
                return "MONTH(fecha_pedido) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(fecha_pedido) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))";
        }
    }
    
    /**
     * Obtener GROUP BY para período
     */
    private function getGroupByForPeriod($periodo) {
        switch ($periodo) {
            case 'dia':
                return "DATE(fecha_pedido)";
            case 'semana':
                return "YEARWEEK(fecha_pedido)";
            case 'mes':
                return "MONTH(fecha_pedido), YEAR(fecha_pedido)";
            case 'año':
                return "YEAR(fecha_pedido)";
            default:
                return "DATE(fecha_pedido)";
        }
    }
    
    /**
     * Obtener formato de fecha para período
     */
    private function getDateFormatForPeriod($periodo) {
        switch ($periodo) {
            case 'dia':
                return "DATE(fecha_pedido)";
            case 'semana':
                return "YEARWEEK(fecha_pedido)";
            case 'mes':
                return "DATE_FORMAT(fecha_pedido, '%Y-%m')";
            case 'año':
                return "YEAR(fecha_pedido)";
            default:
                return "DATE(fecha_pedido)";
        }
    }
}
?>
