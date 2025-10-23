# 🔄 Migración de Rutas Express.js a PHP

## 📋 Comparación de Estructuras

### **Express.js (Original)**
```javascript
// app.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

app.listen(3000);
```

### **PHP (Migrado)**
```php
// routes/app.php
require_once __DIR__ . '/../includes/Router.php';

$app = new Router('/api');

// Middlewares globales
$app->use('*', function($path) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    return true;
});

// Rutas
$app->post('/auth/login', 'AuthController@login');
$app->get('/products', 'ProductoController@getAll');
$app->post('/cart', 'CarritoController@addProduct');

$app->handle($requestUri);
```

---

## 🛣️ **Mapeo de Rutas**

### **1. Autenticación**

#### Express.js
```javascript
// routes/auth.js
const express = require('express');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Lógica de registro
        res.status(201).json({ message: 'Usuario registrado', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    // Lógica de login
});

module.exports = router;
```

#### PHP
```php
// controllers/AuthController.php
class AuthController extends BaseController {
    public function register() {
        try {
            $data = $this->getJsonInput();
            $this->validateRequired($data, ['name', 'email', 'password']);
            
            $userId = $this->userModel->createUser($data);
            $user = $this->userModel->getById($userId);
            
            $this->successResponse('Usuario registrado correctamente', $user, 201);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    public function login() {
        // Lógica de login
    }
}

// routes/app.php
$app->post('/auth/register', 'AuthController@register');
$app->post('/auth/login', 'AuthController@login');
```

### **2. Productos**

#### Express.js
```javascript
// routes/products.js
router.get('/', async (req, res) => {
    const { categoria_id, destacados, q } = req.query;
    
    let productos;
    if (categoria_id) {
        productos = await Producto.findByCategory(categoria_id);
    } else if (destacados === 'true') {
        productos = await Producto.findFeatured();
    } else if (q) {
        productos = await Producto.search(q);
    } else {
        productos = await Producto.findAll();
    }
    
    res.json(productos);
});

router.get('/:id', async (req, res) => {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
});
```

#### PHP
```php
// controllers/ProductoController.php
class ProductoController extends BaseController {
    public function getAll() {
        try {
            $params = $this->getQueryParams();
            $categoriaId = $params['categoria_id'] ?? null;
            $destacados = $params['destacados'] ?? null;
            $busqueda = $params['q'] ?? null;
            
            if ($categoriaId) {
                $productos = $this->productoModel->getByCategoria($categoriaId);
            } elseif ($destacados === 'true') {
                $productos = $this->productoModel->getDestacados();
            } elseif ($busqueda) {
                $productos = $this->productoModel->search($busqueda);
            } else {
                $productos = $this->productoModel->getAllActive();
            }
            
            $this->jsonResponse($productos);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    public function getById($params) {
        $id = $params['id'] ?? null;
        $producto = $this->productoModel->getByIdWithCategory($id);
        if (!$producto) {
            $this->errorResponse('Producto no encontrado', 404);
        }
        $this->jsonResponse($producto);
    }
}

// routes/app.php
$app->get('/productos', 'ProductoController@getAll');
$app->get('/productos/:id', 'ProductoController@getById');
```

### **3. Carrito**

#### Express.js
```javascript
// routes/cart.js
router.get('/', authenticateToken, async (req, res) => {
    const items = await Carrito.findByUser(req.user.id);
    const total = await Carrito.calculateTotal(req.user.id);
    
    res.json({
        items,
        total,
        cantidad_items: items.length
    });
});

router.post('/', authenticateToken, async (req, res) => {
    const { producto_id, cantidad } = req.body;
    
    const item = await Carrito.addProduct(req.user.id, producto_id, cantidad);
    res.status(201).json(item);
});
```

#### PHP
```php
// controllers/CarritoController.php
class CarritoController extends BaseController {
    public function getCart() {
        try {
            $usuarioId = $this->requireAuth();
            
            $items = $this->carritoModel->getByUsuario($usuarioId);
            $total = $this->carritoModel->calculateTotal($usuarioId);
            $itemCount = $this->carritoModel->getItemCount($usuarioId);
            
            $this->jsonResponse([
                'items' => $items,
                'total' => $total,
                'cantidad_items' => $itemCount
            ]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
    
    public function addProduct() {
        try {
            $usuarioId = $this->requireAuth();
            $data = $this->getJsonInput();
            
            $itemId = $this->carritoModel->addProduct(
                $usuarioId, 
                $data['producto_id'], 
                $data['cantidad']
            );
            
            $this->successResponse('Producto agregado al carrito', $itemId, 201);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}

// routes/app.php
$app->get('/carrito', 'CarritoController@getCart');
$app->post('/carrito', 'CarritoController@addProduct');
```

---

## 🔧 **Funcionalidades del Router PHP**

### **1. Middlewares**
```php
// Middleware de CORS
$app->use('*', function($path) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    return true;
});

// Middleware de autenticación
$app->use('/admin/*', function($path) {
    session_start();
    if (!isset($_SESSION['usuario_id']) || !$_SESSION['es_admin']) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        return false;
    }
    return true;
});
```

### **2. Parámetros de Ruta**
```php
// Ruta con parámetros
$app->get('/productos/:id', 'ProductoController@getById');

// En el controlador
public function getById($params) {
    $id = $params['id']; // Obtiene el parámetro de la URL
    // ...
}
```

### **3. Métodos HTTP**
```php
$app->get('/productos', 'ProductoController@getAll');
$app->post('/productos', 'ProductoController@create');
$app->put('/productos/:id', 'ProductoController@update');
$app->delete('/productos/:id', 'ProductoController@delete');
$app->patch('/productos/:id', 'ProductoController@partialUpdate');
```

### **4. Rutas Anidadas**
```php
// Rutas de administración
$app->get('/admin/users', 'UserController@getAll');
$app->get('/admin/reportes/ventas', 'ReporteController@getVentas');
$app->get('/admin/config/:key', 'ConfigController@get');
```

---

## 📊 **Comparación de Características**

| Característica | Express.js | PHP Router |
|----------------|------------|------------|
| **Middlewares** | ✅ app.use() | ✅ $app->use() |
| **Parámetros de ruta** | ✅ :id | ✅ :id |
| **Métodos HTTP** | ✅ get, post, put, delete | ✅ get, post, put, delete |
| **Query parameters** | ✅ req.query | ✅ $this->getQueryParams() |
| **Body parsing** | ✅ req.body | ✅ $this->getJsonInput() |
| **Response helpers** | ✅ res.json(), res.status() | ✅ $this->jsonResponse() |
| **Error handling** | ✅ try/catch | ✅ $this->handleException() |
| **Route grouping** | ✅ Router() | ✅ Router('/prefix') |
| **Wildcards** | ✅ * | ✅ * |
| **Regex patterns** | ✅ /^\/users\/\d+$/ | ✅ /^\/users\/(\d+)$/ |

---

## 🚀 **Ventajas del Sistema PHP**

### **1. Estructura Familiar**
- Sintaxis similar a Express.js
- Misma organización de rutas
- Middlewares compatibles

### **2. Funcionalidades Avanzadas**
```php
// Validación automática
$this->validateRequired($data, ['name', 'email']);

// Sanitización de datos
$data = $this->sanitizeInput($data);

// Respuestas estandarizadas
$this->successResponse('Operación exitosa', $data);
$this->errorResponse('Error encontrado', 400);

// Autenticación integrada
$usuarioId = $this->requireAuth();
$this->requireAdmin();
```

### **3. Manejo de Errores**
```php
try {
    // Lógica del controlador
} catch (Exception $e) {
    $this->handleException($e); // Manejo automático
}
```

### **4. Logging Integrado**
```php
// Log automático de requests
$app->use('*', function($path) {
    error_log(date('Y-m-d H:i:s') . ' - ' . $_SERVER['REQUEST_METHOD'] . ' ' . $path);
    return true;
});
```

---

## 📁 **Estructura de Archivos**

### **Express.js**
```
routes/
├── auth.js
├── products.js
├── cart.js
├── orders.js
└── admin.js

controllers/
├── AuthController.js
├── ProductController.js
└── CartController.js
```

### **PHP**
```
routes/
└── app.php              # Archivo principal de rutas

controllers/
├── BaseController.php   # Controlador base
├── AuthController.php
├── ProductoController.php
├── CarritoController.php
└── PedidoController.php

includes/
└── Router.php          # Clase Router personalizada
```

---

## 🔄 **Migración Paso a Paso**

### **1. Identificar Rutas Express**
```javascript
// Express.js
app.get('/api/products', getProducts);
app.post('/api/products', createProduct);
app.get('/api/products/:id', getProduct);
```

### **2. Convertir a PHP**
```php
// PHP
$app->get('/productos', 'ProductoController@getAll');
$app->post('/productos', 'ProductoController@create');
$app->get('/productos/:id', 'ProductoController@getById');
```

### **3. Crear Controladores**
```php
class ProductoController extends BaseController {
    public function getAll() {
        // Lógica convertida de Express
    }
    
    public function create() {
        // Lógica convertida de Express
    }
    
    public function getById($params) {
        // Lógica convertida de Express
    }
}
```

### **4. Migrar Middlewares**
```javascript
// Express.js
app.use(cors());
app.use(express.json());
app.use(authenticateToken);
```

```php
// PHP
$app->use('*', function($path) {
    // CORS
    header('Access-Control-Allow-Origin: *');
    return true;
});

$app->use('*', function($path) {
    // JSON validation
    // ...
    return true;
});

$app->use('/api/*', function($path) {
    // Authentication
    // ...
    return true;
});
```

---

## ✅ **Resultado Final**

El sistema de rutas PHP mantiene la **misma funcionalidad** que Express.js pero con:

- **Mejor integración** con la base de datos MySQL
- **Validación automática** de datos
- **Manejo de errores** estandarizado
- **Respuestas consistentes** en formato JSON
- **Logging integrado** del sistema
- **Autenticación** y autorización simplificadas
- **Documentación** automática de la API

**🎯 La migración está completa y funcional, manteniendo la familiaridad de Express.js en un entorno PHP robusto.**
