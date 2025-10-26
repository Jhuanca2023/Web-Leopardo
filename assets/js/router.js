/**
 * LEOPARDO E-COMMERCE - ROUTER
 * Sistema de enrutamiento del lado del cliente
 */

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    init() {
        // Definir rutas
        this.defineRoutes();
        
        // Manejar navegación inicial
        this.handleRoute();
        
        // Manejar cambios de URL
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        
        // Interceptar enlaces
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link) {
                e.preventDefault();
                const href = link.getAttribute('href');
                this.navigate(href);
            }
        });
    }

    defineRoutes() {
        this.routes = {
            '/': () => this.loadPage('home'),
            '/productos': () => this.loadPage('products'),
            '/productos/busqueda': () => this.loadPage('busqueda', ),
            '/productos/:id': (params) => this.loadPage('product-detail', params),
            '/categorias': () => this.loadPage('categories'),
            '/categorias/:id': (params) => this.loadPage('category-products', params),
            '/carrito': () => this.loadPage('cart'),
            '/login': () => this.loadPage('login'),
            '/register': () => this.loadPage('register'),
            '/checkout': () => this.loadPage('checkout'),
            '/pedidos': () => this.loadPage('orders'),
            '/perfil': () => this.loadPage('profile'),
            '/contacto': () => this.loadPage('contact'),
            '/quienes-somos': () => this.loadPage('about'),
            '/admin': () => this.loadPage('admin')
        };
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }

    handleRoute() {
        const path = window.location.pathname;
        console.log('Handling route:', path);
        
        const route = this.findRoute(path);
        
        if (route) {
            this.currentRoute = route;
            route.handler(route.params);
        } else {
            console.log('Route not found, showing 404');
            this.loadPage('404');
        }
    }

    findRoute(path) {
        for (const [pattern, handler] of Object.entries(this.routes)) {
            const params = this.matchRoute(pattern, path);
            if (params !== null) {
                return { pattern, handler, params };
            }
        }
        return null;
    }

    matchRoute(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        
        const params = {};
        
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            
            if (patternPart.startsWith(':')) {
                const paramName = patternPart.slice(1);
                params[paramName] = pathPart;
            } else if (patternPart !== pathPart) {
                return null;
            }
        }
        
        return params;
    }

    async loadPage(pageName, params = {}) {
        try {
            // Eliminamos popup de carga global; podríamos mostrar skeletons por sección
            
            const pageContent = await this.fetchPageContent(pageName, params);
            document.getElementById('main-content').innerHTML = pageContent;
            
            // Ejecutar scripts específicos de la página
            if (pageName === 'admin') {
                    this.executeAdminScripts();
            } else {
                this.executePageScripts(pageName, params);
            }
            
            // Actualizar título de la página
            document.title = this.getPageTitle(pageName);
            
            // Scroll al top
            window.scrollTo(0, 0);
            
        } catch (error) {
            console.error('Error loading page:', error);
            this.showErrorPage();
        } finally {
            Utils.hideLoading();
        }
    }

    async fetchPageContent(pageName, params) {
        // En un entorno real, esto cargaría el contenido desde el servidor
        // Por ahora, generamos el contenido dinámicamente
        return await this.generatePageContent(pageName, params);
    }

    async generatePageContent(pageName, params) {
        switch (pageName) {
            case 'home':
                return await this.generateHomePage();
            case 'products':
                return await this.generateProductsPage();
            case 'busqueda':
                return await this.generateProductsPage();
            case 'product-detail':
                return await this.generateProductDetailPage(params.id);
            case 'categories':
                return await this.generateCategoriesPage();
            case 'category-products':
                return await this.generateCategoryProductsPage(params.id);
            case 'cart':
                return await this.generateCartPage();
            case 'login':
                return await this.generateLoginPage();
            case 'register':
                return await this.generateRegisterPage();
            case 'checkout':
                return await this.generateCheckoutPage();
            case 'orders':
                return await this.generateOrdersPage();
            case 'profile':
                return await this.generateProfilePage();
            case 'contact':
                return await this.generateContactPage();
            case '404':
                return this.generate404Page();
            case 'about':
                return await this.generateAboutPage();
            case 'admin':
                return await this.generateAdminPage();
            default:
                return this.generate404Page();
        }
    }

    // Página de administración solo para administradores
    async generateAdminPage() {
        return `
            <div class="container-fluid py-4">
                <div class="row">
                    <div class="col-12">
                        <!-- Header del Panel de Administración -->
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h2 class="text-warning mb-1">
                                    <i class="fas fa-cogs me-2"></i>
                                    Administración de Productos
                                </h2>
                                <p class="text-warning mb-0">Gestiona el catálogo de productos de tu tienda</p>
                            </div>
                            <div class="d-flex gap-2">
                                <button id="btn-admin-users" class="btn btn-outline-warning" title="Gestionar Administradores">
                                    <i class="fas fa-users-cog me-2"></i> Administradores
                                </button>
                                <button id="btn-volver-cliente" class="btn btn-outline-warning">
                                    <i class="fas fa-arrow-left me-2"></i> Volver a Cliente
                                </button>
                            </div>
                        </div>

                        <!-- Barra de herramientas -->
                        <div class="card mb-4">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-md-6">
                                        <div class="input-group">
                                            <span class="input-group-text">
                                                <i class="fas fa-search"></i>
                                            </span>
                                            <input type="text" class="form-control" id="admin-search-input" 
                                                   placeholder="Buscar productos por nombre, código o categoría...">
                                        </div>
                                    </div>
                                    <div class="col-md-3">
                                        <select class="form-select" id="admin-category-filter">
                                            <option value="">Todas las categorías</option>
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <button class="btn btn-success w-100" id="btn-nuevo-producto">
                                            <i class="fas fa-plus me-2"></i>
                                            Nuevo Producto
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Lista de productos -->
                        <div class="card">
                            <div class="card-header">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0">
                                        <i class="fas fa-box me-2"></i>
                                        Lista de Productos
                                    </h5>
                                    <span class="badge bg-primary rounded-pill" id="products-count">0 productos</span>
                                </div>
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-hover mb-0" id="admin-products-table">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Imagen</th>
                                                <th>Nombre</th>
                                                <th>Categoría</th>
                                                <th>Precio</th>
                                                <th>Stock</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="admin-products-tbody">
                                            <!-- Se llena dinámicamente -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Paginación -->
                        <div class="d-flex justify-content-center mt-4">
                            <nav aria-label="Paginación de productos">
                                <ul class="pagination" id="admin-pagination">
                                    <!-- Se llena dinámicamente -->
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal para agregar/editar producto -->
            <div class="modal fade" id="productModal" tabindex="-1" aria-labelledby="productModalLabel data-bs-theme="dark"" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="productModalLabel">
                                <i class="fas fa-box me-2"></i>
                                Nuevo Producto
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                            <form id="product-form">
                                <input type="hidden" id="product-id" name="id">
                                
                                <!-- INFORMACIÓN BÁSICA -->
                                <div class="mb-4">
                                    <h6 class="text-warning border-bottom pb-2 mb-3">
                                        <i class="fas fa-info-circle me-2"></i>Información Básica
                                    </h6>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="product-codigo" class="form-label">Código *</label>
                                            <input type="text" class="form-control" id="product-codigo" name="codigo" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="product-nombre" class="form-label">Nombre *</label>
                                            <input type="text" class="form-control" id="product-nombre" name="nombre" required>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="product-descripcion" class="form-label">Descripción *</label>
                                        <textarea class="form-control" id="product-descripcion" name="descripcion" rows="3" required></textarea>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="product-tipo" class="form-label">Tipo</label>
                                            <input type="text" class="form-control" id="product-tipo" name="tipo" placeholder="Ej: Bota de seguridad">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="product-categoria" class="form-label">Categoría *</label>
                                            <select class="form-select" id="product-categoria" name="categoria_id" required>
                                                <option value="">Seleccionar categoría</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- PRECIOS Y ESTADO -->
                                <div class="mb-4">
                                    <h6 class="text-warning border-bottom pb-2 mb-3">
                                        <i class="fas fa-dollar-sign me-2"></i>Precios y Estado
                                    </h6>
                                    <div class="row">
                                        <div class="col-md-4 mb-3">
                                            <label for="product-precio" class="form-label">Precio Regular *</label>
                                            <div class="input-group">
                                                <span class="input-group-text">S/</span>
                                                <input type="number" step="0.01" class="form-control" id="product-precio" name="precio" required>
                                            </div>
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="product-precio-promocional" class="form-label">Precio Promocional</label>
                                            <div class="input-group">
                                                <span class="input-group-text">S/</span>
                                                <input type="number" step="0.01" class="form-control" id="product-precio-promocional" name="precio_promocional" placeholder="Opcional">
                                            </div>
                                            <small class="text-muted">Debe ser menor al precio regular</small>
                                            <div class="invalid-feedback" id="precio-promocional-error"></div>
                                        </div>
                                        <div class="col-md-2 mb-3">
                                            <label for="product-destacado" class="form-label">¿Destacado?</label>
                                            <select class="form-select" id="product-destacado" name="destacado">
                                                <option value="0">No</option>
                                                <option value="1">Sí</option>
                                            </select>
                                        </div>
                                        <div class="col-md-2 mb-3">
                                            <label class="form-label">Activo</label>
                                            <div class="form-check">
                                                <input class="form-check-input" type="checkbox" id="product-activo" name="activo" checked>
                                                <label class="form-check-label" for="product-activo">
                                                    Sí / No
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- ESPECIFICACIONES TÉCNICAS -->
                                <div class="mb-4">
                                    <h6 class="text-warning border-bottom pb-2 mb-3">
                                        <i class="fas fa-cogs me-2"></i>Especificaciones Técnicas
                                    </h6>
                                    <div class="row">
                                        <div class="col-md-4 mb-3">
                                            <label for="product-material" class="form-label">Material</label>
                                            <input type="text" class="form-control" id="product-material" name="material" placeholder="Ej: Cuero genuino">
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="product-espesor_cuero" class="form-label">Espesor del Cuero</label>
                                            <input type="text" class="form-control" id="product-espesor_cuero" name="espesor_cuero" placeholder="Ej: 2.0-2.2 mm">
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="product-forro" class="form-label">Forro</label>
                                            <input type="text" class="form-control" id="product-forro" name="forro" placeholder="Ej: Textil absorbente">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-4 mb-3">
                                            <label for="product-puntera" class="form-label">Puntera</label>
                                            <input type="text" class="form-control" id="product-puntera" name="puntera" placeholder="Ej: Acero, Composite">
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="product-suela" class="form-label">Suela</label>
                                            <input type="text" class="form-control" id="product-suela" name="suela" placeholder="Ej: PU bidensidad">
                                        </div>
                                        <div class="col-md-4 mb-3">
                                            <label for="product-plantilla" class="form-label">Plantilla</label>
                                            <input type="text" class="form-control" id="product-plantilla" name="plantilla" placeholder="Ej: EVA antibacterial">
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="product-aislamiento" class="form-label">Aislamiento</label>
                                            <input type="text" class="form-control" id="product-aislamiento" name="aislamiento" placeholder="Ej: Dieléctrico 18kV">
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="product-impermeable" class="form-label">¿Impermeable?</label>
                                            <select class="form-select" id="product-impermeable" name="impermeable">
                                                <option value="0">No</option>
                                                <option value="1">Sí</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- CARACTERÍSTICAS ESPECIALES -->
                                <div class="mb-4">
                                    <h6 class="text-warning border-bottom pb-2 mb-3">
                                        <i class="fas fa-star me-2"></i>Características Especiales
                                    </h6>
                                    <div id="caracteristicas-container">
                                        <div class="caracteristica-item mb-2">
                                            <div class="input-group">
                                                <input type="text" class="form-control caracteristica-input" placeholder="Ej: Antideslizante" value="">
                                                <button type="button" class="btn btn-outline-danger btn-remove-caracteristica" style="display:none;">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" class="btn btn-outline-primary btn-sm" id="btn-add-caracteristica">
                                        <i class="fas fa-plus me-2"></i>Agregar otra característica
                                    </button>
                                </div>

                                <!-- IMÁGENES -->
                                <div class="mb-4">
                                    <h6 class="text-warning border-bottom pb-2 mb-3">
                                        <i class="fas fa-images me-2"></i>Imágenes
                                    </h6>
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="product-imagen_principal" class="form-label">Imagen Principal *</label>
                                            <div class="input-group">
<input type="file" id="imagenPrincipalInput" accept=".jpg,.jpeg,.png,.gif,.webp" />
                                            </div>
<div id="mensajeImagenPrincipal">
<p id="textoImagenPrincipal"></p>
</div>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label class="form-label">Imágenes Adicionales</label>
                                            <div class="input-group">
<input type="file" id="imagenAdicionalInput" accept=".jpg,.jpeg,.png,.gif,.webp" />
<button type="button" id="btn-add-imagen-adicional">Subir Imagen</button>
                                            </div>
<div id="listaImagenAdicional">
</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- INVENTARIO -->
                                <div class="mb-4">
                                    <h6 class="text-warning border-bottom border-warning pb-2 mb-3" style="color: #f5c518 !important;">
                                        <i class="fas fa-boxes me-2"></i>Inventario
                                        <span id="total-stock-badge" class="badge bg-warning text-dark ms-2">0 unidades</span>
                                    </h6>
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <label class="form-label text-warning fw-bold" style="color: #f5c518 !important;">
                                                <i class="fas fa-shoe-prints me-1"></i>Tallas y Stock
                                            </label>
                                            <div class="btn-group" role="group">
                                                <button type="button" 
                                                        class="btn btn-warning btn-sm text-dark fw-bold" 
                                                        id="btn-add-talla"
                                                        title="Agregar talla"
                                                        style="background: linear-gradient(135deg, #f5c518 0%, #d4a017 100%); border: none;">
                                                    <i class="fas fa-plus me-1"></i>Agregar
                                                </button>
                                                <button type="button" 
                                                        class="btn btn-outline-warning btn-sm fw-bold" 
                                                        onclick="addCommonSizes()"
                                                        title="Agregar rango completo (38-45)"
                                                        style="border-color: #f5c518;">
                                                    <i class="fas fa-shoe-prints me-1"></i>38-45
                                                </button>
                                            </div>
                                        </div>
                                        <div id="tallas-stock-container" 
                                             class="border rounded p-3" 
                                             style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-color: #f5c518 !important; box-shadow: 0 0 15px rgba(245, 197, 24, 0.2);">
                                            <!-- Se llena dinámicamente -->
                                        </div>
                                        <small class="text-warning" style="color: #f5c518 !important;">
                                            <i class="fas fa-info-circle me-1"></i>
                                            Solo se guardarán las tallas con stock mayor a 0. Las tallas con stock 0 se eliminarán automáticamente.
                                        </small>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>
                                Cancelar
                            </button>
                            <button type="button" class="btn" id="btn-save-product">
                                <i class="fas fa-save me-2"></i>
                                Guardar Producto
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal para gestión de administradores -->
            <div class="modal fade" id="adminUsersModal" tabindex="-1" aria-labelledby="adminUsersModalLabel" data-bs-theme="dark" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="adminUsersModalLabel">
                                <i class="fas fa-users-cog me-2"></i>
                                Gestión de Usuarios
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Botón para agregar nuevo usuario -->
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="mb-0">Lista de Usuarios del Sistema</h6>
                                <button class="btn btn-success btn-sm" id="btn-new-admin">
                                    <i class="fas fa-plus me-2"></i>
                                    Nuevo Usuario
                                </button>
                            </div>
                            
                            <!-- Lista de administradores -->
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Email</th>
                                            <th>Dirección</th>
                                            <th>Rol</th>
                                            <th>Estado</th>
                                            <th>Fecha</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-users-tbody">
                                        <!-- Se llena dinámicamente -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal para crear/editar administrador -->
            <div class="modal fade" id="adminUserFormModal" tabindex="-1" aria-labelledby="adminUserFormModalLabel" data-bs-theme="dark" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="adminUserFormModalLabel">
                                <i class="fas fa-user-plus me-2"></i>
                                Nuevo Usuario
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="admin-user-form">
                                <input type="hidden" id="admin-user-id" name="id">
                                
                                <div class="mb-3">
                                    <label for="admin-user-nombre" class="form-label">Nombre Completo *</label>
                                    <input type="text" class="form-control" id="admin-user-nombre" name="name" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="admin-user-email" class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="admin-user-email" name="email" required>
                                    <small class="text-muted">Este será el usuario para iniciar sesión</small>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="admin-user-password" class="form-label">Contraseña *</label>
                                    <input type="password" class="form-control" id="admin-user-password" name="password" required>
                                    <small class="text-muted">Mínimo 6 caracteres</small>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="admin-user-telefono" class="form-label">Teléfono</label>
                                    <input type="tel" class="form-control" id="admin-user-telefono" name="telefono" placeholder="+51 987 654 321">
                                </div>
                                
                                <div class="mb-3">
                                    <label for="admin-user-direccion" class="form-label">Dirección</label>
                                    <input type="text" class="form-control" id="admin-user-direccion" name="direccion" placeholder="Jr. Crespo y Castillo 256, Puente Piedra">
                                </div>
                                
                                <div class="mb-3">
                                    <label for="admin-user-rol" class="form-label">Tipo de Cuenta *</label>
                                    <select class="form-select" id="admin-user-rol" name="rol" required>
                                        <option value="cliente">Cliente Normal</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                    <small class="text-muted">Los administradores pueden gestionar productos y otros usuarios</small>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="admin-user-activo" name="activo" checked>
                                        <label class="form-check-label" for="admin-user-activo">
                                            Cuenta activa
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>
                                Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" id="btn-save-admin-user">
                                <i class="fas fa-save me-2"></i>
                                Guardar Usuario
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateAboutPage() {
        return `
            <section class="py-5 about-section">
            <div class="container">
                <h2 class="mb-4 text-center">¿Quiénes Somos?</h2>
                <p class="lead text-center mb-5">
                En <strong>Corporación G & S Leopardo S.A.C.</strong>, conocida comercialmente como 
                <strong>Calzado Industrial Leopardo</strong>, nos especializamos en la 
                <strong>fabricación y distribución de calzado de seguridad industrial</strong>. 
                Brindamos protección, comodidad y durabilidad a miles de trabajadores en todo el Perú.
                </p>
                <div class="row align-items-center mb-5">
                <div class="col-md-6 mb-4 mb-md-0">
                    <img src="/assets/images/about-factory.png" alt="Fábrica Leopardo" class="img-fluid rounded shadow">
                </div>
                <div class="col-md-6">
                    <h4 class="mb-3">Nuestra Historia</h4>
                    <p>
                    La empresa fue fundada en 1999 por Don Domingo Gómez Espinoza, quien identificó una oportunidad en 
                    el mercado peruano ante la escasa oferta de calzado de seguridad e industrial. Con visión y compromiso, 
                    creó CORPORACIÓN G&S LEOPARDO S.A.C. para proteger al trabajador peruano mediante productos resistentes, 
                    confiables y adaptados a las necesidades de cada sector.
                    </p>
                    <p>
                    Desde entonces, la empresa ha mantenido un crecimiento constante, ampliando su presencia en sectores como 
                    construcción, minería, manufactura y logística. Hoy se consolida como una marca nacional referente en calzado 
                    de seguridad y una aliada de las industrias que priorizan la protección y el bienestar laboral.
                    </p>
                </div>
                </div>

                <div class="row text-center mb-5">
                <div class="col-md-4 mb-4">
                    <i class="fas fa-cogs fa-3x mb-3"></i>
                    <h5>Innovación Constante</h5>
                    <p>Desarrollamos modelos ergonómicos, antideslizantes, impermeables y dieléctricos adaptados a cada industria.</p>
                </div>
                <div class="col-md-4 mb-4">
                    <i class="fas fa-users fa-3x mb-3"></i>
                    <h5>Compromiso con el Cliente</h5>
                    <p>Ofrecemos asesoría personalizada, stock inmediato y envíos rápidos a todo el país.</p>
                </div>
                <div class="col-md-4 mb-4">
                    <i class="fas fa-award fa-3x mb-3"></i>
                    <h5>Calidad Garantizada</h5>
                    <p>Todos nuestros productos cumplen normas de seguridad industrial y cuentan con garantía de fábrica.</p>
                </div>
                </div>

                <div class="row align-items-center">
                <div class="col-md-6 order-md-2 mb-4 mb-md-0">
                    <img src="/assets/images/about-team.jpg" alt="Equipo Leopardo" class="img-fluid rounded shadow">
                </div>
                <div class="col-md-6 order-md-1">
                    <h4 class="mb-3">Nuestra Misión y Visión</h4>
                    <p><strong>Misión:</strong> Proteger la vida de los trabajadores peruanos 
                    con calzado industrial de la más alta calidad, combinando seguridad, confort y accesibilidad.</p>
                    <p><strong>Visión:</strong> Ser la empresa líder en calzado de seguridad en Perú 
                    y expandir nuestra presencia en mercados internacionales, reconocidos por la excelencia y la innovación.</p>
                </div>
                </div>
            </div>
            </section>
        `;
    }


      async generateHomePage() {
        return `
            <!-- Hero Section - Carrusel personalizado -->
            <section class="hero-section bg-primary text-white py-3">
                <div class="container-carousel">
                    <div class="custom-carousel" id="customCarousel">
                        <div class="custom-carousel-slides">
                            <div class="custom-carousel-slide active">
                                <div class="container-fluid">
                                    <div class="row align-items-center justify-content-center h-100">
                                        <div class="col-lg-6">
                                        <h1 class="display-4 fw-bold mb-2">Calzado de Seguridad Industrial</h1>
                                        <h3 class="mb-3 text-warning">Protección y confort para tu equipo</h3>
                                        <ul class="mb-3 ps-3">
                                            <li>Certificados y normados para industria</li>
                                            <li>Antideslizantes, dieléctricos e impermeables</li>
                                            <li>Diseño ergonómico y resistente</li>
                                        </ul>
                                        <p class="lead mb-4">Cuida a tus trabajadores con la mejor calidad en calzado de seguridad.</p>
                                        <a href="/productos" class="btn btn-warning btn-lg text-dark fw-bold">Descubre la colección</a>
                                    </div>
                                        <div class="col-lg-6">
                                            <img src="assets/images/slider-image.jpg" class="d-block w-100 carousel-img-mobile-mt" alt="Calzado 1">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="custom-carousel-slide">
                                <div class="container-fluid">
                                    <div class="row align-items-center justify-content-center h-100">
                                        <div class="col-lg-6">
                                        <h1 class="display-4 fw-bold mb-2">Envíos Rápidos</h1>
                                        <h3 class="mb-3 text-warning">Recibe tu pedido sin demoras</h3>
                                        <ul class="mb-3 ps-3">
                                            <li>Stock disponible inmediato</li>
                                            <li>Entrega en 24-48 horas</li>
                                            <li>Envíos a todo el país</li>
                                        </ul>
                                        <p class="lead mb-4">Compra hoy y recibe tus productos en tiempo récord.</p>
                                        <a href="/productos" class="btn btn-warning btn-lg text-dark fw-bold">Comprar ahora</a>
                                    </div>
                                        <div class="col-lg-6">
                                            <img src="assets/images/calzados-seguridad.jpg" class="d-block w-100 carousel-img-mobile-mt" alt="Calzado 2">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="custom-carousel-slide">
                                <div class="container-fluid">
                                    <div class="row align-items-center justify-content-center h-100">
                                        <div class="col-lg-6">
                                        <h1 class="display-4 fw-bold mb-2">Variedad de Modelos</h1>
                                        <h3 class="mb-3 text-warning">Encuentra el ideal para tu industria</h3>
                                        <ul class="mb-3 ps-3">
                                            <li>Amplia gama de estilos y tallas</li>
                                            <li>Opciones para diferentes sectores</li>
                                            <li>Asesoría personalizada</li>
                                        </ul>
                                        <p class="lead mb-4">Elige el calzado perfecto para tu equipo y tu empresa.</p>
                                        <a href="/productos" class="btn btn-warning btn-lg text-dark fw-bold">Ver todos los modelos</a>
                                    </div>
                                        <div class="col-lg-6">
                                            <img src="assets/images/calzado-seguridad-industrial.jpeg" class="d-block w-100 carousel-img-mobile-mt" alt="Calzado 3">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="custom-carousel-slide">
                                <div class="container-fluid">
                                    <div class="row align-items-center justify-content-center h-100">
                                        <div class="col-lg-6">
                                        <h1 class="display-4 fw-bold mb-2">Calidad Certificada</h1>
                                        <h3 class="mb-3 text-warning">Productos con garantía internacional</h3>
                                        <ul class="mb-3 ps-3">
                                            <li>Certificaciones ISO y CE</li>
                                            <li>Pruebas rigurosas de resistencia</li>
                                            <li>Materiales de primera calidad</li>
                                        </ul>
                                        <p class="lead mb-4">Confianza respaldada por estándares internacionales de seguridad.</p>
                                    </div>
                                        <div class="col-lg-6">
                                            <img src="assets/images/slide4.jpg" class="d-block w-100 carousel-img-mobile-mt" alt="Calidad certificada">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="custom-carousel-slide">
                                <div class="container-fluid">
                                    <div class="row align-items-center justify-content-center h-100">
                                        <div class="col-lg-6">
                                        <h1 class="display-4 fw-bold mb-2">Atención Personalizada</h1>
                                        <h3 class="mb-3 text-warning">Te acompañamos en cada paso</h3>
                                        <ul class="mb-3 ps-3">
                                            <li>Asesoría especializada</li>
                                            <li>Soporte técnico 24/7</li>
                                            <li>Seguimiento post-venta</li>
                                        </ul>
                                        <p class="lead mb-4">Un equipo experto dedicado a brindarte la mejor experiencia de compra.</p>
                                        <a href="/contacto" class="btn btn-warning btn-lg text-dark fw-bold">Contáctanos</a>
                                    </div>
                                        <div class="col-lg-6">
                                            <img src="assets/images/calzados-industrial.jpg" class="d-block w-100 carousel-img-mobile-mt" alt="Atención personalizada">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button hidden class="custom-carousel-control prev" aria-label="Anterior">&#10094;</button>
                        <button hidden class="custom-carousel-control next" aria-label="Siguiente">&#10095;</button>
                        <div class="custom-carousel-indicators">
                            <span class="indicator active" data-slide="0"></span>
                            <span class="indicator" data-slide="1"></span>
                            <span class="indicator" data-slide="2"></span>
                            <span class="indicator" data-slide="3"></span>
                            <span class="indicator" data-slide="4"></span>
                        </div>
                    </div>
                </div>
            </section>


            <!-- Características -->
            <section class="py-5">
                <div class="container">
                    <div class="row text-center">
                        <div class="col-md-4 mb-4">
                            <div class="feature-card p-4">
                                <i class="fas fa-shield-alt fa-3x custom-icon mb-3"></i>
                                <h4>Máxima Protección</h4>
                                <p>Calzado certificado que cumple con todas las normas de seguridad industrial.</p>
                            </div>
                        </div>
                        <div class="col-md-4 mb-4">
                            <div class="feature-card p-4">
                                <i class="fas fa-shipping-fast fa-3x custom-icon mb-3"></i>
                                <h4>Envío Rápido</h4>
                                <p>Entrega en 24-48 horas a nivel nacional. Stock disponible inmediatamente.</p>
                            </div>
                        </div>
                        <div class="col-md-4 mb-4">
                            <div class="feature-card p-4">
                                <i class="fas fa-award fa-3x custom-icon mb-3"></i>
                                <h4>Calidad Garantizada</h4>
                                <p>Productos de marcas reconocidas con garantía de calidad y durabilidad.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Categorías -->
            <section class="py-5 category-section" >
                <div class="container">
                    <h2 class="text-center mb-5">Nuestras Categorías</h2>
                    <div class="row" id="categorias-container">
                        <!-- Se llena dinámicamente -->
                    </div>
                </div>
            </section>

            <!-- Productos Destacados -->
            <section class="py-5">
                <div class="container">
                    <h2 class="text-center mb-5">Productos Destacados</h2>
                    <div class="row" id="productos-destacados">
                        <!-- Se llena dinámicamente -->
                    </div>
                    <div class="text-center mt-4">
                        <a href="/productos" class="btn btn-outline-primary">Ver Todos los Productos</a>
                    </div>
                </div>
            </section>

            <!-- Testimonios -->
            <!-- Testimonios -->
            <section class="py-5">
                <div class="container">
                    <h2 class="text-center mb-5 text-warning">Lo que Dicen Nuestros Clientes</h2>
                    <div class="row">
                        <div class="col-md-4 mb-4">
                            <div class="testimonial-card p-4">
                                <div class="stars mb-3">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </div>
                                <p class="mb-3">"Excelente calidad y comodidad. Mis trabajadores están muy contentos con las botas."</p>
                                <div class="d-flex align-items-center">
                                    <div class="bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                        <i class="fas fa-user text-white"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0">Carlos Mendoza</h6>
                                        <small>Gerente de Seguridad</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 mb-4">
                            <div class="testimonial-card p-4">
                                <div class="stars mb-3">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </div>
                                <p class="mb-3">"Entrega rápida y productos de primera calidad. Recomendado al 100%."</p>
                                <div class="d-flex align-items-center">
                                    <div class="bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                        <i class="fas fa-user text-white"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0">María González</h6>
                                        <small>Supervisora Industrial</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 mb-4">
                            <div class="testimonial-card p-4">
                                <div class="stars mb-3">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                </div>
                                <p class="mb-3">"El mejor servicio al cliente y productos que realmente protegen."</p>
                                <div class="d-flex align-items-center">
                                    <div class="bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                        <i class="fas fa-user text-white"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-0">Roberto Silva</h6>
                                        <small>Director de Operaciones</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    async generateProductsPage() {
        return `
            <div class="container py-5">
                <div class="row">
                    <div class="col-12">
                        <h2 class="mb-4">
                            <i class="fas fa-boxes me-2"></i>
                            Nuestros Productos
                        </h2>
                    </div>
                </div>
                
                <!-- Filtros -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="input-group">
                            <input type="text" class="form-control" id="search-input" placeholder="Buscar productos...">
                            <button class="btn btn-outline-secondary" type="button" id="search-btn">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="category-filter">
                            <option value="">Todas las categorías</option>
                            <option value="Calzado Punta de Acero">Calzado Punta de Acero</option>
                            <option value="Calzado Dieléctrico">Calzado Dieléctrico</option>
                            <option value="Calzado Impermeable">Calzado Impermeable</option>
                            <option value="Línea Económica">Línea Económica</option>
                            <option value="Trekking">Trekking</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="sort-filter">
                            <option value="" disabled selected>Ordenar por...</option>
                            <option value="nombre">Ordenar por nombre</option>
                            <option value="precio_asc">Precio: menor a mayor</option>
                            <option value="precio_desc">Precio: mayor a menor</option>
                            <option value="fecha_desc">Más recientes</option>
                        </select>
                    </div>
                </div>
                
                <!-- Productos -->
                <div class="row" id="products-container">
                    <!-- Se llena dinámicamente -->
                </div>
                
                <!-- Paginación -->
                <div class="row mt-4">
                    <div class="col-12">
                        <nav aria-label="Paginación de productos">
                            <ul class="pagination justify-content-center" id="pagination-container">
                                <!-- Se llena dinámicamente -->
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        `;
    }

    async generateProductDetailPage(productId) {
        return `
            <div class="container py-3">
                <div class="row" id="product-detail-container">
                    <!-- Se llena dinámicamente -->
                </div>
                <div class="row" id="product-feature-container">
                    <!-- Se llena dinámicamente -->
                </div>
            </div>
        `;
    }

    async generateCategoriesPage() {
        return `
            <div class="container py-5">
                <div class="row">
                    <div class="col-12">
                        <h2 class="mb-4">
                            <i class="fas fa-tags me-2"></i>
                            Nuestras Categorías
                        </h2>
                    </div>
                </div>
                
                <div class="row" id="categories-container">
                    <!-- Se llena dinámicamente -->
                </div>
            </div>
        `;
    }

    async generateCategoryProductsPage(categoryId) {
        return `
            <div class="container py-5">
                <div class="row">
                    <div class="col-12">
                        <h2 class="mb-4" id="category-title">
                            <i class="fas fa-tag me-2"></i>
                            Productos de la Categoría
                        </h2>
                    </div>
                </div>
                
                <div class="row" id="category-products-container">
                    <!-- Se llena dinámicamente -->
                </div>
            </div>
        `;
    }

    async generateCartPage() {
        return `
            <div class="container py-5">
                <div class="row">
                    <div class="col-12">
                        <h2 class="mb-4">
                            <i class="fas fa-shopping-cart me-2"></i>
                            Carrito de Compras
                        </h2>
                    </div>
                </div>
                
                <div class="row">
                    <!-- Items del Carrito -->
                    <div class="col-lg-8">
                        <div class="card" id="cart-page">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Productos en tu carrito</h5>
                                <button class="btn btn-outline-danger btn-sm clear-cart" id="clear-cart-btn">
                                    <i class="fas fa-trash me-1"></i>
                                    Vaciar Carrito
                                </button>
                            </div>
                            <div class="card-body p-0">
                                <div id="cart-items">
                                    <!-- Se llena dinámicamente -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Resumen del Pedido -->
                    <div class="col-lg-4">
                        <div class="card cart-summary">
                            <div class="card-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-receipt me-2"></i>
                                    Resumen del Pedido
                                </h5>
                            </div>
                            <div class="card-body">
                                <div id="cart-summary">
                                    <!-- Se llena dinámicamente -->
                                </div>
                                
                                <hr>
                                
                                <!-- Total -->
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5 class="mb-0">Total:</h5>
                                    <h4 class="mb-0 text-primary" id="cart-total">S/0</h4>
                                </div>
                                
                                <!-- Botones de Acción -->
                                <div class="d-grid gap-2">
                                    <button class="btn whatsapp-btn" id="proceed-checkout">
                                        <i class="fab fa-whatsapp fa-2x whatsapp-icon"></i>
                                        <span class="">!Comprar AHORA!</span>
                                    </button>
                                    <a href="/" class="btn btn-outline-secondary">
                                        <i class="fas fa-arrow-left me-2"></i>
                                        Continuar Comprando
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateLoginPage() {
        return `
            <div class="container py-5">
                <div class="row justify-content-center">
                    <div class="col-md-6 col-lg-5">
                        <div class="card shadow">
                            <div class="card-header bg-primary text-white text-center">
                                <h4 class="mb-0">
                                    <i class="fas fa-sign-in-alt me-2"></i>
                                    Iniciar Sesión
                                </h4>
                            </div>
                            <div class="card-body p-4">
                                <form id="login-form">
                                    <div class="mb-3">
                                        <label for="login-email" class="form-label">Email</label>
                                        <div class="input-group">
                                            <span class="input-group-text">
                                                <i class="fas fa-envelope"></i>
                                            </span>
                                            <input type="email" 
                                                   class="form-control" 
                                                   id="login-email" 
                                                   name="email" 
                                                   placeholder="tu@email.com" 
                                                   required>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="login-password" class="form-label">Contraseña</label>
                                        <div class="input-group">
                                            <span class="input-group-text">
                                                <i class="fas fa-lock"></i>
                                            </span>
                                            <input type="password" 
                                                   class="form-control" 
                                                   id="login-password" 
                                                   name="password" 
                                                   placeholder="Tu contraseña" 
                                                   required>
                                            <button class="btn btn-outline-secondary" 
                                                    type="button" 
                                                    id="toggle-password">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="remember-me">
                                        <label class="form-check-label" for="remember-me">
                                            Recordarme
                                        </label>
                                    </div>
                                    
                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-primary btn-lg">
                                            <i class="fas fa-sign-in-alt me-2"></i>
                                            Iniciar Sesión
                                        </button>
                                    </div>
                                </form>
                                
                                <hr class="my-4">
                                
                                <div class="text-center">
                                    <p class="mb-0">
                                        ¿No tienes cuenta? 
                                        <a href="/register" class="text-decoration-none fw-bold">
                                            Regístrate aquí
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateRegisterPage() {
        return `
            <div class="container py-5">
                <div class="row justify-content-center">
                    <div class="col-md-8 col-lg-6">
                        <div class="card shadow">
                            <div class="card-header bg-primary text-white text-center">
                                <h4 class="mb-0">
                                    <i class="fas fa-user-plus me-2"></i>
                                    Crear Cuenta
                                </h4>
                            </div>
                            <div class="card-body p-4">
                                <form id="register-form">
                                    <div class="mb-3">
                                        <label for="register-name" class="form-label">Nombre Completo</label>
                                        <input type="text" 
                                               class="form-control" 
                                               id="register-name" 
                                               name="name" 
                                               placeholder="Nombre y apellidos completos" 
                                               required>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="register-email" class="form-label">Email</label>
                                        <input type="email" 
                                               class="form-control" 
                                               id="register-email" 
                                               name="email" 
                                               placeholder="tu@email.com" 
                                               required>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="register-phone" class="form-label">Teléfono</label>
                                        <input type="tel" 
                                               class="form-control" 
                                               id="register-phone" 
                                               name="phone" 
                                               placeholder="+51 987 654 321">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="register-direccion" class="form-label">Dirección</label>
                                        <input type="text" 
                                               class="form-control" 
                                               id="register-direccion" 
                                               name="direccion" 
                                               placeholder=" Jr. Crespo y Castillo 256, Puente Piedra">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="register-password" class="form-label">Contraseña</label>
                                        <input type="password" 
                                               class="form-control" 
                                               id="register-password" 
                                               name="password" 
                                               placeholder="Mínimo 6 caracteres" 
                                               required>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="register-confirm-password" class="form-label">Confirmar Contraseña</label>
                                        <input type="password" 
                                               class="form-control" 
                                               id="register-confirm-password" 
                                               name="confirm_password" 
                                               placeholder="Repite tu contraseña" 
                                               required>
                                    </div>
                                    
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="accept-terms" required>
                                        <label class="form-check-label" for="accept-terms">
                                            Acepto los <a href="#" class="text-decoration-none">términos y condiciones</a>
                                        </label>
                                    </div>
                                    
                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-primary btn-lg">
                                            <i class="fas fa-user-plus me-2"></i>
                                            Crear Cuenta
                                        </button>
                                    </div>
                                </form>
                                
                                <hr class="my-4">
                                
                                <div class="text-center">
                                    <p class="mb-0">
                                        ¿Ya tienes cuenta? 
                                        <a href="/login" class="text-decoration-none fw-bold">
                                            Inicia sesión aquí
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateCheckoutPage() {
        return `
            <div class="container py-5">
                <div class="row">
                    <div class="col-12">
                        <h2 class="mb-4">
                            <i class="fas fa-credit-card me-2"></i>
                            Finalizar Compra
                        </h2>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-lg-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Información de Envío</h5>
                            </div>
                            <div class="card-body">
                                <form id="checkout-form">
                                    <div class="mb-3">
                                        <label for="shipping-name" class="form-label">Nombre Completo</label>
                                        <input type="text" class="form-control" id="shipping-name" placeholder="Nombre y apellidos completos" required>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="shipping-address" class="form-label">Dirección</label>
                                        <input type="text" class="form-control" id="shipping-address" required>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="shipping-city" class="form-label">Ciudad</label>
                                            <input type="text" class="form-control" id="shipping-city" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="shipping-phone" class="form-label">Teléfono</label>
                                            <input type="tel" class="form-control" id="shipping-phone" required>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="shipping-notes" class="form-label">Notas adicionales (opcional)</label>
                                        <textarea class="form-control" id="shipping-notes" rows="3"></textarea>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Resumen del Pedido</h5>
                            </div>
                            <div class="card-body">
                                <div id="checkout-summary">
                                    <!-- Se llena dinámicamente -->
                                </div>
                                
                                <hr>
                                
                                <div class="d-grid">
                                    <button class="btn btn-success btn-lg" id="place-order">
                                        <i class="fas fa-check me-2"></i>
                                        Confirmar Pedido
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateOrdersPage() {
        return `
            <div class="container py-5">
                <div class="row">
                    <div class="col-12">
                        <h2 class="mb-4">
                            <i class="fas fa-shopping-bag me-2"></i>
                            Mis Pedidos
                        </h2>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-12">
                        <div id="orders-container">
                            <!-- Se llena dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateProfilePage() {
        return `
            <div class="container py-5">
                <div class="row">
                    <div class="col-12">
                        <h2 class="mb-4">
                            <i class="fas fa-user me-2"></i>
                            Mi Perfil
                        </h2>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-lg-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Información Personal</h5>
                            </div>
                            <div class="card-body">
                                <form id="profile-form">
                                    <div class="mb-3">
                                        <label for="profile-name" class="form-label">Nombre Completo</label>
                                        <input type="text" class="form-control" id="profile-name" placeholder="Nombre y apellidos completos">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="profile-email" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="profile-email">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="profile-phone" class="form-label">Teléfono</label>
                                        <input type="tel" class="form-control" id="profile-phone">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="profile-address" class="form-label">Dirección</label>
                                        <textarea class="form-control" id="profile-address" rows="2" placeholder="Tu dirección completa"></textarea>
                                    </div>
                                    
                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-save me-2"></i>
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Cambiar Contraseña</h5>
                            </div>
                            <div class="card-body">
                                <form id="change-password-form">
                                    <div class="mb-3">
                                        <label for="current-password" class="form-label">Contraseña Actual</label>
                                        <div class="input-group">
                                            <input type="password" class="form-control" id="current-password">
                                            <button class="btn btn-outline-secondary toggle-password" type="button" data-target="current-password" title="Mostrar contraseña">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="new-password" class="form-label">Nueva Contraseña</label>
                                        <div class="input-group">
                                            <input type="password" class="form-control" id="new-password">
                                            <button class="btn btn-outline-secondary toggle-password" type="button" data-target="new-password" title="Mostrar contraseña">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="confirm-new-password" class="form-label">Confirmar Nueva Contraseña</label>
                                        <div class="input-group">
                                            <input type="password" class="form-control" id="confirm-new-password">
                                            <button class="btn btn-outline-secondary toggle-password" type="button" data-target="confirm-new-password" title="Mostrar contraseña">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-warning">
                                            <i class="fas fa-key me-2"></i>
                                            Cambiar Contraseña
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async generateContactPage() {
        return `
            <div class="contact-page-container mx-auto py-5">
                <div class="row">
                    <div class="col-12 text-center mb-5">
                        <h2 class="mb-4">
                            <i class="fas fa-envelope me-2"></i>
                            Contacto
                        </h2>
                        <p class="lead text-warning">Estamos aquí para ayudarte. Contáctanos y te responderemos pronto.</p>
                    </div>
                </div>
                
                <div class="row contact-columns-container">
                    <div class="col-lg-8">
                        <div class="card contact-card contact-form-card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-paper-plane me-2"></i>Envíanos un Mensaje</h5>
                            </div>
                            <div class="card-body">
                                <form id="contact-form">
                                    <div class="mb-3">
                                        <label for="contact-name" class="form-label">Nombre Completo</label>
                                        <input type="text" class="form-control" id="contact-name" placeholder="Nombre y apellidos completos" required>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="contact-email" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="contact-email" required>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="contact-subject" class="form-label">Asunto</label>
                                        <input type="text" class="form-control" id="contact-subject" required>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="contact-message" class="form-label">Mensaje</label>
                                        <textarea class="form-control" id="contact-message" rows="5" required></textarea>
                                    </div>
                                    
                                    <div class="d-grid">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-paper-plane me-2"></i>
                                            Enviar Mensaje
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <div class="card contact-card contact-info-card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>Información de Contacto</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <h6><i class="fas fa-phone me-2"></i>Teléfono</h6>
                                    <p><a href="tel:+51940870622" class="text-decoration-none">+51 940 870 622</a></p>
                                </div>
                                
                                <div class="mb-3">
                                    <h6><i class="fas fa-envelope me-2"></i>Email</h6>
                                    <p><a href="mailto:info@leopardo.com" class="text-decoration-none">info@leopardo.com</a></p>
                                </div>
                                
                                <div class="mb-3">
                                    <h6><i class="fas fa-map-marker-alt me-2"></i>Dirección</h6>
                                    <p>Mz.A2 Lt. 7 villa de la Cruz Alborada<br>Puente Piedra 07056<br>Lima, Perú</p>
                                    <div class="map-container mb-3" style="position: relative; width: 100%; height: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                        <iframe 
                                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3901.847!2d-77.06836!3d-11.86290!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDUxJzQ2LjQiUyA3N8KwMDQnMDYuMSJX!5e0!3m2!1ses!2spe!4v1696180800000!5m2!1ses!2spe&q=Mz.A2+Lt.7+Villa+de+la+Cruz+Alborada+Puente+Piedra+Lima" 
                                            width="100%" 
                                            height="280" 
                                            style="border: 0; border-radius: 8px; display: block; max-width: 100%; max-height: 100%;" 
                                            allowfullscreen="" 
                                            loading="lazy" 
                                            referrerpolicy="no-referrer-when-downgrade"
                                            title="Ubicación Exacta - Calzado Industrial Leopardo">
                                        </iframe>
                                        <div style="position: absolute; top: 8px; right: 8px;">
                                            <a href="https://maps.app.goo.gl/bFq3Z5pGwer6V5bRA" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="background: rgba(0,0,0,0.7); border: none;" title="Ver ubicación exacta en Google Maps">
                                                <i class="fas fa-external-link-alt"></i>
                                            </a>
                                        </div>
                                    </div>
                                    <div class="text-center">
                                        <a href="https://maps.app.goo.gl/bFq3Z5pGwer6V5bRA" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm">
                                            <i class="fas fa-route me-2"></i>Cómo llegar
                                        </a>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <h6><i class="fas fa-clock me-2"></i>Horarios</h6>
                                    <p>Lunes - Viernes: 8:00 AM - 6:00 PM<br>Sábados: 9:00 AM - 2:00 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generate404Page() {
        return `
            <div class="container py-5">
                <div class="row justify-content-center">
                    <div class="col-md-6 text-center">
                        <div class="error-page">
                            <i class="fas fa-exclamation-triangle fa-5x text-warning mb-4"></i>
                            <h1 class="display-1 fw-bold text-primary">404</h1>
                            <h2 class="mb-4">Página no encontrada</h2>
                            <p class="lead mb-4">Lo sentimos, la página que buscas no existe o ha sido movida.</p>
                            <a href="/" class="btn btn-primary btn-lg">
                                <i class="fas fa-home me-2"></i>
                                Volver al Inicio
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showErrorPage() {
        document.getElementById('main-content').innerHTML = this.generate404Page();
    }

    executePageScripts(pageName, params) {
        // Ejecutar scripts específicos de cada página
        switch (pageName) {
            case 'home':
                this.executeHomeScripts();
                break;
            case 'products':
                this.executeProductsScripts();
                break;
            case 'busqueda':
                this.executeBusquedaScripts();
                break;
            case 'product-detail':
                this.executeProductDetailScripts(params.id);
                break;
            case 'categories':
                this.executeCategoriesScripts();
                break;
            case 'category-products':
                this.executeCategoryProductsScripts(params.id);
                break;
            case 'cart':
                this.executeCartScripts();
                break;
            case 'login':
                this.executeLoginScripts();
                break;
            case 'register':
                this.executeRegisterScripts();
                break;
            case 'checkout':
                this.executeCheckoutScripts();
                break;
            case 'orders':
                this.executeOrdersScripts();
                break;
            case 'profile':
                this.executeProfileScripts();
                break;
            case 'contact':
                this.executeContactScripts();
                break;
            case 'admin':
                this.executeAdminScripts();
                break;
        }
    }

    
    // Ejecuta scripts específicos para la página de administración
    executeAdminScripts() {
    // Evita cargar dos veces
    if (window.AdminScriptsLoaded) return;
        window.AdminScriptsLoaded = true;

        // Carga dinámica de admin.js
        const script = document.createElement('script');
        script.src = '/assets/js/admin.js';
        script.onload = function() {
            if (window.initAdminPanel) {
                window.initAdminPanel();
            }
        };
    document.body.appendChild(script);
    }

    executeHomeScripts() {
        // Cargar categorías
        this.loadCategories();
        // Cargar productos destacados
        this.loadFeaturedProducts();

        // Carrusel personalizado con efecto slide
        const carousel = document.getElementById('customCarousel');
        if (carousel) {
            const slidesContainer = carousel.querySelector('.custom-carousel-slides');
            const slides = carousel.querySelectorAll('.custom-carousel-slide');
            const indicators = carousel.querySelectorAll('.custom-carousel-indicators .indicator');
            const prevBtn = carousel.querySelector('.custom-carousel-control.prev');
            const nextBtn = carousel.querySelector('.custom-carousel-control.next');
            let current = 0;
            let interval = null;

            // Verificación de slides detectados
            console.log(`Carousel inicializado con ${slides.length} slides y ${indicators.length} indicadores`);

            // Validar que tenemos slides e indicadores
            if (slides.length === 0) {
                console.error('No se encontraron slides en el carousel');
                return;
            }

            if (slides.length !== indicators.length) {
                console.warn(`Advertencia: ${slides.length} slides pero ${indicators.length} indicadores`);
            }

            // Configurar el contenedor de slides para el efecto slide con gap
            if (slidesContainer && slides.length > 0) {
                // El CSS ya tiene display: flex y gap: 20px configurado
                // Solo necesitamos asegurar que la transición esté configurada
                slidesContainer.style.transition = 'transform 0.7s cubic-bezier(.77,.2,.25,1)';
                
                // Usar setTimeout para asegurar que el carousel tenga dimensiones calculadas
                setTimeout(() => {
                    const carouselWidth = carousel.offsetWidth;
                    
                    // Solo proceder si el carousel tiene ancho
                    if (carouselWidth > 0) {
                        // No modificar los estilos flex de los slides individuales
                        // El CSS ya los maneja correctamente
                        
                        console.log(`Carousel configurado: ${slides.length} slides, ancho del carousel: ${carouselWidth}px`);
                        
                        // Mostrar el primer slide después de configurar
                        showSlide(0);
                    }
                }, 100); // 100ms es suficiente para que el DOM se renderice
            }

            function showSlide(idx) {
                // Validar índice
                if (idx < 0 || idx >= slides.length) {
                    console.error(`Índice de slide inválido: ${idx}. Debe estar entre 0 y ${slides.length - 1}`);
                    return;
                }

                // Mover el contenedor usando transform para efecto slide con gap
                if (slidesContainer && slides.length > 0) {
                    const gapSize = 20;
                    const carouselWidth = carousel.offsetWidth;
                    const slideWidth = carouselWidth;
                    
                    // Calcular la posición considerando el ancho del slide y los gaps acumulados
                    const translateX = -(idx * (slideWidth + gapSize));
                    slidesContainer.style.transform = `translateX(${translateX}px)`;
                }
                
                // Actualizar indicadores
                indicators.forEach((ind, i) => {
                    if (i === idx) {
                        ind.classList.add('active');
                    } else {
                        ind.classList.remove('active');
                    }
                });
                
                // Actualizar slides activos
                slides.forEach((slide, i) => {
                    if (i === idx) {
                        slide.classList.add('active');
                    } else {
                        slide.classList.remove('active');
                    }
                });
                
                current = idx;
            }

            function nextSlide() {
                if (slides.length === 0) {
                    console.warn('No se puede avanzar slide: no hay slides disponibles');
                    return;
                }
                
                const next = (current + 1) % slides.length;
                showSlide(next);
            }
            
            function prevSlide() {
                if (slides.length === 0) {
                    console.warn('No se puede retroceder slide: no hay slides disponibles');
                    return;
                }
                
                const prev = (current - 1 + slides.length) % slides.length;
                console.log(`Retrocediendo slide: ${current + 1} → ${prev + 1} (de ${slides.length} total)`);
                showSlide(prev);
            }

            // Función para recalcular dimensiones (simplificada)
            function recalculateCarousel() {
                // Solo reposicionar al slide actual, ya que el CSS maneja los estilos
                if (slidesContainer && slides.length > 0) {
                    showSlide(current);
                }
            }

            nextBtn.addEventListener('click', nextSlide);
            prevBtn.addEventListener('click', prevSlide);
            indicators.forEach((ind, i) => {
                ind.addEventListener('click', () => showSlide(i));
            });

            // Recalcular cuando cambie el tamaño de la ventana
            window.addEventListener('resize', recalculateCarousel);

            // Auto-slide
            function startAutoSlide() {
                interval = setInterval(nextSlide, 8000);
            }
            function stopAutoSlide() {
                clearInterval(interval);
            }
            carousel.addEventListener('mouseenter', stopAutoSlide);
            carousel.addEventListener('mouseleave', startAutoSlide);
            
            // Inicializar y comenzar auto-slide
            // No llamar recalculateCarousel() inmediatamente, ya que el setTimeout lo manejará
            startAutoSlide();
        }
    }

    executeProductsScripts() {
        this.loadProducts();
    }

    executeBusquedaScripts() {
        this.loadProducts().then(() => {
        this.setupProductFilters();
    });
    }

    executeProductDetailScripts(productId) {
        this.loadProductDetail(productId);
    }

    executeCategoriesScripts() {
        this.loadCategories();
    }

    executeCategoryProductsScripts(categoryId) {
        this.loadCategoryProducts(categoryId);
    }

    executeCartScripts() {
        this.loadCart();
    }

    executeLoginScripts() {
        this.setupLoginForm();
    }

    executeRegisterScripts() {
        this.setupRegisterForm();
    }

    executeCheckoutScripts() {
        this.loadCheckoutData();
    }

    executeOrdersScripts() {
        this.loadOrders();
    }

    executeProfileScripts() {
        this.loadProfile();
    }

    executeContactScripts() {
        this.setupContactForm();
    }

    getPageTitle(pageName) {
        const titles = {
            'home': 'Leopardo E-commerce - Calzado de Seguridad Industrial',
            'products': 'Productos - Leopardo E-commerce',
            'product-detail': 'Detalle del Producto - Leopardo E-commerce',
            'categories': 'Categorías - Leopardo E-commerce',
            'category-products': 'Productos por Categoría - Leopardo E-commerce',
            'cart': 'Carrito de Compras - Leopardo E-commerce',
            'login': 'Iniciar Sesión - Leopardo E-commerce',
            'register': 'Registrarse - Leopardo E-commerce',
            'checkout': 'Finalizar Compra - Leopardo E-commerce',
            'orders': 'Mis Pedidos - Leopardo E-commerce',
            'profile': 'Mi Perfil - Leopardo E-commerce',
            'contact': 'Contacto - Leopardo E-commerce',
            'about': 'Acerca de nosotros - Leopardo E-commerce',
            '404': 'Página no encontrada - Leopardo E-commerce',
            'admin': 'Panel de Administración - Leopardo E-commerce'
        };
        return titles[pageName] || 'Leopardo E-commerce';
    }

    // Métodos para cargar datos específicos de cada página
    async loadCategories() {
        try {
            const response = await API.get('https://leopardo.tecnovedadesweb.site/api/categorias');
            const container = document.getElementById('categorias-container');
            if (container) {
                container.innerHTML = '';
                
                if (response && response.length > 0) {
                    response.forEach(category => {
                        const categoryCard = document.createElement('div');
                        categoryCard.className = 'col-md-4 mb-4';
                        categoryCard.innerHTML = `
                            <div class="category-card">
                                <div class="category-icon">
                                    <img src="/${category.icono}" alt="Icono categoría" class="category-img">
                                </div>
                                <h4 class="category-title">${Utils.sanitizeHtml(category.nombre)}</h4>
                                <p class="category-description">${Utils.sanitizeHtml(category.descripcion || '')}</p>
                                <a href="/categorias/${category.id}" class="btn btn-outline-primary">Ver Productos</a>
                            </div>
                        `;
                        container.appendChild(categoryCard);
                    });
                } else {
                    container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No hay categorías disponibles</p></div>';
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            const container = document.getElementById('categorias-container');
            if (container) {
                container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Error al cargar el contenedor de categorías</p></div>';
            }
        }
    }

    async loadFeaturedProducts() {
        try {
            const response = await API.get('https://leopardo.tecnovedadesweb.site/api/productos/destacados');
            const container = document.getElementById('productos-destacados');
            if (container) {
                container.innerHTML = '';
                
                response.slice(0, 6).forEach(product => {
                    const productCard = this.createProductCard(product);
                    container.appendChild(productCard);
                });
            }
        } catch (error) {
            console.error('Error loading featured products:', error);
        }
    }

    async loadProducts() {
        try {
            const response = await API.get('https://leopardo.tecnovedadesweb.site/api/productos');
            const container = document.getElementById('products-container');
            if (container) {
                container.innerHTML = '';
                
                response.forEach(product => {
                    const productCard = this.createProductCard(product);
                    container.appendChild(productCard);
                });

                // ✅ Cargar dinámicamente tu script de filtros
                const script = document.createElement("script");
                script.src = "/assets/js/product-filter.js";
                script.onload = () => console.log("Filtro de productos cargado ✅");
                document.body.appendChild(script);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    createProductCard(product, options = {}) {
        const defaultOptions = {
            showAddButton: true,
            showQuickView: false,
            showWishlist: false,
            showDiscount: true,
            cardClass: 'product-card'
        };
        
        const config = { ...defaultOptions, ...options };
        
        const card = document.createElement('div');
        card.className = 'col-lg-4 col-md-6 mb-4';
        
        let discountBadge = '';
        let porcentajeDescuento = 0;
        
        // Calcular descuento si hay precio promocional
        if (product.precio_promocional && product.precio_promocional < product.precio) {
            porcentajeDescuento = Math.round(((product.precio - product.precio_promocional) / product.precio) * 100);
        }
        
        if (config.showDiscount && porcentajeDescuento > 0) {
            discountBadge = `
                <div class="position-absolute top-0 end-0 m-2" style="z-index: 3;">
                    <span class="badge bg-danger">-${porcentajeDescuento}%</span>
                </div>
            `;
        }
        
        let wishlistButton = '';
        if (config.showWishlist) {
            wishlistButton = `
                <button class="btn btn-outline-danger btn-sm position-absolute top-0 start-0 m-2 wishlist-btn" 
                        data-product-id="${product.id}">
                    <i class="fas fa-heart"></i>
                </button>
            `;
        }
        
        let quickViewButton = '';
        if (config.showQuickView) {
            quickViewButton = `
                    <a class="product-title" href="/productos/${product.id}">
                        <button class="btn btn-outline-info btn-sm position-absolute top-0 start-50 translate-middle-x mt-2 quick-view-btn" 
                                data-product-id="${product.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </a>
            `;
        }
        
        card.innerHTML = `
            <div class="${config.cardClass} position-relative product-item" 
            data-name="${Utils.sanitizeHtml(product.nombre)}"
            data-category="${product.categoria_nombre}"
            data-price="${product.precio_promocional}"
            data-date="${product.fecha_creacion}">
                ${discountBadge}
                ${wishlistButton}
                ${quickViewButton}
                
                <img src="/${product.imagen_principal || 'assets/producto-default.jpg'}" 
                     alt="${Utils.sanitizeHtml(product.nombre)}" 
                     class="product-image">
                
                <div class="product-info">
                    <a class="product-title" href="/productos/${product.id}">${Utils.sanitizeHtml(product.nombre)}</a>
                    <p class="product-price">
                    ${
                      (product.precio_promocional > 0 || product.precio > 0)
                        ? Utils.formatPriceWithPromo(product)
                        : `<span class="price-undefined">Precio a consultar</span>`
                    }
                    </p>
                    <p class="product-description">${Utils.sanitizeHtml(product.descripcion || '')}</p>
                    
                    <div class="product-actions">
                        ${config.showAddButton ? `
                            <button class="btn btn-primary btn-add-cart" 
                                    data-product-id="${product.id}"
                                    onclick="showSizeSelector(${product.id}, '${Utils.sanitizeHtml(product.nombre)}')">
                                <i class="fas fa-cart-plus me-2"></i>Agregar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
            // Redirigir al hacer clic en la tarjeta
    const cardContent = card.querySelector('.product-item');
    cardContent.style.cursor = 'pointer';
    cardContent.addEventListener('click', (e) => {
        // Evitar conflicto si se hace clic en botones internos
        if (!e.target.closest('button')) {
            window.location.href = `/productos/${product.id}`;
        }
    });
        
        
        return card;
    }

    setupLoginForm() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const loginData = {
                    email: formData.get('email'),
                    password: formData.get('password')
                };
                
                try {
                    await Auth.login(loginData.email, loginData.password);
                } catch (error) {
                    console.error('Login error:', error);
                }
            });
        }
        
        // Configurar toggle de contraseña
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('login-password');
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', function() {
                // Alternar tipo de input entre password y text
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Cambiar icono
                const icon = this.querySelector('i');
                if (type === 'text') {
                    icon.className = 'fas fa-eye-slash';
                    this.setAttribute('title', 'Ocultar contraseña');
                } else {
                    icon.className = 'fas fa-eye';
                    this.setAttribute('title', 'Mostrar contraseña');
                }
            });
        }
    }

    setupRegisterForm() {
        const form = document.getElementById('register-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const registerData = {
                    name: formData.get('name'),
                    lastname: formData.get('lastname'),
                    email: formData.get('email'),
                    telephone: formData.get('phone'),
                    direccion: formData.get('direccion'),
                    password: formData.get('password')
                };
                
                try {
                    await Auth.register(registerData);
                } catch (error) {
                    console.error('Register error:', error);
                }
            });

            // Setup password toggle functionality
            const togglePassword = form.querySelector('#toggle-password');
            if (togglePassword) {
                togglePassword.addEventListener('click', function() {
                    const passwordInput = form.querySelector('input[name="password"]');
                    const icon = this.querySelector('i');
                    
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        icon.className = 'fas fa-eye-slash';
                        this.title = 'Ocultar contraseña';
                    } else {
                        passwordInput.type = 'password';
                        icon.className = 'fas fa-eye';
                        this.title = 'Mostrar contraseña';
                    }
                });
            }
        }
    }

    // Métodos adicionales para otras páginas...
    async loadProductDetail(productId) {
        try {
            const product = await API.get(`/productos/${productId}`);
            const container = document.getElementById('product-detail-container');
            const container1 = document.getElementById('product-feature-container');
            if (container && product) {
                // Generar galería de imágenes dinámicamente
                let images = [product.imagen_principal];
                
                // Agregar imágenes adicionales si existen, sino agregar predeterminadas
                if (product.imagenes_adicionales && product.imagenes_adicionales.length > 0) {
                    images = images.concat(product.imagenes_adicionales);
                } else {
                    // Imágenes predeterminadas si no hay adicionales
                    images = images.concat([
                        'assets/images/calzado-seguridad-industria.jpg',
                        'assets/images/calzado-seguridad-industria.jpg',
                        'assets/images/calzado-seguridad-industria.jpg'
                    ]);
                }
                
                // Generar thumbnails para la galería
                let thumbnailsHtml = '';
                images.forEach((image, index) => {
                    const isActive = index === 0 ? 'active' : '';
                    thumbnailsHtml += `
                        <img src="/${image}" class="gallery-thumbnail ${isActive}" 
                             data-index="${index}" alt="Vista ${index + 1}" 
                             onclick="changeMainImage('${image}', ${index})">
                    `;
                });

                // Generar opciones de tallas con stock
                let tallasOptions = '';
                let primeraeTalla = null;
                let stockPrimeraTalla = 0;
                
                // Definir rangos de tallas especiales (simple)
                const tallasEspeciales = ['31','32','33', '34','35', '36', '37', '45', '46', '47', '48', '49', '50'];
                let tallasNormales = '';
                let tallasEspecialesHtml = '';
                let hasTallasNormales = false;
                let hasTallasEspeciales = false;
                
                if (product.tallas_stock) {
                    let isFirstOverall = true;
                    
                    Object.entries(product.tallas_stock).forEach(([talla, stock]) => {
                        if (stock > 0) {
                            const isFirst = isFirstOverall;
                            if (isFirst) {
                                primeraeTalla = talla;
                                stockPrimeraTalla = stock;
                                isFirstOverall = false;
                            }
                            
                            const tallaHtml = `
                                <input type="radio" class="btn-check" name="talla-options" id="talla-${talla}" 
                                       value="${talla}" data-stock="${stock}" autocomplete="off" ${isFirst ? 'checked' : ''}>
                                <label class="btn btn-outline-secondary" for="talla-${talla}">${talla}</label>
                            `;
                            
                            if (tallasEspeciales.includes(talla)) {
                                tallasEspecialesHtml += tallaHtml;
                                hasTallasEspeciales = true;
                            } else {
                                tallasNormales += tallaHtml;
                                hasTallasNormales = true;
                            }
                        }
                    });
                    
                    // Construir HTML final con separación
                    if (hasTallasNormales) {
                        tallasOptions += `
                            <div class="tallas-section mb-3">
                                <h6 class="mb-2" style="color: var(--text-secondary);">Tallas Normales</h6>
                                <div class="tallas-group">
                                    ${tallasNormales}
                                </div>
                            </div>
                        `;
                    }
                    
                    if (hasTallasEspeciales) {
                        tallasOptions += `
                            <div class="tallas-section mb-3">
                                <h6 class="text-warning mb-2">
                                    <i class="fas fa-star me-1"></i>Tallas Especiales 
                                    <small class="text-danger">(precio con recargo adicional)</small>
                                </h6>
                                <div class="tallas-group">
                                    ${tallasEspecialesHtml}
                                </div>
                            </div>
                        `;
                    }
                }

                // Calcular precio promocional
                const tienePromocion = product.precio_promocional && product.precio_promocional < product.precio;
                let precioHtml = '';
                let badgeDescuento = '';
                
                if (tienePromocion) {
                    const descuento = Math.round(((product.precio - product.precio_promocional) / product.precio) * 100);
                    precioHtml = `
                        <div class="product-price-detail">
                            <span class="price-normal precio-actual" data-precio-base="${product.precio}">${Utils.formatPrice(product.precio)}</span>
                            <span class="promotional-price precio-promocional" data-precio-promocional="${product.precio_promocional}">${Utils.formatPrice(product.precio_promocional)}</span>
                        </div>
                    `;
                    badgeDescuento = `
                        <div class="position-absolute top-0 end-0 m-2" style="z-index: 3;">
                            <span class="badge bg-danger discount-badge">-${descuento}%</span>
                        </div>
                    `;
                } else {
                    // Mostrar precio o texto alternativo si es 0 o no definido
                    if (!product.precio || product.precio === 0) {
                        precioHtml = `
                        <div class="product-price-detail">
                            <span class="price-undefined">Precio a consultar</span>
                        </div>`;
                    } else {
                        precioHtml = `
                        <div class="product-price-detail">
                            ${Utils.formatPrice(product.precio)}
                        </div>`;
                    }
                }

                container.innerHTML = `
            <div class="product-detail-container">
                ${badgeDescuento}
                <!-- Galería de imágenes -->
                <div class="product-gallery">
                    <div class="main-image-container">
                        <img src="/${images[0]}" id="mainProductImage" class="main-product-image" alt="${Utils.sanitizeHtml(product.nombre)}">
                    </div>
                    <div class="gallery-thumbnails">
                        ${thumbnailsHtml}
                    </div>
                </div>
                
                <!-- Detalles del producto -->
                <div class="product-details">
                    <div class="product-header">
                        <h1 class="product-name">${Utils.sanitizeHtml(product.nombre)}</h1>
                        <div class="product-meta">
                            <span class="product-sku"><strong>SKU:</strong> ${product.codigo}</span>
                            <span class="product-category"><strong>Categoría:</strong> ${product.categoria_nombre || 'General'}</span>
                        </div>
                    </div>
                    
                    ${precioHtml}
                    
                    <div class="product-description">
                        <p>${Utils.sanitizeHtml(product.descripcion || '')}</p>
                    </div>

                    <!-- Selector de tallas -->
                    <div class="size-selector">
                        <h5 id="tallaSeleccionada"><strong>Talla:</strong> ${primeraeTalla || 'No disponible'}</h5>
                        <div class="tallas-group">
                            ${tallasOptions}
                        </div>
                    </div>

                    <!-- Control de cantidad -->
                    <div class="quantity-section">
                        <strong>Cantidad:</strong>
                        <div class="quantity-controls">
                            <div class="input-group quantity-input-group">
                                <button class="btn btn-outline-secondary" type="button" id="decrease-qty">-</button>
                                <input type="number" class="form-control text-center" id="product-quantity" 
                                       value="1" min="1" max="${stockPrimeraTalla}">
                                <button class="btn btn-outline-secondary" type="button" id="increase-qty">+</button>
                            </div>
                            <div class="stock-info">
                                <span>Stock: <strong id="current-stock">${stockPrimeraTalla}</strong></span>
                            </div>
                        </div>
                    </div>

                    <!-- Botón agregar al carrito -->
                    <button class="btn-add-to-cart ${stockPrimeraTalla > 0 ? '' : 'disabled'}" 
                            data-product-id="${product.id}" ${stockPrimeraTalla > 0 ? '' : 'disabled'}>
                        <i class="fas fa-cart-plus me-2"></i>
                        ${stockPrimeraTalla > 0 ? 'Agregar al carrito' : 'Sin stock'}
                    </button>
                </div>
            </div>`;

                // Generar características dinámicamente
                let caracteristicasList = '';
                const specs = [
                    { label: 'Categoría', value: product.categoria_nombre || 'General' },
                    { label: 'Tipo', value: product.tipo },
                    { label: 'Material', value: product.material },
                    { label: 'Espesor del cuero', value: product.espesor_cuero },
                    { label: 'Forro', value: product.forro },
                    { label: 'Puntera', value: product.puntera },
                    { label: 'Suela', value: product.suela },
                    { label: 'Plantilla', value: product.plantilla },
                    { label: 'Aislamiento', value: product.aislamiento },
                    { label: 'Impermeable', value: product.impermeable ? 'Sí' : 'No' }
                ];

                specs.forEach(spec => {
                    if (spec.value) {
                        caracteristicasList += `
                            <li class="spec-item">
                                <strong>${spec.label}: </strong>${Utils.sanitizeHtml(spec.value)}
                            </li>
                        `;
                    }
                });

                // Agregar características adicionales si existen
                if (product.caracteristicas && Array.isArray(product.caracteristicas)) {
                    product.caracteristicas.forEach(caracteristica => {
                        caracteristicasList += `
                            <li class="feature-item">
                                <i class="fas fa-check-circle me-2"></i>
                                ${Utils.sanitizeHtml(caracteristica)}
                            </li>
                        `;
                    });
                }

                container1.innerHTML = `
                <div class="product-features-container" id="product-features-container-custom">
                    <div class="features-content">
                        <h2 class="features-title">
                            <i class="fas fa-cogs me-2"></i>
                            Características técnicas
                        </h2>
                        
                        <div class="features-description">
                            <p style="margin: 0;">${Utils.sanitizeHtml(product.descripcion || '')}</p>
                        </div>

                        <div class="specifications-grid">
                            <div class="specifications-column">
                                <h4 class="spec-title">
                                    <i class="fas fa-tools me-2"></i>
                                    Especificaciones
                                </h4>
                                <ul class="specifications-list">
                                    ${caracteristicasList}
                                </ul>
                            </div>
                            
                            ${product.caracteristicas && product.caracteristicas.length > 0 ? `
                            <div class="features-column">
                                <h4 class="spec-title">
                                    <i class="fas fa-star me-2"></i>
                                    Características destacadas
                                </h4>
                                <div class="features-badges">
                                    ${product.caracteristicas.map(caracteristica => `
                                        <span class="feature-badge">
                                            <i class="fas fa-shield-alt me-1"></i>
                                            ${Utils.sanitizeHtml(caracteristica)}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>

                        ${product.destacado ? `
                        <div class="product-highlight">
                            <i class="fas fa-fire me-2"></i>
                            <strong>¡Producto destacado!</strong> Este producto forma parte de nuestra selección premium.
                        </div>
                        ` : ''}
                    </div>
                </div>`;
            }
            // Cargar CSS específico para detalles del producto
            if (!document.querySelector('link[href="/assets/css/product-details.css"]')) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = "/assets/css/product-details.css";
                document.head.appendChild(link);
            }
            
            // Configurar eventos interactivos
            this.setupProductDetailEvents(product);
            
            // Configurar sistema de tallas especiales
            if (window.TallasEspeciales) {
                window.currentProduct = product; // Objeto global para el sistema de tallas
                window.TallasEspeciales.setPreciosBase(product.precio, product.precio_promocional);
                
                // Activar el precio inicial para la primera talla si hay una seleccionada
                setTimeout(() => {
                    const primeraeTallaSeleccionada = document.querySelector('input[name="talla-options"]:checked');
                    if (primeraeTallaSeleccionada) {
                        window.TallasEspeciales.onTallaChange(primeraeTallaSeleccionada);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error loading product detail:', error);
        }
    }

    setupProductDetailEvents(product) {
        // Evento para cambio de talla
        const tallaInputs = document.querySelectorAll('input[name="talla-options"]');
        const tallaSeleccionada = document.getElementById('tallaSeleccionada');
        const currentStock = document.getElementById('current-stock');
        const quantityInput = document.getElementById('product-quantity');
        const addToCartBtn = document.querySelector('.btn-add-to-cart');

        tallaInputs.forEach(input => {
            input.addEventListener('change', function() {
                const talla = this.value;
                const stock = parseInt(this.dataset.stock);
                
                tallaSeleccionada.innerHTML = `<strong>Talla:</strong> ${talla}`;
                currentStock.textContent = stock;
                quantityInput.setAttribute('max', stock);
                quantityInput.value = Math.min(parseInt(quantityInput.value), stock);
                
                // Habilitar/deshabilitar botón según stock
                if (stock > 0) {
                    addToCartBtn.classList.remove('disabled');
                    addToCartBtn.removeAttribute('disabled');
                    addToCartBtn.innerHTML = '<i class="fas fa-cart-plus me-2"></i>Agregar al carrito';
                } else {
                    addToCartBtn.classList.add('disabled');
                    addToCartBtn.setAttribute('disabled', 'true');
                    addToCartBtn.innerHTML = '<i class="fas fa-times me-2"></i>Sin stock';
                }
            });
        });

        const decreaseBtn = document.getElementById('decrease-qty');
        const increaseBtn = document.getElementById('increase-qty');
        const botonCarrito = document.querySelector('.btn-add-to-cart');
        const isLineaEconomica = product.categoria_nombre === "Línea Económica";

        function actualizarBoton() {
            const cantidad = parseInt(quantityInput.value) || 0;
            if (!isLineaEconomica) return;

            const cumpleMinimo = cantidad >= 12;
            botonCarrito.disabled = !cumpleMinimo;
            botonCarrito.classList.toggle('disabled', !cumpleMinimo);
            botonCarrito.innerHTML = cumpleMinimo
                ? '<i class="fas fa-cart-plus me-2"></i>Agregar al carrito'
                : '<i class="fas fa-times me-2"></i>Compra mínima: 12 unidades';
        }

        decreaseBtn.addEventListener('click', function() {
            let val = parseInt(quantityInput.value) || 1;
            if (val > 1) val--;
            quantityInput.value = val;
            actualizarBoton();
        });

        increaseBtn.addEventListener('click', function() {
            let val = parseInt(quantityInput.value) || 1;
            const maxStock = parseInt(quantityInput.getAttribute('max')) || 0;
            if (val < maxStock) val++;
            quantityInput.value = val;
            actualizarBoton();
        });

        quantityInput.addEventListener('input', actualizarBoton);
        actualizarBoton();


        // Evento para agregar al carrito
        addToCartBtn.addEventListener('click', function() {
            if (this.hasAttribute('disabled')) return;
            
            const selectedTalla = document.querySelector('input[name="talla-options"]:checked');
            const quantity = parseInt(quantityInput.value);
            
            if (selectedTalla && quantity > 0) {
                const stockDisponible = parseInt(selectedTalla.getAttribute('data-stock'));
                
                // Llamar al método de carrito con talla
                CartManager.addWithSize(product.id, selectedTalla.value, quantity, stockDisponible).then(() => {
                    Utils.showNotification(`${product.nombre} agregado al carrito (Talla: ${selectedTalla.value})`, 'success');
                }).catch(error => {
                    Utils.showNotification('Error al agregar producto al carrito', 'error');
                    console.error('Error adding to cart:', error);
                });
            }
        });
    }

    async loadCategoryProducts(categoryId) {
         try {
        const response = await API.get(`/productos/categoria/${categoryId}`);
        const container = document.getElementById('category-products-container');
        console.log('Success Category obtained');

        if (container) {
            container.innerHTML = '';
            if (response && response.length > 0) {
                response.forEach(product => {
                    const productCard = this.createProductCard(product);
                    container.appendChild(productCard);
                });
            } else {
                container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">No hay productos en esta categoría</p></div>';
            }
        }
        } catch (error) {
            console.error('Error loading category products:', error);
            const container = document.getElementById('category-products-container');
            if (container) {
                container.innerHTML = '<div class="col-12 text-center"><p class="text-muted">Error al cargar los productos</p></div>';
            }
        }
    }

    async loadCart() {
        if (window.CartManager && typeof CartManager.renderCartPage === 'function') {
                CartManager.renderCartPage();
                CartManager.renderCartSummary();
        }   
     }

    async loadCheckoutData() {
        // Implementar carga de datos de checkout
    }

    async loadOrders() {
        // Implementar carga de pedidos
    }

    async loadProfile() {
        try {
            // Verificar si el usuario está autenticado
            const user = AuthManager.getCurrentUser();
            if (!user) {
                // Redirigir al login si no está autenticado
                window.router.navigate('/login');
                return;
            }

            // Obtener datos actuales del usuario
            const userData = await API.get(`/users/${user.id}`);
            
            // Pre-llenar el formulario con los datos del usuario
            if (userData) {
                document.getElementById('profile-name').value = userData.name || '';
                document.getElementById('profile-email').value = userData.email || '';
                document.getElementById('profile-phone').value = userData.telefono || '';
                document.getElementById('profile-address').value = userData.direccion || '';
            }

            // Configurar el formulario de perfil
            this.setupProfileForm();
            
            // Configurar el formulario de cambio de contraseña
            this.setupChangePasswordForm();
            
        } catch (error) {
            console.error('Error loading profile:', error);
            Utils.showNotification('Error al cargar el perfil', 'error');
        }
    }

    setupProductFilters() {
        (function () {
        const inputGlobal00 = document.getElementById("busqueda-global");
        const inputHidden00 = document.getElementById("search-input");
        const productsContainer = document.getElementById("products-container");
        const products = Array.from(productsContainer.getElementsByClassName("product-item"));

        if (inputGlobal00 && inputHidden00) {
            // Pasar el texto del navbar al input principal
            inputHidden00.value = inputGlobal00.value;

            // Limpiar buscador del navbar
            inputGlobal00.value = "";

            // Lógica de filtrado solo por texto
            const searchText = inputHidden00.value.toLowerCase();

            products.forEach(product => {
                const name = product.dataset.name.toLowerCase();
                const parent = product.parentElement;

                if (name.includes(searchText)) {
                    parent.style.display = "";
                } else {
                    parent.style.display = "none";
                }
            });
        }
        })();
    }

    setupContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    // Obtener datos del formulario
                    const formData = {
                        name: document.getElementById('contact-name').value.trim(),
                        email: document.getElementById('contact-email').value.trim(),
                        subject: document.getElementById('contact-subject').value.trim(),
                        message: document.getElementById('contact-message').value.trim()
                    };

                    // Validaciones básicas
                    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
                        Utils.showNotification('Todos los campos son obligatorios', 'warning');
                        return;
                    }

                    if (!Utils.isValidEmail(formData.email)) {
                        Utils.showNotification('Por favor ingresa un email válido', 'warning');
                        return;
                    }

                    if (formData.message.length < 10) {
                        Utils.showNotification('El mensaje debe tener al menos 10 caracteres', 'warning');
                        return;
                    }

                    // Mostrar loading
                    const submitButton = contactForm.querySelector('button[type="submit"]');
                    const originalText = submitButton.innerHTML;
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';

                    // Configurar EmailJS (si no está configurado)
                    if (typeof emailjs === 'undefined') {
                        throw new Error('EmailJS no está cargado');
                    }

                    // Verificar que la configuración existe y está completa
                    if (!window.EmailConfig || !window.EmailConfig.publicKey) {
                        throw new Error('Configuración de EmailJS no encontrada. Revisa el archivo email-config.js');
                    }
                    
                    // Verificar que la configuración no tiene valores por defecto
                    if (window.validateEmailConfig && !window.validateEmailConfig()) {
                        throw new Error('Configuración de EmailJS incompleta. Configura tu cuenta en emailjs.com');
                    }

                    // Inicializar EmailJS con la clave pública desde la configuración
                    emailjs.init(window.EmailConfig.publicKey);

                    // Preparar los parámetros del template
                    const templateParams = {
                        from_name: formData.name,
                        from_email: formData.email,
                        to_email: window.EmailConfig.destinationEmail || 'josehuanca612@gmail.com',
                        subject: formData.subject,
                        message: formData.message,
                        reply_to: formData.email,
                        // Datos adicionales para hacer la plantilla más atractiva
                        company_name: 'Calzado Industrial Leopardo',
                        current_date: new Date().toLocaleDateString('es-PE', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        website: window.location.origin
                    };

                    // Enviar el email usando EmailJS
                    const response = await emailjs.send(
                        window.EmailConfig.serviceId,
                        window.EmailConfig.templateId,
                        templateParams
                    );

                    console.log('Email enviado exitosamente:', response);
                    
                    // Mostrar mensaje de éxito
                    Utils.showNotification('¡Mensaje enviado correctamente! Te contactaremos pronto.', 'success');
                    
                    // Limpiar formulario
                    contactForm.reset();
                    
                    // Restaurar botón
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                    
                } catch (error) {
                    console.error('Error sending contact form:', error);
                    
                    let errorMessage = 'Error al enviar el mensaje. Inténtalo de nuevo.';
                    
                    if (error.message.includes('EmailJS no está cargado')) {
                        errorMessage = 'Servicio de correo no disponible. Por favor intenta más tarde.';
                        console.error('EmailJS library not loaded. Make sure the CDN link is working.');
                    } else if (error.message.includes('Configuración de EmailJS no encontrada')) {
                        errorMessage = 'Configuración de email no completada. Contacta al administrador.';
                        console.error('EmailJS configuration missing. Check email-config.js file.');
                    } else if (error.text && error.text.includes('rate limit')) {
                        errorMessage = 'Has enviado muchos mensajes. Espera un momento antes de intentar de nuevo.';
                    } else if (error.status === 400) {
                        errorMessage = 'Error en los datos del formulario. Verifica la información.';
                    } else if (error.status === 401) {
                        errorMessage = 'Error de autorización del servicio de email. Contacta al administrador.';
                        console.error('EmailJS authentication error. Check your service configuration.');
                    } else if (error.text && error.text.includes('template')) {
                        errorMessage = 'Error en la plantilla de email. Contacta al administrador.';
                        console.error('EmailJS template error:', error);
                    }
                    
                    Utils.showNotification(errorMessage, 'error');
                    
                    // Restaurar botón en caso de error
                    const submitButton = contactForm.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Enviar Mensaje';
                    }
                }
            });
        }
    }

    setupProfileForm() {
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const user = AuthManager.getCurrentUser();
                    if (!user) {
                        Utils.showNotification('Sesión expirada', 'error');
                        window.router.navigate('/login');
                        return;
                    }

                    const formData = {
                        name: document.getElementById('profile-name').value.trim(),
                        email: document.getElementById('profile-email').value.trim(),
                        telefono: document.getElementById('profile-phone').value.trim(),
                        direccion: document.getElementById('profile-address').value.trim()
                    };

                    // Validaciones básicas
                    if (!formData.name || !formData.email) {
                        Utils.showNotification('Nombre y email son obligatorios', 'warning');
                        return;
                    }

                    if (!Utils.isValidEmail(formData.email)) {
                        Utils.showNotification('Email no válido', 'warning');
                        return;
                    }

                    // Actualizar perfil
                    await API.put(`/users/${user.id}`, formData);
                    
                    // Actualizar datos en el almacenamiento local
                    const updatedUser = { ...user, ...formData };
                    AuthManager.updateCurrentUser(updatedUser);
                    
                    Utils.showNotification('Perfil actualizado correctamente', 'success');
                    
                } catch (error) {
                    console.error('Error updating profile:', error);
                    if (error.status === 409) {
                        Utils.showNotification('El email ya está en uso', 'error');
                    } else {
                        Utils.showNotification('Error al actualizar el perfil', 'error');
                    }
                }
            });
        }
    }

    setupChangePasswordForm() {
        const passwordForm = document.getElementById('change-password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const user = AuthManager.getCurrentUser();
                    if (!user) {
                        Utils.showNotification('Sesión expirada', 'error');
                        window.router.navigate('/login');
                        return;
                    }

                    const currentPassword = document.getElementById('current-password').value;
                    const newPassword = document.getElementById('new-password').value;
                    const confirmPassword = document.getElementById('confirm-new-password').value;

                    // Validaciones
                    if (!currentPassword || !newPassword || !confirmPassword) {
                        Utils.showNotification('Todos los campos son obligatorios', 'warning');
                        return;
                    }

                    if (newPassword.length < 6) {
                        Utils.showNotification('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
                        return;
                    }

                    if (newPassword !== confirmPassword) {
                        Utils.showNotification('Las contraseñas no coinciden', 'warning');
                        return;
                    }

                    if (currentPassword === newPassword) {
                        Utils.showNotification('La nueva contraseña debe ser diferente a la actual', 'warning');
                        return;
                    }

                    // Cambiar contraseña
                    await API.put(`/users/${user.id}/password`, {
                        current_password: currentPassword,
                        new_password: newPassword
                    });
                    
                    Utils.showNotification('Contraseña actualizada correctamente', 'success');
                    
                    // Limpiar formulario
                    passwordForm.reset();
                    
                } catch (error) {
                    console.error('Error changing password:', error);
                    if (error.status === 400) {
                        Utils.showNotification('Contraseña actual incorrecta', 'error');
                    } else {
                        Utils.showNotification('Error al cambiar la contraseña', 'error');
                    }
                }
            });

            // Setup password toggle functionality for all password fields
            const toggleButtons = passwordForm.querySelectorAll('.toggle-password');
            toggleButtons.forEach(toggleButton => {
                toggleButton.addEventListener('click', function() {
                    const targetId = this.getAttribute('data-target');
                    const passwordInput = document.getElementById(targetId);
                    const icon = this.querySelector('i');
                    
                    if (passwordInput && passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        icon.className = 'fas fa-eye-slash';
                        this.title = 'Ocultar contraseña';
                    } else if (passwordInput) {
                        passwordInput.type = 'password';
                        icon.className = 'fas fa-eye';
                        this.title = 'Mostrar contraseña';
                    }
                });
            });
        }
    }
}

// Función global para cambiar la imagen principal de la galería
function changeMainImage(imageSrc, index) {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.gallery-thumbnail');
    
    if (mainImage) {
        mainImage.src = `/${imageSrc}`;
        
        // Actualizar clases activas de thumbnails
        thumbnails.forEach((thumb, i) => {
            if (i === index) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }
}

// Función global para mostrar selector de tallas
function showSizeSelector(productId, productName) {
    // Primero obtener la información del producto
    API.get(`/productos/${productId}`)
        .done(function(product) {
            let tallasOptions = '';
            let hasTallas = false;
            
            // Definir rangos de tallas especiales (simple)
            const tallasEspeciales = ['31','32','33', '34','35', '36', '37', '45', '46', '47', '48', '49', '50'];            
            let tallasNormales = '';
            let tallasEspecialesHtml = '';
            let hasTallasNormales = false;
            let hasTallasEspeciales = false;
            
            if (product.tallas_stock) {
                Object.entries(product.tallas_stock).forEach(([talla, stock]) => {
                    if (stock > 0) {
                        hasTallas = true;
                        const tallaHtml = `
                            <div class="col-6 col-md-4 mb-2">
                                <input type="radio" class="btn-check" name="modal-talla-options" 
                                       id="modal-talla-${talla}" value="${talla}" data-stock="${stock}">
                                <label class="btn btn-outline-primary w-100" for="modal-talla-${talla}">
                                    ${talla} <br><small class="text-muted">(Stock: ${stock})</small>
                                </label>
                            </div>
                        `;
                        
                        if (tallasEspeciales.includes(talla)) {
                            tallasEspecialesHtml += tallaHtml;
                            hasTallasEspeciales = true;
                        } else {
                            tallasNormales += tallaHtml;
                            hasTallasNormales = true;
                        }
                    }
                });
                
                // Construir HTML final con separación
                if (hasTallasNormales) {
                    tallasOptions += `
                        <div class="col-12 mb-2">
                            <h6 class="text-light mb-2">Tallas Normales</h6>
                        </div>
                        ${tallasNormales}
                    `;
                }
                
                if (hasTallasEspeciales) {
                    tallasOptions += `
                        <div class="col-12 mb-2 mt-3">
                            <h6 class="text-warning mb-2">
                                <i class="fas fa-star me-1"></i>Tallas Especiales 
                                <small class="text-danger">(precio con recargo adicional)</small>
                            </h6>
                        </div>
                        ${tallasEspecialesHtml}
                    `;
                }
            }
            
            if (!hasTallas) {
                Utils.showNotification('Producto sin stock disponible', 'warning');
                return;
            }
            
            // Crear y mostrar modal
            const modalHtml = `
                <div class="modal fade" id="sizeSelectorModal" tabindex="-1" aria-hidden="true" data-bs-theme="dark">
                    <div class="modal-dialog">
                        <div class="modal-content bg-dark text-light border-warning">
                            <div class="modal-header bg-dark border-warning">
                                <h5 class="modal-title text-dark">
                                    <i class="fas fa-ruler me-2"></i>Seleccionar Talla
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                            </div>
                            <div class="modal-body bg-dark">
                                <h6 class="mb-3 text-light">
                                    <i class="fas fa-shopping-bag me-2 text-warning"></i>${productName}
                                </h6>
                                <div class="row">
                                    ${tallasOptions}
                                </div>
                                <div class="mt-3">
                                    <label for="modal-quantity" class="form-label text-light">
                                        <i class="fas fa-sort-numeric-up me-2 text-warning"></i>Cantidad:
                                    </label>
                                    <input type="number" class="form-control bg-dark text-light border-warning" 
                                           id="modal-quantity" value="1" min="1" max="1" 
                                           style="width: 120px; box-shadow: 0 0 0 0.2rem rgba(245, 197, 24, 0.25);">
                                </div>
                            </div>
                            <div class="modal-footer bg-dark border-warning d-flex justify-content-center gap-2">
                                <button type="button" class="btn btn-outline-secondary text-light" data-bs-dismiss="modal">
                                    <i class="fas fa-times me-2"></i>Cancelar
                                </button>
                                <button type="button" class="btn text-dark fw-bold" 
                                        id="confirmAddToCart"
                                        style="background: linear-gradient(135deg, #f5c518 0%, #d4a017 100%); 
                                               border: 2px solid #f5c518; 
                                               box-shadow: 0 4px 12px rgba(245, 197, 24, 0.3);">
                                    <i class="fas fa-cart-plus me-2"></i>Agregar al Carrito
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remover modal existente si hay uno
            const existingModal = document.getElementById('sizeSelectorModal');
            if (existingModal) existingModal.remove();
            
            // Agregar modal al DOM
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // Inicializar modal
            const modal = new bootstrap.Modal(document.getElementById('sizeSelectorModal'));
            modal.show();
            
            // Evento para cambio de talla (actualizar stock máximo)
            document.querySelectorAll('input[name="modal-talla-options"]').forEach(input => {
                input.addEventListener('change', function() {
                    const stock = parseInt(this.getAttribute('data-stock'));
                    const quantityInput = document.getElementById('modal-quantity');
                    quantityInput.max = stock;
                    if (parseInt(quantityInput.value) > stock) {
                        quantityInput.value = stock;
                    }
                });
            });
            
            // Evento para confirmar agregar al carrito
            document.getElementById('confirmAddToCart').addEventListener('click', function() {
                const selectedTalla = document.querySelector('input[name="modal-talla-options"]:checked');
                const quantity = parseInt(document.getElementById('modal-quantity').value);
                
                if (!selectedTalla) {
                    Utils.showNotification('Por favor selecciona una talla', 'warning');
                    return;
                }
                
                const stock = parseInt(selectedTalla.getAttribute('data-stock'));
                
                CartManager.addWithSize(productId, selectedTalla.value, quantity, stock)
                    .then(() => {
                        Utils.showNotification(`${productName} agregado al carrito (Talla: ${selectedTalla.value})`, 'success');
                        modal.hide();
                    })
                    .catch(error => {
                        Utils.showNotification('Error al agregar producto al carrito', 'error');
                        console.error('Error adding to cart:', error);
                    });
            });
        })
        .fail(function() {
            Utils.showNotification('Error al obtener información del producto', 'error');
        });
}

// Inicializar el router cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing router...');
    window.router = new Router();
    console.log('Router initialized');
});


