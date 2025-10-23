<?php
/**
 * Clase para manejo de conexión a la base de datos MySQL
 */

require_once __DIR__ . '/config.php';

class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            throw new Exception("Error de conexión a la base de datos: " . $e->getMessage());
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function prepare($sql) {
        return $this->connection->prepare($sql);
    }
    
    public function query($sql) {
        return $this->connection->query($sql);
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollback() {
        return $this->connection->rollback();
    }
    
    // Método para crear las tablas si no existen
    public function createTables() {
        $sql = "
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(120) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            telefono VARCHAR(20),
            direccion TEXT,
            es_admin BOOLEAN DEFAULT FALSE,
            activo BOOLEAN DEFAULT TRUE,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS categorias (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            icono VARCHAR(255),
            activo BOOLEAN DEFAULT TRUE,
            orden INT DEFAULT 0,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS productos2 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo VARCHAR(20) UNIQUE NOT NULL,
            nombre VARCHAR(150) NOT NULL,
            descripcion TEXT,
            precio DECIMAL(10,2) NOT NULL,
            categoria_id INT,
            imagen_principal VARCHAR(255),
            imagenes_adicionales JSON,
            tipo VARCHAR(50),
            material VARCHAR(100),
            espesor_cuero VARCHAR(20),
            forro VARCHAR(100),
            puntera VARCHAR(50),
            impermeable BOOLEAN DEFAULT 0,
            suela VARCHAR(100),
            plantilla VARCHAR(100),
            aislamiento VARCHAR(50),
            caracteristicas JSON,
            activo BOOLEAN DEFAULT 1,
            destacado BOOLEAN DEFAULT 0,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS producto_tallas_stock (
            id INT AUTO_INCREMENT PRIMARY KEY,
            producto_id INT NOT NULL,
            talla VARCHAR(10) NOT NULL,
            stock INT DEFAULT 0,
            UNIQUE (producto_id, talla),
            FOREIGN KEY (producto_id) REFERENCES productos2(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS carrito (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            producto_id INT NOT NULL,
            cantidad INT NOT NULL DEFAULT 1,
            fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (producto_id) REFERENCES productos2(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS pedidos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            total DECIMAL(10,2) NOT NULL,
            estado VARCHAR(50) DEFAULT 'pendiente',
            direccion_envio TEXT NOT NULL,
            telefono_contacto VARCHAR(20),
            notas TEXT,
            fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS detalle_pedidos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pedido_id INT NOT NULL,
            producto_id INT NOT NULL,
            cantidad INT NOT NULL,
            precio_unitario DECIMAL(10,2) NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
            FOREIGN KEY (producto_id) REFERENCES productos2(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        try {
            $this->connection->exec($sql);
            return true;
        } catch (PDOException $e) {
            throw new Exception("Error al crear las tablas: " . $e->getMessage());
        }
    }
    
    // Método para insertar datos iniciales
    public function insertInitialData() {
        try {
            // Verificar si ya existen datos
            $stmt = $this->connection->prepare("SELECT COUNT(*) FROM users WHERE es_admin = 1");
            $stmt->execute();
            $adminExists = $stmt->fetchColumn() > 0;
            
            if (!$adminExists) {
                // Crear usuario administrador
                $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
                $stmt = $this->connection->prepare("
                    INSERT INTO users (name, email, password_hash, telefono, es_admin) 
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute(['Administrador', 'admin@leopardo.com', $adminPassword, '+51 940-870-622', 1]);
            }
            
            // Verificar si existen categorías
            $stmt = $this->connection->prepare("SELECT COUNT(*) FROM categorias");
            $stmt->execute();
            $categoriasExist = $stmt->fetchColumn() > 0;
            
            if (!$categoriasExist) {
                $categorias = [
                    ['Calzado Dieléctrico', 'Calzado con puntera de Composite, aislamiento eléctrico y propiedades impermeables.', 'assets/images/icono-botas-dielectricas.png', 1, 1],
                    ['Calzado de Seguridad', 'Calzado de seguridad industrial con puntera de acero, campera, suela bidensidad y refuerzos industriales.', 'assets/images/icono-calzado-seguridad.png', 1, 2],
                    ['Trekking', 'Calzado de senderismo y montaña, con suela de caucho y entresuela EVA amortiguada.', 'assets/images/icono-antideslizante.png', 1, 3],
                    ['Calzado Impermeable', 'Modelos resistentes al agua diseñados para ambientes húmedos y condiciones extremas.', 'assets/images/icono-impermeable.png', 1, 4],
                    ['Línea Económica', 'Modelos de seguridad industrial más accesibles en precio, manteniendo estándares básicos de protección.', 'assets/images/icono-economico.png', 1, 5]
                ];
                
                $stmt = $this->connection->prepare("
                    INSERT INTO categorias (nombre, descripcion, icono, activo, orden) 
                    VALUES (?, ?, ?, ?, ?)
                ");
                
                foreach ($categorias as $categoria) {
                    $stmt->execute($categoria);
                }
            }
            
            // Verificar si existen productos
            $stmt = $this->connection->prepare("SELECT COUNT(*) FROM productos2");
            $stmt->execute();
            $productosExist = $stmt->fetchColumn() > 0;
            
            if (!$productosExist) {
                // Obtener IDs de categorías
                $stmt = $this->connection->prepare("SELECT id FROM categorias WHERE nombre = ?");
                $stmt->execute(['Calzado de Seguridad']);
                $categoriaSeguridad = $stmt->fetchColumn();

                $stmt = $this->connection->prepare("SELECT id FROM categorias WHERE nombre = ?");
                $stmt->execute(['Calzado Dieléctrico']);
                $categoriaDielectrica = $stmt->fetchColumn();

                $productos = [
                    [
                        'LEO-PRO-001', // codigo
                        'Bota de Seguridad Industrial Leopardo Pro',
                        'Bota de seguridad con puntera de acero, suela antideslizante y resistente a aceites. Ideal para construcción e industria.',
                        89.90, // precio
                        $categoriaSeguridad,
                        'assets/images/calzado-seguridad-industria.jpg',
                        json_encode(['assets/images/calzado-seguridad-industria.jpg']), // imagenes_adicionales
                        'Industrial', // tipo
                        'Cuero', // material
                        '2mm', // espesor_cuero
                        'Textil', // forro
                        'Acero', // puntera
                        0, // impermeable
                        'PU', // suela
                        'EVA', // plantilla
                        'Dieléctrico', // aislamiento
                        json_encode(['antideslizante', 'puntera acero']), // caracteristicas
                        1, // activo
                        1 // destacado
                    ],
                    [
                        'LEO-CLASSIC-002',
                        'Zapato de Seguridad Leopardo Classic',
                        'Zapato de seguridad cómodo y resistente, perfecto para uso diario en ambientes industriales.',
                        69.90,
                        $categoriaSeguridad,
                        'assets/images/calzados-industrial.jpg',
                        json_encode(['assets/images/calzados-industrial.jpg']),
                        'Industrial',
                        'Cuero',
                        '1.8mm',
                        'Textil',
                        'Acero',
                        0,
                        'PU',
                        'EVA',
                        'N/A',
                        json_encode(['antideslizante']),
                        1,
                        1
                    ],
                    [
                        'LEO-ELECTRIC-003',
                        'Bota Dieléctrica Leopardo Electric',
                        'Bota especializada para trabajos eléctricos, con aislamiento dieléctrico certificado.',
                        129.90,
                        $categoriaDielectrica,
                        'assets/images/calzados-seguridad.jpg',
                        json_encode(['assets/images/calzados-seguridad.jpg']),
                        'Dieléctrico',
                        'Cuero',
                        '2.2mm',
                        'Textil',
                        'Acero',
                        1,
                        'PU',
                        'EVA',
                        'Dieléctrico',
                        json_encode(['aislamiento', 'puntera acero']),
                        1,
                        1
                    ]
                ];

                $stmt = $this->connection->prepare("
                    INSERT INTO productos2 (
                        codigo, nombre, descripcion, precio, categoria_id, imagen_principal, imagenes_adicionales, tipo, material, espesor_cuero, forro, puntera, impermeable, suela, plantilla, aislamiento, caracteristicas, activo, destacado
                    ) VALUES (
                        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
                    )
                ");

                foreach ($productos as $producto) {
                    $stmt->execute($producto);
                }
            }
            
            return true;
        } catch (PDOException $e) {
            throw new Exception("Error al insertar datos iniciales: " . $e->getMessage());
        }
    }
}
?>

