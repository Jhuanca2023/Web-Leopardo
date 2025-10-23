<?php
/**
 * Controlador de Reportes (Administración)
 */

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/Pedido.php';
require_once __DIR__ . '/../models/Producto.php';
require_once __DIR__ . '/../models/User.php';

class ReporteController extends BaseController {
    private $pedidoModel;
    private $productoModel;
    private $userModel;
    
    public function __construct() {
        $this->pedidoModel = new Pedido();
        $this->productoModel = new Producto();
        $this->userModel = new User();
    }
    
    /**
     * Obtener reporte de ventas
     */
    public function getVentas() {
        try {
            $this->requireAdmin();
            
            $params = $this->getQueryParams();
            $fechaInicio = $params['fecha_inicio'] ?? date('Y-m-01'); // Primer día del mes
            $fechaFin = $params['fecha_fin'] ?? date('Y-m-d'); // Hoy
            
            // Validar fechas
            if (!strtotime($fechaInicio) || !strtotime($fechaFin)) {
                $this->errorResponse('Fechas inválidas', 400);
            }
            
            if ($fechaInicio > $fechaFin) {
                $this->errorResponse('La fecha de inicio debe ser anterior a la fecha de fin', 400);
            }
            
            $reporte = [
                'periodo' => [
                    'inicio' => $fechaInicio,
                    'fin' => $fechaFin
                ],
                'resumen' => $this->getResumenVentas($fechaInicio, $fechaFin),
                'ventas_por_dia' => $this->getVentasPorDia($fechaInicio, $fechaFin),
                'productos_mas_vendidos' => $this->getProductosMasVendidos($fechaInicio, $fechaFin),
                'categorias_mas_vendidas' => $this->getCategoriasMasVendidas($fechaInicio, $fechaFin),
                'estados_pedidos' => $this->getEstadosPedidos($fechaInicio, $fechaFin)
            ];
            
            $this->jsonResponse($reporte);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener reporte de productos
     */
    public function getProductos() {
        try {
            $this->requireAdmin();
            
            $reporte = [
                'resumen' => $this->productoModel->getStats(),
                'productos_mas_vendidos' => $this->productoModel->getBestSellers(10),
                'productos_stock_bajo' => $this->productoModel->getLowStock(10),
                'productos_por_categoria' => $this->getProductosPorCategoria(),
                'productos_nuevos' => $this->getProductosNuevos(),
                'productos_destacados' => $this->productoModel->getDestacados()
            ];
            
            $this->jsonResponse($reporte);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener reporte de clientes
     */
    public function getClientes() {
        try {
            $this->requireAdmin();
            
            $reporte = [
                'resumen' => $this->userModel->getStats(),
                'clientes_activos' => $this->getClientesActivos(),
                'clientes_nuevos' => $this->getClientesNuevos(),
                'clientes_por_mes' => $this->getClientesPorMes(),
                'top_clientes' => $this->getTopClientes()
            ];
            
            $this->jsonResponse($reporte);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener reporte de inventario
     */
    public function getInventario() {
        try {
            $this->requireAdmin();
            
            $reporte = [
                'resumen' => $this->productoModel->getStats(),
                'productos_stock_bajo' => $this->productoModel->getLowStock(),
                'productos_sin_stock' => $this->getProductosSinStock(),
                'valor_inventario' => $this->getValorInventario(),
                'movimiento_inventario' => $this->getMovimientoInventario()
            ];
            
            $this->jsonResponse($reporte);
            
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    /**
     * Obtener resumen de ventas
     */
    private function getResumenVentas($fechaInicio, $fechaFin) {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                COUNT(*) as total_pedidos,
                SUM(total) as total_ventas,
                AVG(total) as promedio_pedido,
                COUNT(CASE WHEN estado = 'entregado' THEN 1 END) as pedidos_entregados,
                COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as pedidos_cancelados
            FROM pedidos 
            WHERE DATE(fecha_pedido) BETWEEN ? AND ?
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$fechaInicio, $fechaFin]);
        return $stmt->fetch();
    }
    
    /**
     * Obtener ventas por día
     */
    private function getVentasPorDia($fechaInicio, $fechaFin) {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                DATE(fecha_pedido) as fecha,
                COUNT(*) as pedidos,
                SUM(total) as ventas
            FROM pedidos 
            WHERE DATE(fecha_pedido) BETWEEN ? AND ?
            AND estado != 'cancelado'
            GROUP BY DATE(fecha_pedido)
            ORDER BY fecha
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$fechaInicio, $fechaFin]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener productos más vendidos
     */
    private function getProductosMasVendidos($fechaInicio, $fechaFin) {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                p.id,
                p.nombre,
                p.codigo_sku,
                SUM(dp.cantidad) as total_vendido,
                SUM(dp.subtotal) as ingresos
            FROM productos p
            INNER JOIN detalle_pedidos dp ON p.id = dp.producto_id
            INNER JOIN pedidos ped ON dp.pedido_id = ped.id
            WHERE DATE(ped.fecha_pedido) BETWEEN ? AND ?
            AND ped.estado = 'entregado'
            GROUP BY p.id, p.nombre, p.codigo_sku
            ORDER BY total_vendido DESC
            LIMIT 10
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$fechaInicio, $fechaFin]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener categorías más vendidas
     */
    private function getCategoriasMasVendidas($fechaInicio, $fechaFin) {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                c.id,
                c.nombre,
                SUM(dp.cantidad) as total_vendido,
                SUM(dp.subtotal) as ingresos
            FROM categorias c
            INNER JOIN productos p ON c.id = p.categoria_id
            INNER JOIN detalle_pedidos dp ON p.id = dp.producto_id
            INNER JOIN pedidos ped ON dp.pedido_id = ped.id
            WHERE DATE(ped.fecha_pedido) BETWEEN ? AND ?
            AND ped.estado = 'entregado'
            GROUP BY c.id, c.nombre
            ORDER BY total_vendido DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$fechaInicio, $fechaFin]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener estados de pedidos
     */
    private function getEstadosPedidos($fechaInicio, $fechaFin) {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                estado,
                COUNT(*) as cantidad,
                SUM(total) as total
            FROM pedidos 
            WHERE DATE(fecha_pedido) BETWEEN ? AND ?
            GROUP BY estado
            ORDER BY cantidad DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$fechaInicio, $fechaFin]);
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
                COUNT(CASE WHEN p.activo = 1 THEN 1 END) as productos_activos,
                AVG(p.precio) as precio_promedio
            FROM categorias c
            LEFT JOIN productos p ON c.id = p.categoria_id
            WHERE c.activo = 1
            GROUP BY c.id, c.nombre
            ORDER BY total_productos DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener productos nuevos
     */
    private function getProductosNuevos() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT p.*, c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = 1
            AND p.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY p.fecha_creacion DESC
            LIMIT 10
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener clientes activos
     */
    private function getClientesActivos() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                COUNT(DISTINCT u.id) as total_clientes,
                COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN u.id END) as clientes_con_pedidos,
                COUNT(DISTINCT CASE WHEN p.fecha_pedido >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN u.id END) as clientes_activos_30_dias
            FROM users u
            LEFT JOIN pedidos p ON u.id = p.usuario_id
            WHERE u.es_admin = 0 AND u.activo = 1
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    /**
     * Obtener clientes nuevos
     */
    private function getClientesNuevos() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                DATE(fecha_creacion) as fecha,
                COUNT(*) as nuevos_clientes
            FROM users 
            WHERE es_admin = 0 
            AND fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(fecha_creacion)
            ORDER BY fecha DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener clientes por mes
     */
    private function getClientesPorMes() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                YEAR(fecha_creacion) as año,
                MONTH(fecha_creacion) as mes,
                COUNT(*) as nuevos_clientes
            FROM users 
            WHERE es_admin = 0 
            AND fecha_creacion >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY YEAR(fecha_creacion), MONTH(fecha_creacion)
            ORDER BY año DESC, mes DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener top clientes
     */
    private function getTopClientes() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                u.id,
                u.name,
                u.email,
                COUNT(p.id) as total_pedidos,
                SUM(p.total) as total_gastado,
                MAX(p.fecha_pedido) as ultimo_pedido
            FROM users u
            INNER JOIN pedidos p ON u.id = p.usuario_id
            WHERE u.es_admin = 0 
            AND p.estado != 'cancelado'
            GROUP BY u.id, u.name, u.email
            ORDER BY total_gastado DESC
            LIMIT 10
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener productos sin stock
     */
    private function getProductosSinStock() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT p.*, c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = 1 AND p.stock = 0
            ORDER BY p.nombre
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    /**
     * Obtener valor del inventario
     */
    private function getValorInventario() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                SUM(precio * stock) as valor_total,
                COUNT(CASE WHEN stock > 0 THEN 1 END) as productos_con_stock,
                COUNT(CASE WHEN stock = 0 THEN 1 END) as productos_sin_stock
            FROM productos 
            WHERE activo = 1
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetch();
    }
    
    /**
     * Obtener movimiento de inventario
     */
    private function getMovimientoInventario() {
        $db = Database::getInstance()->getConnection();
        
        $sql = "
            SELECT 
                DATE(ped.fecha_pedido) as fecha,
                SUM(dp.cantidad) as productos_vendidos,
                COUNT(DISTINCT dp.producto_id) as productos_diferentes
            FROM detalle_pedidos dp
            INNER JOIN pedidos ped ON dp.pedido_id = ped.id
            WHERE ped.estado = 'entregado'
            AND ped.fecha_pedido >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(ped.fecha_pedido)
            ORDER BY fecha DESC
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
?>
