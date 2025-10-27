/**
 * LEOPARDO E-COMMERCE - APLICACIÓN PRINCIPAL
 * Sistema de gestión de e-commerce con jQuery y PHP
 */

// Configuración global
const APP_CONFIG = {
    // Usar el dominio actual para la API
    apiBaseUrl: window.location.origin + '/api',
    sessionTimeout: 30 * 60 * 1000, // 30 minutos
    cartKey: 'leopardo_cart',
    userKey: 'leopardo_user',
    // Número de WhatsApp de la empresa (sin el + inicial)
    whatsappNumber: '51940870622' 
};

// Estado global de la aplicación
const AppState = {
    user: null,
    cart: {
        items: [],
        total: 0,
        count: 0
    },
    categories: [],
    loading: false
};

// Utilidades
const Utils = {
    /**
     * Mostrar loading
     */
    showLoading: function(message = 'Cargando...') {
        // No-op: eliminamos el popup de carga global para evitar bloqueos
    },

    /**
     * Ocultar loading
     */
    hideLoading: function() {
        // No-op
    },

    /**
     * Mostrar notificación
     */
    showNotification: function(message, type = 'info', duration = 5000) {
        const notification = $(`
            <div class="notification ${type} alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${this.getNotificationIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `);

        $('#alert-container').append(notification);

        // Auto-remove after duration
        setTimeout(() => {
            notification.alert('close');
        }, duration);
    },

    /**
     * Obtener icono para notificación
     */
    getNotificationIcon: function(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    /**
     * Formatear precio
     */
    formatPrice: function(price) {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 0
        }).format(price);
    },

    /**
     * Formatear precio con promoción
     */
    formatPriceWithPromo: function(product) {
        if (product.precio_promocional && product.precio_promocional < product.precio) {
            return `
                <span class="price-normal">${this.formatPrice(product.precio)}</span>
                <span class="promotional-price">${this.formatPrice(product.precio_promocional)}</span>
            `;
        }
        return this.formatPrice(product.precio);
    },

    /**
     * Obtener precio efectivo (promocional si existe, normal si no)
     */
    getEffectivePrice: function(product) {
        return product.precio_promocional && product.precio_promocional < product.precio 
            ? product.precio_promocional 
            : product.precio;
    },

    /**
     * Calcular porcentaje de descuento
     */
    getDiscountPercentage: function(product) {
        if (!product.precio_promocional || product.precio_promocional >= product.precio) {
            return 0;
        }
        return Math.round(((product.precio - product.precio_promocional) / product.precio) * 100);
    },

    /**
     * Verificar si el producto tiene promoción
     */
    hasPromotion: function(product) {
        return product.precio_promocional && product.precio_promocional < product.precio;
    },

    /**
     * Formatear fecha
     */
    formatDate: function(date) {
        return new Intl.DateTimeFormat('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    },

    /**
     * Validar email
     */
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Alias para validateEmail (usado en router)
     */
    isValidEmail: function(email) {
        return this.validateEmail(email);
    },

    /**
     * Sanitizar HTML
     */
    sanitizeHtml: function(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    /**
     * Debounce function
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Obtener parámetros de URL
     */
    getUrlParams: function() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    },

    /**
     * Actualizar URL sin recargar página
     */
    updateUrl: function(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.pushState({}, '', url);
    }
};

// API Helper
const API = {
    /**
     * Realizar petición AJAX
     */
    request: function(url, options = {}) {
        let resolvedUrl;
        
        // Si la URL ya es completa (http/https)
        if (/^https?:\/\//.test(url)) {
            // Si es localhost pero estamos en producción, reemplazar TODA la URL base
            if (url.includes('localhost') && !window.location.hostname.includes('localhost')) {
                // Extraer solo la parte de la ruta después de /api
                const apiPath = url.replace(/^https?:\/\/[^\/]+\/api/, '');
                resolvedUrl = APP_CONFIG.apiBaseUrl + apiPath;
            } else {
                resolvedUrl = url;
            }
        } else {
            // URL relativa, usar apiBaseUrl
            resolvedUrl = APP_CONFIG.apiBaseUrl + url;
        }
        
        console.log('API Request:', { originalUrl: url, resolvedUrl: resolvedUrl });
               
        const defaultOptions = {
            url: resolvedUrl,
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            timeout: 30000,
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            beforeSend: function(xhr) {
                // Agregar token CSRF si existe
                const token = $('meta[name="csrf-token"]').attr('content');
                if (token) {
                    xhr.setRequestHeader('X-CSRF-TOKEN', token);
                }
            }
        };

        const finalOptions = $.extend({}, defaultOptions, options);

        return $.ajax(finalOptions)
            .done(function(data) {
                console.log('API Success:', url, data);
            })
            .fail(function(xhr, status, error) {
                console.error('API Error:', url, status, error);
                
                let errorMessage = 'Error de conexión';
                
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                } else if (xhr.status === 401) {
                    errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
                    Auth.logout();
                } else if (xhr.status === 403) {
                    errorMessage = 'No tienes permisos para realizar esta acción.';
                } else if (xhr.status === 404) {
                    errorMessage = 'Recurso no encontrado.';
                } else if (xhr.status === 500) {
                    errorMessage = 'Error interno del servidor.';
                }

                Utils.showNotification(errorMessage, 'error');
            });
    },

    /**
     * GET request
     */
    get: function(url, data = {}) {
        return this.request(url, {
            type: 'GET',
            data: data
        });
    },

    /**
     * POST request
     */
    post: function(url, data = {}) {
        return this.request(url, {
            type: 'POST',
            data: JSON.stringify(data)
        });
    },

    /**
     * PUT request
     */
    put: function(url, data = {}) {
        return this.request(url, {
            type: 'PUT',
            data: JSON.stringify(data)
        });
    },

    /**
     * DELETE request
     */
    delete: function(url) {
        return this.request(url, {
            type: 'DELETE'
        });
    }
};

// Sistema de autenticación
const Auth = {
    /**
     * Verificar estado de autenticación
     */
    checkAuth: function() {
        return API.get('/auth/check')
            .done(function(response) {
                if (response.user) {
                    AppState.user = response.user;
                    Auth.updateUI();
                }
            });
    },

    /**
     * Iniciar sesión
     */

    login: function(email, password) {
        Utils.showLoading('Iniciando sesión...');
        
        // Verificar si hay productos en el carrito local antes del login
        const hasCartItems = Cart.hasLocalCartItems();
        
        return API.post('/auth/login', { email, password })
            .done(function(response) {
                AppState.user = response.user;
                localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(response.user));
                
                // Mostrar notificación apropiada y migrar carrito si es necesario
                if (hasCartItems) {
                    // Cargar carrito local en AppState para poder migrarlo
                    const localCart = localStorage.getItem(APP_CONFIG.cartKey);
                    if (localCart) {
                        AppState.cart = JSON.parse(localCart);
                    }
                    
                    // Migrar carrito y mostrar notificación personalizada
                    Cart.migrateLocalCart();
                } else {
                    Utils.showNotification('Sesión iniciada correctamente', 'success');
                }
                
                Auth.updateUI();
                
                // Redirigir si hay parámetro redirect
                const urlParams = Utils.getUrlParams();
                if (urlParams.redirect) {
                    window.location.href = decodeURIComponent(urlParams.redirect);
                } else {
                    window.location.href = '/';
                }
            })
            .always(function() {
                Utils.hideLoading();
            });
    },

    /**
     * Registrar usuario
     */
    register: function(userData) {
        Utils.showLoading('Registrando usuario...');
        return API.post('/auth/register', userData)
            .done(function(response) {
                AppState.user = response.user;
                localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(response.user));
                Utils.showNotification('Usuario registrado correctamente', 'success');
                Auth.updateUI();
                window.location.href = '/';
            })
            .always(function() {
                Utils.hideLoading();
            });
    },

    /**
     * Cerrar sesión
     */
    logout: function() {
        API.post('/auth/logout')
            .always(function() {
                AppState.user = null;
                localStorage.removeItem(APP_CONFIG.userKey);
                localStorage.removeItem(APP_CONFIG.cartKey);
                Auth.updateUI();
                Utils.showNotification('Sesión cerrada', 'info');
                window.location.href = '/';
            });
    },

    /**
     * Actualizar UI de autenticación
     */
    updateUI: function() {
        if (AppState.user) {
            $('#user-menu').show();
            $('#auth-menu').hide();
            // Extraer solo el primer nombre del nombre completo
            const firstName = AppState.user.name.split(' ')[0];
            $('#user-name').text(firstName);

            /* Función creado por Jonathan para la captura del menu de administrador, auth-menu son datos que ya vinieron del proyecto pero no son usados*/
            if (this.isAdmin()){
                $('#admin-panel-menu').show();
            } else{
                $('#admin-panel-menu').hide();
            }

        } else {
            $('#user-menu').hide();
            $('#auth-menu').show();
        }
        
        // Disparar evento para actualizar el menú móvil
        document.dispatchEvent(new Event('authStateChanged'));
    },

    /**
     * Verificar si es administrador
     */
    isAdmin: function() {
        return AppState.user && AppState.user.es_admin;
    },

    /**
     * Verificar si está autenticado
     */
    isAuthenticated: function() {
        return AppState.user !== null;
    }

};

// Sistema de carrito
const Cart = {
    /** * Migrar carrito local al servidor tras login */
    /**
     * Verificar si hay productos en el carrito local
     */
    hasLocalCartItems: function() {
        const localCart = localStorage.getItem(APP_CONFIG.cartKey);
        if (localCart) {
            try {
                const cart = JSON.parse(localCart);
                return cart.items && cart.items.length > 0;
            } catch (e) {
                return false;
            }
        }
        return false;
    },

    migrateLocalCart: function() {
        if (!Auth.isAuthenticated() || AppState.cart.items.length === 0) {
            return Promise.resolve();
        }
        
        const promises = AppState.cart.items.map(item => {
            const requestData = {
                producto_id: item.producto_id,
                cantidad: item.cantidad
            };
            
            // Incluir talla si existe
            if (item.talla) {
                requestData.talla = item.talla;
            }
            
            return API.post('/carrito', requestData);
        });
        
        return Promise.all(promises)
            .then(() => {
                // Limpiar carrito local
                localStorage.removeItem(APP_CONFIG.cartKey);
                Utils.showNotification('Productos del carrito transferidos a tu cuenta', 'success');
                // Recargar carrito del servidor
                return Cart.load();
            })
            .catch(function(error) {
                console.error('Error migrando carrito:', error);
                Utils.showNotification('Error al transferir productos del carrito', 'error');
            });
    },

    /**
     * Cargar carrito
     */
    load: function() {
        if (Auth.isAuthenticated()) {
            return API.get('/carrito')
                .done(function(response) {
                    AppState.cart = {
                        items: response.items || [],
                        total: response.total || 0,
                        count: response.cantidad_items || 0
                    };
                    Cart.updateUI();
                })
                .fail(function() {
                    // Si falla la carga del servidor, inicializar carrito vacío
                    Cart.initializeEmptyCart();
                });
        } else {
            // Cargar carrito local
            const localCart = localStorage.getItem(APP_CONFIG.cartKey);
            if (localCart) {
                try {
                    AppState.cart = JSON.parse(localCart);
                    Cart.updateUI();
                } catch (e) {
                    // Si hay error en el JSON, inicializar carrito vacío
                    Cart.initializeEmptyCart();
                }
            } else {
                // Si no hay carrito local, inicializar vacío
                Cart.initializeEmptyCart();
            }
        }
    },

    /**
     * Inicializar carrito vacío
     */
    initializeEmptyCart: function() {
        AppState.cart = {
            items: [],
            total: 0,
            count: 0
        };
        Cart.updateUI();
    },

    /**
     * Agregar producto al carrito (método legacy sin tallas)
     */
    add: function(productId, quantity = 1) {
        if (Auth.isAuthenticated()) {
            return API.post('/carrito', {
                producto_id: productId,
                cantidad: quantity
            }).done(function(response) {
                Cart.load(); // Recargar carrito
                Utils.showNotification('Producto agregado al carrito', 'success');
            });
        } else {
            // Manejar carrito local
            Cart.addToLocalCart(productId, quantity);
        }
    },

    /**
     * Agregar producto al carrito con talla específica
     */
    addWithSize: function(productId, talla, quantity = 1, stockDisponible = null) {
        return new Promise((resolve, reject) => {
            if (Auth.isAuthenticated()) {
                API.post('/carrito', {
                    producto_id: productId,
                    talla: talla,
                    cantidad: quantity
                })
                .done(function(response) {
                    Cart.load(); // Recargar carrito
                    resolve(response);
                })
                .fail(function(xhr) {
                    const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al agregar producto';
                    reject(error);
                });
            } else {
                Cart.addToLocalCartWithSize(productId, talla, quantity, stockDisponible);
                resolve();
            }
        });
    },

    /**
     * Agregar a carrito local (método legacy sin tallas)
     */
    addToLocalCart: function(productId, quantity) {
        // Obtener información del producto
        API.get(`/productos/${productId}`)
            .done(function(product) {
                const existingItem = AppState.cart.items.find(item => item.producto_id == productId);
                
                if (existingItem) {
                    existingItem.cantidad += quantity;
                    existingItem.subtotal = existingItem.cantidad * product.precio;
                } else {
                    AppState.cart.items.push({
                        id: Date.now(),
                        producto_id: productId,
                        cantidad: quantity,
                        producto: product,
                        subtotal: product.precio * quantity
                    });
                }
                
                Cart.calculateTotal();
                Cart.saveLocal();
                Cart.updateUI();
                Utils.showNotification('Producto agregado al carrito', 'success');
            });
    },

    /**
     * Agregar a carrito local con talla específica
     */
    addToLocalCartWithSize: function(productId, talla, quantity, stockDisponible) {
        // Verificar si el producto con la misma talla ya está en el carrito
        const existingItem = AppState.cart.items.find(item => 
            item.producto_id == productId && item.talla === talla
        );
        
        if (existingItem) {
            // Verificar stock antes de agregar
            const newQuantity = existingItem.cantidad + quantity;
            if (stockDisponible && newQuantity > stockDisponible) {
                Utils.showNotification(`Stock insuficiente. Disponible: ${stockDisponible}`, 'warning');
                return;
            }
            
            existingItem.cantidad = newQuantity;
            existingItem.subtotal = existingItem.cantidad * Utils.getEffectivePrice(existingItem.producto);
            
            Cart.calculateTotal();
            Cart.saveLocal();
            Cart.updateUI();
            Utils.showNotification('Cantidad actualizada en el carrito', 'success');
        } else {
            // Obtener información del producto
            API.get(`/productos/${productId}`)
                .done(function(product) {
                    AppState.cart.items.push({
                        id: Date.now(),
                        producto_id: productId,
                        talla: talla,
                        cantidad: quantity,
                        stock_disponible: stockDisponible,
                        producto: product,
                        subtotal: Utils.getEffectivePrice(product) * quantity
                    });
                    
                    Cart.calculateTotal();
                    Cart.saveLocal();
                    Cart.updateUI();
                    Utils.showNotification('Producto agregado al carrito', 'success');
                })
                .fail(function() {
                    Utils.showNotification('Error al obtener información del producto', 'error');
                });
        }
    },

    /**
     * Actualizar cantidad
     */
    updateQuantity: function(itemId, newQuantity) {
        if (newQuantity <= 0) {
            Cart.remove(itemId);
            return;
        }
        
        if (Auth.isAuthenticated()) {
            return API.put(`/carrito/${itemId}`, { cantidad: newQuantity })
                .done(function() {
                    Cart.load();
                })
                .fail(function(xhr) {
                    // Mostrar error específico del servidor
                    const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al actualizar cantidad';
                    Utils.showNotification(error, 'error');
                    // Recargar carrito para sincronizar
                    Cart.load();
                });
        } else {
            const item = AppState.cart.items.find(item => item.id == itemId);
            if (item) {
                // Verificar stock si tiene talla específica
                if (item.talla && item.stock_disponible && newQuantity > item.stock_disponible) {
                    Utils.showNotification(`Stock insuficiente para talla ${item.talla}. Disponible: ${item.stock_disponible}`, 'warning');
                    return;
                }
                
                item.cantidad = newQuantity;
                item.subtotal = item.cantidad * Utils.getEffectivePrice(item.producto);
                Cart.calculateTotal();
                Cart.saveLocal();
                Cart.updateUI();
            }
        }
    },

    /**
     * Eliminar item del carrito
     */
    remove: function(itemId) {
        if (Auth.isAuthenticated()) {
            return API.delete(`/carrito/${itemId}`)
                .done(function() {
                    Cart.load();
                    Utils.showNotification('Producto eliminado del carrito', 'info');
                });
        } else {
            AppState.cart.items = AppState.cart.items.filter(item => item.id != itemId);
            Cart.calculateTotal();
            Cart.saveLocal();
            Cart.updateUI();
            Utils.showNotification('Producto eliminado del carrito', 'info');
        }
    },

    /**
     * Vaciar carrito
     */
    clear: function() {
        if (Auth.isAuthenticated()) {
            return API.delete('/carrito')
                .done(function() {
                    Cart.load();
                    Utils.showNotification('Carrito vaciado', 'info');
                });
        } else {
            AppState.cart.items = [];
            AppState.cart.total = 0;
            AppState.cart.count = 0;
            Cart.saveLocal();
            Cart.updateUI();
            Utils.showNotification('Carrito vaciado', 'info');
        }
    },

    /**
     * Calcular total
     */
    calculateTotal: function() {
        AppState.cart.total = AppState.cart.items.reduce((total, item) => total + item.subtotal, 0);
        AppState.cart.count = AppState.cart.items.reduce((count, item) => count + item.cantidad, 0);
    },

    /**
     * Guardar carrito local
     */
    saveLocal: function() {
        localStorage.setItem(APP_CONFIG.cartKey, JSON.stringify(AppState.cart));
    },

    /**
     * Actualizar UI del carrito
     */
    updateUI: function() {
        $('#cart-badge').text(AppState.cart.count);
        
        if (AppState.cart.count > 0) {
            $('#cart-badge').show();
        } else {
            $('#cart-badge').hide();
        }
    },

    /**
     * Renderizar página del carrito con soporte para tallas
     */
    renderCartPage: function() {
        const container = document.getElementById('cart-items');
        if (!container) return;

        if (AppState.cart.items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart fa-4x"></i>
                    <h3>Tu carrito está vacío</h3>
                    <p>Agrega productos para comenzar tu compra</p>
                    <a href="/productos" class="btn btn-primary">
                        <i class="fas fa-shopping-bag me-2"></i>Ver Productos
                    </a>
                </div>
            `;
            return;
        }

        let itemsHtml = '';
        AppState.cart.items.forEach(item => {
            const precioUnitario = Utils.getEffectivePrice(item.producto);
            const precioTotal = precioUnitario * item.cantidad;

            // Información de talla si existe
            const tallaInfo = item.talla ? `
                <div class="cart-item-size">
                    <i class="fas fa-ruler me-1"></i>
                    <strong>Talla:</strong> ${item.talla}
                    ${item.stock_disponible ? `<span class="text-muted ms-2">(Stock: ${item.stock_disponible})</span>` : ''}
                </div>
            ` : '';

            itemsHtml += `
                <div class="cart-item" data-item-id="${item.id}">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <img src="/${item.producto.imagen_principal || 'assets/images/producto-default.jpg'}" 
                                 alt="${Utils.sanitizeHtml(item.producto.nombre)}" 
                                 class="cart-item-image">
                        </div>
                        <div class="col-md-4">
                            <div class="cart-item-info">
                                <h6 class="cart-item-title">${Utils.sanitizeHtml(item.producto.nombre)}</h6>
                                ${tallaInfo}
                                <div class="cart-item-price">
                                    ${Utils.formatPriceWithPromo(item.producto)}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="quantity-controls">
                                <button class="btn btn-outline-secondary btn-sm decrease-qty" 
                                        data-item-id="${item.id}">-</button>
                                <input type="number" class="form-control quantity-input mx-2" 
                                       value="${item.cantidad}" 
                                       min="1" 
                                       ${item.stock_disponible ? `max="${item.stock_disponible}"` : ''}
                                       data-item-id="${item.id}">
                                <button class="btn btn-outline-secondary btn-sm increase-qty" 
                                        data-item-id="${item.id}">+</button>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="cart-item-price">
                                ${Utils.formatPrice(precioTotal)}
                            </div>
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-outline-danger btn-sm remove-item" 
                                    data-item-id="${item.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = itemsHtml;

        // Agregar event listeners
        Cart.setupCartEventListeners();
    },

    /**
     * Renderizar resumen del carrito con soporte para tallas
     */
    renderCartSummary: function() {
        const container = document.getElementById('cart-summary');
        if (!container) return;

        if (AppState.cart.items.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <p>No hay productos en el carrito</p>
                </div>
            `;
            return;
        }

        let itemsHtml = '';
        let subtotal = 0;

        AppState.cart.items.forEach(item => {
            const precioUnitario = Utils.getEffectivePrice(item.producto);
            const precioTotal = precioUnitario * item.cantidad;
            subtotal += precioTotal;

            // Información de talla si existe
            const tallaInfo = item.talla ? ` - Talla ${item.talla}` : '';

            itemsHtml += `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="flex-grow-1">
                        <div class="fw-medium">${Utils.sanitizeHtml(item.producto.nombre)}${tallaInfo}</div>
                        <small class="text-muted">${item.cantidad} x ${Utils.formatPrice(precioUnitario)}</small>
                    </div>
                    <div class="fw-bold">
                        ${Utils.formatPrice(precioTotal)}
                    </div>
                </div>
            `;
        });

        const envio = 0; // Por ahora sin costo de envío
        const total = subtotal + envio;

        container.innerHTML = `
            <div class="cart-summary-items">
                ${itemsHtml}
            </div>
            <hr>
            <div class="d-flex justify-content-between">
                <span>Subtotal:</span>
                <span>${Utils.formatPrice(subtotal)}</span>
            </div>
            <div class="d-flex justify-content-between">
                <span>Envío:</span>
                <span>${envio === 0 ? 'Gratis' : Utils.formatPrice(envio)}</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between">
                <strong>Total:</strong>
                <strong class="cart-total">${Utils.formatPrice(total)}</strong>
            </div>
        `;
    },

    /**
     * Configurar event listeners para la página del carrito
     */
    setupCartEventListeners: function() {
        // Botones de aumentar cantidad
        $('.increase-qty').off('click').on('click', function() {
            const itemId = $(this).data('item-id');
            const input = $(`.quantity-input[data-item-id="${itemId}"]`);
            const currentValue = parseInt(input.val());
            const maxValue = parseInt(input.attr('max')) || 999;
            
            if (currentValue < maxValue) {
                Cart.updateQuantity(itemId, currentValue + 1);
            }
        });

        // Botones de disminuir cantidad
        $('.decrease-qty').off('click').on('click', function() {
            const itemId = $(this).data('item-id');
            const input = $(`.quantity-input[data-item-id="${itemId}"]`);
            const currentValue = parseInt(input.val());
            
            if (currentValue > 1) {
                Cart.updateQuantity(itemId, currentValue - 1);
            }
        });

        // Input directo de cantidad
        $('.quantity-input').off('change').on('change', function() {
            const itemId = $(this).data('item-id');
            let newValue = parseInt($(this).val());
            const maxValue = parseInt($(this).attr('max')) || 999;
            
            if (isNaN(newValue) || newValue < 1) {
                newValue = 1;
                $(this).val(1);
            } else if (newValue > maxValue) {
                newValue = maxValue;
                $(this).val(maxValue);
            }
            
            Cart.updateQuantity(itemId, newValue);
        });

        // Botones de eliminar
        $('.remove-item').off('click').on('click', function() {
            const itemId = $(this).data('item-id');
            if (confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
                Cart.remove(itemId);
            }
        });

        // Botón de vaciar carrito
        $('#clear-cart-btn').off('click').on('click', function() {
            if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
                Cart.clear();
            }
        });

        // Botón de proceder al pago (WhatsApp)
        $('#proceed-checkout').off('click').on('click', function() {
            Cart.proceedToWhatsApp();
        });
    },

    /**
     * Proceder al pago vía WhatsApp
     */
    proceedToWhatsApp: function() {
        if (AppState.cart.items.length === 0) {
            Utils.showNotification('No hay productos en el carrito', 'warning');
            return;
        }

        const message = Cart.generateWhatsAppMessage();
        const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        // Mostrar confirmación antes de abrir WhatsApp
        if (confirm('Se abrirá WhatsApp para completar tu pedido. ¿Continuar?')) {
            window.open(whatsappUrl, '_blank');
            
            // Opcional: Vaciar carrito después de enviar pedido
            // Cart.clear();
            
            Utils.showNotification('Pedido enviado por WhatsApp. ¡Te contactaremos pronto!', 'success');
        }
    },

    /**
     * Generar mensaje para WhatsApp con los datos del pedido
     */
    generateWhatsAppMessage: function() {
        let message = '� �🛒 *NUEVO PEDIDO - CALZADO LEOPARDO* 🐆\n';
        message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        
        // Información del usuario si está autenticado
        if (Auth.isAuthenticated() && AppState.user) {
            message += '� *DATOS DEL CLIENTE:*\n';
            message += `• 📛 Nombre: ${AppState.user.name}\n`;
            message += `• 📧 Email: ${AppState.user.email}\n`;
            if (AppState.user.telefono) {
                message += `• 📱 Teléfono: ${AppState.user.telefono}\n`;
            }
            if (AppState.user.direccion) {
                message += `• 🏠 Dirección: ${AppState.user.direccion}\n`;
            }
            message += `• 🌟 Cliente registrado: ✅\n\n`;
        } else {
            message += '� *CLIENTE:* 🆕 No registrado (Cliente nuevo)\n\n';
        }

        // Detalles del pedido
        message += '🐆 📦 *PRODUCTOS SELECCIONADOS:*\n';
        message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        let subtotal = 0;

        AppState.cart.items.forEach((item, index) => {
            const precioUnitario = Utils.getEffectivePrice(item.producto);
            const precioTotal = precioUnitario * item.cantidad;
            subtotal += precioTotal;

            message += `\n🐾 ${index + 1}. *${item.producto.nombre}*\n`;
            if (item.talla) {
                message += `   📏 Talla: *${item.talla}*\n`;
            }
            message += `   🔢 Cantidad: *${item.cantidad}*\n`;
            message += `   💵 Precio unitario: *${Utils.formatPrice(precioUnitario)}*\n`;
            message += `   💳 Subtotal: *${Utils.formatPrice(precioTotal)}*\n`;
            
            if (item.producto.codigo) {
                message += `   🏷️ Código: ${item.producto.codigo}\n`;
            }
        });

        // Resumen de precios
        const envio = 0; // Por ahora sin costo de envío
        const total = subtotal + envio;

        message += '\n🐆 💰 *RESUMEN DE COMPRA:*\n';
        message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        message += `• 💸 Subtotal: *${Utils.formatPrice(subtotal)}*\n`;
        message += `• 🚚 Envío: ${envio === 0 ? '*Gratis* 🎉' : Utils.formatPrice(envio)}\n`;
        message += `• 🐅 *TOTAL: ${Utils.formatPrice(total)}* 🐅\n\n`;

        // Información adicional
        message += '🐆 📋 *INFORMACIÓN ADICIONAL:*\n';
        message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        message += `• 📅 Fecha del pedido: ${new Date().toLocaleDateString('es-PE')}\n`;
        message += `• ⏰ Hora: ${new Date().toLocaleTimeString('es-PE')}\n`;
        message += `• 📊 Número de productos: ${AppState.cart.count}\n\n`;

        // Instrucciones
        message += '� �💬 *Por favor proporciona:*\n';
        message += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        if (!Auth.isAuthenticated()) {
            message += '• 👤 Tu nombre completo\n';
            message += '• 📱 Tu número de teléfono\n';
            message += '• 🏠 Tu dirección de entrega\n';
        }
        message += '• 💳 Método de pago preferido\n';
        message += '• 💭 Cualquier comentario adicional sobre tu pedido\n\n';

        message += '🐆 ¡Gracias por elegir *CALZADO LEOPARDO*! 🐆\n';
        message += '🐾 Tu calidad, nuestra pasión 🐾\n';
        message += '👟 ¡Esperamos tu respuesta! 👟';

        return message;
    }
};

// Sistema de categorías
const Categories = {
    /**
     * Cargar categorías
     */
    load: function() {
        return API.get('/categorias')
            .done(function(response) {
                AppState.categories = response;
                Categories.updateMenu();
            });
    },

    /**
     * Actualizar menú de categorías
     */
    updateMenu: function() {
        const menu = $('#categorias-menu');
        menu.empty();
        
        AppState.categories.forEach(category => {
            menu.append(`
                <li>
                    <a class="dropdown-item" href="/categorias/${category.id}">
                        ${Utils.sanitizeHtml(category.nombre)}
                    </a>
                </li>
            `);
        });
    }
};

// Inicialización de la aplicación
$(document).ready(function() {
    console.log('Leopardo E-commerce iniciado');    
    // Cargar estado inicial
    const savedUser = localStorage.getItem(APP_CONFIG.userKey);
    if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
        try {
            AppState.user = JSON.parse(savedUser);
            Auth.updateUI();
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
            localStorage.removeItem(APP_CONFIG.userKey);
        }
    }
    
    // Verificar autenticación y luego cargar carrito
    Auth.checkAuth()
        .always(function() {
            // Cargar carrito después de verificar autenticación
            Cart.load();
        });
    
    // Cargar categorías
    Categories.load();
    
    // Event listeners globales
    setupGlobalEventListeners();
});

/**
 * Configurar event listeners globales
 */
function setupGlobalEventListeners() {
    // Logout
    $('#logout-btn').on('click', function(e) {
        e.preventDefault();
        Auth.logout();
    });
    
    // Búsqueda global
    $('#global-search').on('keyup', Utils.debounce(function() {
        const query = $(this).val();
        if (query.length > 2) {
            // Implementar búsqueda global
            console.log('Búsqueda:', query);
        }
    }, 300));
    
    // Auto-save en formularios
    $('form[data-auto-save]').on('input', Utils.debounce(function() {
        const form = $(this);
        const formData = form.serialize();
        localStorage.setItem('form_' + form.attr('id'), formData);
    }, 1000));
    
    // Restaurar formularios guardados
    $('form[data-auto-save]').each(function() {
        const form = $(this);
        const savedData = localStorage.getItem('form_' + form.attr('id'));
        if (savedData) {
            form.deserialize(savedData);
        }
    });
}

// Función global para proceder al pago via WhatsApp (accesible desde HTML)
window.proceedToWhatsApp = function() {
    Cart.proceedToWhatsApp();
};

// Exportar para uso global
window.AppState = AppState;
window.Utils = Utils;
window.API = API;
window.Auth = Auth;
window.Cart = Cart;
window.Categories = Categories;

