/**
 * LEOPARDO E-COMMERCE - COMPONENTES
 * Componentes reutilizables para la aplicación
 */

// Componente de tarjeta de producto
class ProductCard {
    /**
     * Formatear precio con promoción si existe
     */
    
    static create(product, options = {}) {
        const defaultOptions = {
            showAddButton: true,
            showQuickView: true,
            showWishlist: false,
            showDiscount: false,
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
                <div class="position-absolute top-0 end-0 m-2">
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
                <button class="btn btn-outline-info btn-sm position-absolute top-0 start-50 translate-middle-x mt-2 quick-view-btn" 
                        data-product-id="${product.id}">
                    <i class="fas fa-eye"></i>
                </button>
            `;
        }
        
        card.innerHTML = `
            <div class="${config.cardClass} position-relative">
                ${discountBadge}
                ${wishlistButton}
                ${quickViewButton}
                
                <img src="/${product.imagen_principal || 'assets/producto-default.jpg'}" 
                     alt="${Utils.sanitizeHtml(product.nombre)}" 
                     class="product-image">
                
                <div class="product-info">
                    <h5 class="product-title">${Utils.sanitizeHtml(product.nombre)}</h5>
                    <p class="product-price">
                        ${Utils.formatPriceWithPromo(product)}
                    </p>
                    <p class="product-description">${Utils.sanitizeHtml(product.descripcion || '')}</p>
                    
                    <div class="product-actions">
                        ${config.showAddButton ? `
                            <button class="btn btn-primary btn-add-cart" 
                                    data-product-id="${product.id}">
                                <i class="fas fa-cart-plus me-2"></i>Agregar
                            </button>
                        ` : ''}
                        
                        <a href="/productos/${product.id}" class="btn btn-outline-secondary">
                            <i class="fas fa-eye"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }
}

// Componente de filtros
class FilterComponent {
    static create(container, options = {}) {
        const defaultOptions = {
            showCategoryFilter: true,
            showPriceFilter: true,
            showSortOptions: true,
            showSearch: true,
            showBrandFilter: false
        };
        
        const config = { ...defaultOptions, ...options };
        
        let filtersHtml = '<div class="filter-section">';
        
        if (config.showSearch) {
            filtersHtml += `
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <input type="text" class="form-control" id="search-input" placeholder="Buscar productos...">
                            <button class="btn btn-outline-secondary" type="button" id="search-btn">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        filtersHtml += '<div class="row">';
        
        if (config.showCategoryFilter) {
            filtersHtml += `
                <div class="col-md-3 mb-3">
                    <label for="category-filter" class="form-label">Categoría</label>
                    <select class="form-select" id="category-filter">
                        <option value="">Todas las categorías</option>
                    </select>
                </div>
            `;
        }
        
        if (config.showBrandFilter) {
            filtersHtml += `
                <div class="col-md-3 mb-3">
                    <label for="brand-filter" class="form-label">Marca</label>
                    <select class="form-select" id="brand-filter">
                        <option value="">Todas las marcas</option>
                    </select>
                </div>
            `;
        }
        
        if (config.showPriceFilter) {
            filtersHtml += `
                <div class="col-md-3 mb-3">
                    <label for="price-filter" class="form-label">Rango de Precio</label>
                    <select class="form-select" id="price-filter">
                        <option value="">Todos los precios</option>
                        <option value="0-50000">S/0 - S/50,000</option>
                        <option value="50000-100000">S/50,000 - S/100,000</option>
                        <option value="100000-200000">S/100,000 - S/200,000</option>
                        <option value="200000+">S/200,000+</option>
                    </select>
                </div>
            `;
        }
        
        if (config.showSortOptions) {
            filtersHtml += `
                <div class="col-md-3 mb-3">
                    <label for="sort-filter" class="form-label">Ordenar por</label>
                    <select class="form-select" id="sort-filter">
                        <option value="nombre">Nombre</option>
                        <option value="precio_asc">Precio: menor a mayor</option>
                        <option value="precio_desc">Precio: mayor a menor</option>
                        <option value="fecha_desc">Más recientes</option>
                        <option value="popularidad">Más populares</option>
                    </select>
                </div>
            `;
        }
        
        filtersHtml += '</div></div>';
        
        container.innerHTML = filtersHtml;
        
        // Cargar opciones de filtros
        this.loadFilterOptions(config);
        
        // Configurar event listeners
        this.setupEventListeners();
    }
    
    static async loadFilterOptions(config) {
        if (config.showCategoryFilter) {
            try {
                const categories = await API.get('/categorias');
                const select = document.getElementById('category-filter');
                if (select) {
                    categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.nombre;
                        select.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        }
    }
    
    static setupEventListeners() {
        // Búsqueda
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.triggerFilterChange();
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.triggerFilterChange();
                }
            });
        }
        
        // Filtros
        const filterSelects = document.querySelectorAll('.filter-section select');
        filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                this.triggerFilterChange();
            });
        });
    }
    
    static triggerFilterChange() {
        const filters = {
            search: document.getElementById('search-input')?.value || '',
            category: document.getElementById('category-filter')?.value || '',
            brand: document.getElementById('brand-filter')?.value || '',
            price: document.getElementById('price-filter')?.value || '',
            sort: document.getElementById('sort-filter')?.value || 'nombre'
        };
        
        // Disparar evento personalizado
        document.dispatchEvent(new CustomEvent('filters:changed', { detail: filters }));
    }
}

// Componente de paginación
class PaginationComponent {
    static create(container, currentPage, totalPages, options = {}) {
        const defaultOptions = {
            maxVisiblePages: 5,
            showFirstLast: true,
            showPrevNext: true,
            onPageChange: null
        };
        
        const config = { ...defaultOptions, ...options };
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        let paginationHtml = '<nav aria-label="Paginación"><ul class="pagination justify-content-center">';
        
        // Botón "Primera"
        if (config.showFirstLast && currentPage > 1) {
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="1">Primera</a>
                </li>
            `;
        }
        
        // Botón "Anterior"
        if (config.showPrevNext && currentPage > 1) {
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
                </li>
            `;
        }
        
        // Páginas visibles
        const startPage = Math.max(1, currentPage - Math.floor(config.maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + config.maxVisiblePages - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage;
            paginationHtml += `
                <li class="page-item ${isActive ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // Botón "Siguiente"
        if (config.showPrevNext && currentPage < totalPages) {
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>
                </li>
            `;
        }
        
        // Botón "Última"
        if (config.showFirstLast && currentPage < totalPages) {
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" data-page="${totalPages}">Última</a>
                </li>
            `;
        }
        
        paginationHtml += '</ul></nav>';
        
        container.innerHTML = paginationHtml;
        
        // Configurar event listeners
        container.addEventListener('click', (e) => {
            if (e.target.matches('.page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (config.onPageChange && page !== currentPage) {
                    config.onPageChange(page);
                }
            }
        });
    }
}

// Componente de modal de producto
class ProductModal {
    static show(product) {
        const modalHtml = `
            <div class="modal fade" id="productModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${Utils.sanitizeHtml(product.nombre)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <img src="/${product.imagen_principal || 'assets/producto-default.jpg'}" 
                                         alt="${Utils.sanitizeHtml(product.nombre)}" 
                                         class="img-fluid rounded">
                                </div>
                                <div class="col-md-6">
                                    <h4 class="text-primary">${ProductCard.formatPrice(product)}</h4>
                                    <p class="text-muted">${Utils.sanitizeHtml(product.descripcion || '')}</p>
                                    
                                    <div class="mb-3">
                                        <label for="quantity" class="form-label">Cantidad:</label>
                                        <div class="input-group" style="max-width: 150px;">
                                            <button class="btn btn-outline-secondary" type="button" id="decrease-qty">-</button>
                                            <input type="number" class="form-control text-center" id="quantity" value="1" min="1" max="${product.stock || 999}">
                                            <button class="btn btn-outline-secondary" type="button" id="increase-qty">+</button>
                                        </div>
                                    </div>
                                    
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-primary btn-lg" id="add-to-cart-modal" data-product-id="${product.id}">
                                            <i class="fas fa-cart-plus me-2"></i>
                                            Agregar al Carrito
                                        </button>
                                        <a href="/productos/${product.id}" class="btn btn-outline-primary">
                                            <i class="fas fa-eye me-2"></i>
                                            Ver Detalles Completos
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover modal existente si existe
        const existingModal = document.getElementById('productModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
        
        // Configurar event listeners
        this.setupModalEventListeners(product);
    }
    
    static setupModalEventListeners(product) {
        const quantityInput = document.getElementById('quantity');
        const decreaseBtn = document.getElementById('decrease-qty');
        const increaseBtn = document.getElementById('increase-qty');
        const addToCartBtn = document.getElementById('add-to-cart-modal');
        
        // Control de cantidad
        decreaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            const maxValue = parseInt(quantityInput.max);
            if (currentValue < maxValue) {
                quantityInput.value = currentValue + 1;
            }
        });
        
        // Agregar al carrito
        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value);
            Cart.add(product.id, quantity);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            modal.hide();
        });
    }
}

// Componente de carrito flotante
class FloatingCart {
    static show() {
        const cartHtml = `
            <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 1050;">
                <div class="card shadow-lg" id="floating-cart" style="width: 300px;">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Carrito de Compras</h6>
                        <button type="button" class="btn-close" id="close-floating-cart"></button>
                    </div>
                    <div class="card-body p-0" style="max-height: 300px; overflow-y: auto;">
                        <div id="floating-cart-items">
                            <!-- Se llena dinámicamente -->
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <strong>Total:</strong>
                            <strong class="text-primary" id="floating-cart-total">S/0</strong>
                        </div>
                        <div class="d-grid gap-2">
                            <a href="/carrito" class="btn btn-primary btn-sm">Ver Carrito</a>
                            <a href="/checkout" class="btn btn-success btn-sm">Finalizar Compra</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remover carrito flotante existente si existe
        const existingCart = document.getElementById('floating-cart');
        if (existingCart) {
            existingCart.closest('.position-fixed').remove();
        }
        
        // Agregar nuevo carrito flotante
        document.body.insertAdjacentHTML('beforeend', cartHtml);
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar contenido del carrito
        this.loadCartContent();
    }
    
    static setupEventListeners() {
        const closeBtn = document.getElementById('close-floating-cart');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
    }
    
    static loadCartContent() {
        const itemsContainer = document.getElementById('floating-cart-items');
        const totalElement = document.getElementById('floating-cart-total');
        
        if (AppState.cart.items.length === 0) {
            itemsContainer.innerHTML = `
                <div class="p-3 text-center text-muted">
                    <i class="fas fa-shopping-cart fa-2x mb-2"></i>
                    <p class="mb-0">Tu carrito está vacío</p>
                </div>
            `;
            totalElement.textContent = 'S/0';
            return;
        }
        
        let itemsHtml = '';
        AppState.cart.items.forEach(item => {
            itemsHtml += `
                <div class="p-3 border-bottom">
                    <div class="d-flex align-items-center">
                        <img src="${item.producto?.imagen_principal || 'assets/producto-default.jpg'}" 
                             alt="${Utils.sanitizeHtml(item.producto?.nombre || '')}" 
                             class="rounded me-3" 
                             style="width: 50px; height: 50px; object-fit: cover;">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${Utils.sanitizeHtml(item.producto?.nombre || '')}</h6>
                            <small class="text-muted">Cantidad: ${item.cantidad}</small>
                            <div class="text-primary fw-bold">${Utils.formatPrice(item.subtotal)}</div>
                        </div>
                        <button class="btn btn-outline-danger btn-sm remove-item" data-item-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        itemsContainer.innerHTML = itemsHtml;
        totalElement.textContent = Utils.formatPrice(AppState.cart.total);
        
        // Configurar botones de eliminar
        itemsContainer.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.closest('.remove-item').dataset.itemId;
                Cart.remove(itemId);
                this.loadCartContent();
            });
        });
    }
    
    static hide() {
        const floatingCart = document.getElementById('floating-cart');
        if (floatingCart) {
            floatingCart.closest('.position-fixed').remove();
        }
    }
}

// Componente de notificaciones toast
class ToastNotification {
    static show(message, type = 'info', duration = 5000) {
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div class="toast" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="fas fa-${this.getIcon(type)} text-${type} me-2"></i>
                    <strong class="me-auto">Leopardo E-commerce</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        // Crear contenedor de toasts si no existe
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '1055';
            document.body.appendChild(toastContainer);
        }
        
        // Agregar toast
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Mostrar toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: duration
        });
        
        toast.show();
        
        // Remover toast del DOM cuando se oculte
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
    
    static getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Exportar componentes para uso global
window.ProductCard = ProductCard;
window.FilterComponent = FilterComponent;
window.PaginationComponent = PaginationComponent;
window.ProductModal = ProductModal;
window.FloatingCart = FloatingCart;
window.ToastNotification = ToastNotification;