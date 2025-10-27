/**
 * SISTEMA DE CARRITO - jQuery
 * Adaptado del CartContext de React
 */

// Configuración por defecto si no existe APP_CONFIG
if (typeof APP_CONFIG === 'undefined') {
    window.APP_CONFIG = {
        whatsappNumber: '51940870622', // Número por defecto
        cartKey: 'leopardo_cart'
    };
}

const CartManager = {
    /**
     * Cargar carrito
     */
    load: function() {
        if (AuthManager.isAuthenticated()) {
            return API.get('/carrito')
                .done(function(response) {
                    AppState.cart = {
                        items: response.items || [],
                        total: response.total || 0,
                        count: response.cantidad_items || 0
                    };
                    CartManager.updateUI();
                })
                .fail(function() {
                    // Si falla, cargar carrito local
                    CartManager.loadLocalCart();
                });
        } else {
            CartManager.loadLocalCart();
        }
    },

    /**
     * Cargar carrito local
     */
    loadLocalCart: function() {
        const localCart = localStorage.getItem(APP_CONFIG.cartKey);
        if (localCart) {
            try {
                AppState.cart = JSON.parse(localCart);
                CartManager.updateUI();
            } catch (e) {
                localStorage.removeItem(APP_CONFIG.cartKey);
                CartManager.initializeEmptyCart();
            }
        } else {
            CartManager.initializeEmptyCart();
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
        CartManager.updateUI();
    },

    /**
     * Agregar producto al carrito (método legacy sin tallas)
     */
    add: function(productId, quantity = 1) {
        if (AuthManager.isAuthenticated()) {
            return API.post('/carrito', {
                producto_id: productId,
                cantidad: quantity
            })
            .done(function(response) {
                CartManager.load(); // Recargar carrito
                Utils.showNotification('Producto agregado al carrito', 'success');
            })
            .fail(function(xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al agregar producto';
                Utils.showNotification(error, 'error');
            });
        } else {
            CartManager.addToLocalCart(productId, quantity);
        }
    },

    /**
     * Agregar producto al carrito con talla específica
     */
    addWithSize: function(productId, talla, quantity = 1, stockDisponible = null) {
        return new Promise((resolve, reject) => {
            if (AuthManager.isAuthenticated()) {
                API.post('/carrito', {
                    producto_id: productId,
                    talla: talla,
                    cantidad: quantity
                })
                .done(function(response) {
                    CartManager.load(); // Recargar carrito
                    resolve(response);
                })
                .fail(function(xhr) {
                    const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al agregar producto';
                    reject(error);
                });
            } else {
                CartManager.addToLocalCartWithSize(productId, talla, quantity, stockDisponible);
                resolve();
            }
        });
    },

    /**
     * Agregar a carrito local (método legacy sin tallas)
     */
    addToLocalCart: function(productId, quantity) {
        // Verificar si el producto ya está en el carrito
        const existingItem = AppState.cart.items.find(item => item.producto_id == productId);
        
        if (existingItem) {
            existingItem.cantidad += quantity;
            existingItem.subtotal = existingItem.cantidad * existingItem.producto.precio;
        } else {
            // Obtener información del producto
            API.get(`/productos/${productId}`)
                .done(function(product) {
                    AppState.cart.items.push({
                        id: Date.now(),
                        producto_id: productId,
                        cantidad: quantity,
                        producto: product,
                        subtotal: product.precio * quantity
                    });
                    
                    CartManager.calculateTotal();
                    CartManager.saveLocal();
                    CartManager.updateUI();
                    Utils.showNotification('Producto agregado al carrito', 'success');
                })
                .fail(function() {
                    Utils.showNotification('Error al obtener información del producto', 'error');
                });
        }
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
            
            CartManager.calculateTotal();
            CartManager.saveLocal();
            CartManager.updateUI();
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
                    
                    CartManager.calculateTotal();
                    CartManager.saveLocal();
                    CartManager.updateUI();
                    Utils.showNotification('Producto agregado al carrito', 'success');
                })
                .fail(function() {
                    Utils.showNotification('Error al obtener información del producto', 'error');
                });
        }
    },

    /**
     * Actualizar cantidad de un item
     */
    updateQuantity: function(itemId, newQuantity) {
        if (newQuantity <= 0) {
            CartManager.remove(itemId);
            return;
        }
        
        if (AuthManager.isAuthenticated()) {
            return API.put(`/carrito/${itemId}`, { cantidad: newQuantity })
                .done(function() {
                    CartManager.load();
                })
                .fail(function(xhr) {
                    const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al actualizar cantidad';
                    Utils.showNotification(error, 'error');
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
                CartManager.calculateTotal();
                CartManager.saveLocal();
                CartManager.updateUI();
            }
        }
    },

    /**
     * Eliminar item del carrito
     */
    remove: function(itemId) {
        if (AuthManager.isAuthenticated()) {
            return API.delete(`/carrito/${itemId}`)
                .done(function() {
                    CartManager.load();
                    Utils.showNotification('Producto eliminado del carrito', 'info');
                })
                .fail(function(xhr) {
                    const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al eliminar producto';
                    Utils.showNotification(error, 'error');
                });
        } else {
            AppState.cart.items = AppState.cart.items.filter(item => item.id != itemId);
            CartManager.calculateTotal();
            CartManager.saveLocal();
            CartManager.updateUI();
            Utils.showNotification('Producto eliminado del carrito', 'info');
        }
    },

    /**
     * Vaciar carrito
     */
    clear: function() {
        if (AuthManager.isAuthenticated()) {
            return API.delete('/carrito')
                .done(function() {
                    CartManager.load();
                    Utils.showNotification('Carrito vaciado', 'info');
                })
                .fail(function(xhr) {
                    const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al vaciar carrito';
                    Utils.showNotification(error, 'error');
                });
        } else {
            AppState.cart.items = [];
            AppState.cart.total = 0;
            AppState.cart.count = 0;
            CartManager.saveLocal();
            CartManager.updateUI();
            Utils.showNotification('Carrito vaciado', 'info');
        }
    },

    /**
     * Calcular total del carrito
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
        console.log('🛒 Actualizando UI del carrito, count:', AppState.cart.count);
        
        // Actualizar badge del carrito principal
        $('#cart-badge').text(AppState.cart.count);
        
        if (AppState.cart.count > 0) {
            $('#cart-badge').show();
        } else {
            $('#cart-badge').hide();
        }
        
        // Actualizar badge del carrito móvil
        $('#mobile-cart-badge').text(AppState.cart.count);
        
        if (AppState.cart.count > 0) {
            $('#mobile-cart-badge').show();
        } else {
            $('#mobile-cart-badge').hide();
        }
        
        console.log('📱 Badge móvil actualizado a:', AppState.cart.count);
        
        // Actualizar página del carrito si existe
        if ($('#cart-page').length) {
            CartManager.renderCartPage();
        }
        
        // Actualizar resumen del carrito si existe
        if ($('#cart-summary').length) {
            CartManager.renderCartSummary();
        }
        
        // Disparar evento personalizado para sincronización
        $(document).trigger('cartUpdated');
        console.log('📡 Evento cartUpdated disparado');
    },

    /**
     * Renderizar página del carrito
     */
    renderCartPage: function() {
        const container = $('#cart-items');
        container.empty();
        
        if (AppState.cart.items.length === 0) {
            container.html(`
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Tu carrito está vacío</h3>
                    <p>Agrega algunos productos para comenzar tu compra</p>
                    <a href="/" class="btn btn-primary">Continuar comprando</a>
                </div>
            `);
            $('#cart-total').text(Utils.formatPrice(AppState.cart.total));
            return;
        }
        
        AppState.cart.items.forEach(item => {
            const cartItem = $(`
                <div class="cart-item" data-item-id="${item.id}">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <img src="${item.producto.imagen_principal || '/assets/images/producto-default.jpg'}" 
                                 alt="${item.producto.nombre}" 
                                 class="cart-item-image">
                        </div>
                        <div class="col-md-4">
                            <div class="cart-item-info">
                                <h6 class="cart-item-title">${Utils.sanitizeHtml(item.producto.nombre)}</h6>
                                <p class="cart-item-price">${Utils.formatPrice(item.producto.precio)}</p>
                                ${item.talla ? `<p class="cart-item-size"><small><i class="fas fa-tag"></i> Talla: ${item.talla}</small></p>` : ''}
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="cart-item-actions">
                                <div class="quantity-controls">
                                    <button class="btn btn-outline-secondary btn-sm quantity-btn" 
                                            data-action="decrease" data-item-id="${item.id}">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <input type="number" 
                                           class="form-control quantity-input" 
                                           value="${item.cantidad}" 
                                           min="1" 
                                           data-item-id="${item.id}">
                                    <button class="btn btn-outline-secondary btn-sm quantity-btn" 
                                            data-action="increase" data-item-id="${item.id}">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="cart-item-total">
                                <strong>${Utils.formatPrice(item.subtotal)}</strong>
                            </div>
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-outline-danger btn-sm remove-from-cart" 
                                    data-item-id="${item.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `);
            
            container.append(cartItem);
        });
        
        // Actualizar total
        $('#cart-total').text(Utils.formatPrice(AppState.cart.total));
    },

    /**
     * Renderizar resumen del carrito
     */
    renderCartSummary: function() {
        const summary = $('#cart-summary');
        summary.empty();
        
        if (AppState.cart.items.length === 0) {
            summary.html(`
                <div class="text-center">
                    <i class="fas fa-shopping-cart fa-2x mb-2"></i>
                    <p>Carrito vacío</p>
                </div>
            `);
            return;
        }
        
        let summaryHtml = '<div class="cart-summary-items">';
        
        AppState.cart.items.forEach(item => {
            summaryHtml += `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <small>${Utils.sanitizeHtml(item.producto.nombre)}</small>
                        ${item.talla ? `<br><small class=""><i class="fas fa-tag"></i> Talla: ${item.talla}</small>` : ''}
                        <br>
                        <small class="">${item.cantidad} x ${Utils.formatPrice(item.producto.precio)}</small>
                    </div>
                    <small class="fw-bold">${Utils.formatPrice(item.subtotal)}</small>
                </div>
            `;
        });
        
        summaryHtml += '</div>';
        summaryHtml += `
            <hr>
            <div class="d-flex justify-content-between align-items-center">
                <strong>Total:</strong>
                <strong class="text-primary">${Utils.formatPrice(AppState.cart.total)}</strong>
            </div>
        `;
        
        summary.html(summaryHtml);
    },

    /**
     * Validar carrito antes del checkout
     */
    validateCart: function() {
        if (AppState.cart.items.length === 0) {
            Utils.showNotification('Tu carrito está vacío', 'warning');
            return false;
        }
        
        // Verificar stock de productos
        let hasErrors = false;
        AppState.cart.items.forEach(item => {
            if (item.cantidad > item.producto.stock) {
                Utils.showNotification(`No hay suficiente stock para ${item.producto.nombre}`, 'error');
                hasErrors = true;
            }
        });
        
        return !hasErrors;
    },

    /**
     * Migrar carrito local al servidor
     */
    migrateLocalCart: function() {
        if (!AuthManager.isAuthenticated() || AppState.cart.items.length === 0) {
            return Promise.resolve();
        }
        
        const promises = AppState.cart.items.map(item => {
            return API.post('/carrito', {
                producto_id: item.producto_id,
                cantidad: item.cantidad
            });
        });
        
        return Promise.all(promises)
            .then(() => {
                // Limpiar carrito local
                localStorage.removeItem(APP_CONFIG.cartKey);
                // Recargar carrito del servidor
                return CartManager.load();
            })
            .catch(function(error) {
                console.error('Error migrando carrito:', error);
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

        const message = CartManager.generateWhatsAppMessage();
        const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        // Mostrar confirmación antes de abrir WhatsApp
        if (confirm('Se abrirá WhatsApp para completar tu pedido. ¿Continuar?')) {
            window.open(whatsappUrl, '_blank');
            
            Utils.showNotification('Pedido enviado por WhatsApp. ¡Te contactaremos pronto!', 'success');
        }
    },

    /**
     * Generar mensaje para WhatsApp con los datos del pedido
     */
    generateWhatsAppMessage: function() {
        let message = '*NUEVO PEDIDO - CALZADO LEOPARDO*\n\n';
        
        // Información del usuario si está autenticado
        if (AuthManager.isAuthenticated() && AppState.user) {
            message += '*DATOS DEL CLIENTE:*\n';
            message += `• Nombre: ${AppState.user.name}\n`;
            message += `• Email: ${AppState.user.email}\n`;
            if (AppState.user.telefono) {
                message += `• Teléfono: ${AppState.user.telefono}\n`;
            }
            if (AppState.user.direccion) {
                message += `• Dirección: ${AppState.user.direccion}\n`;
            }
            message += `• Cliente registrado: ✅\n\n`;
        } else {
            message += '*CLIENTE:* No registrado (Cliente nuevo)\n\n';
        }

        // Detalles del pedido
        message += '*PRODUCTOS SOLICITADOS:*\n';
        let subtotal = 0;

        AppState.cart.items.forEach((item, index) => {
            const precioUnitario = Utils.getEffectivePrice(item.producto);
            const precioTotal = precioUnitario * item.cantidad;
            subtotal += precioTotal;

            message += `\n${index + 1}. *${item.producto.nombre}*\n`;
            if (item.talla) {
                message += `   • Talla: ${item.talla}\n`;
            }
            message += `   • Cantidad: ${item.cantidad}\n`;
            message += `   • Precio unitario: ${Utils.formatPrice(precioUnitario)}\n`;
            message += `   • Subtotal: ${Utils.formatPrice(precioTotal)}\n`;
            
            if (item.producto.codigo) {
                message += `   • Código: ${item.producto.codigo}\n`;
            }
        });

        // Resumen de precios
        const envio = 0; // Por ahora sin costo de envío
        const total = subtotal + envio;

        message += '\n*RESUMEN DE COMPRA:*\n';
        message += `• Subtotal: ${Utils.formatPrice(subtotal)}\n`;
        message += `• *TOTAL: ${Utils.formatPrice(total)}*\n\n`;

        // Información adicional
        message += '*INFORMACIÓN ADICIONAL:*\n';
        message += `• Fecha del pedido: ${new Date().toLocaleDateString('es-PE')}\n`;
        message += `• Hora: ${new Date().toLocaleTimeString('es-PE')}\n`;
        message += `• Número de productos: ${AppState.cart.count}\n\n`;

        // Instrucciones
        message += '*Por favor proporciona:*\n';
        if (!AuthManager.isAuthenticated()) {
            message += '• Tu nombre completo\n';
            message += '• Tu número de teléfono\n';
            message += '• Tu dirección de entrega\n';
        }
        message += '• Método de pago preferido\n';
        message += '• Cualquier comentario adicional sobre tu pedido\n\n';

        message += '¡Gracias por elegir Calzado Leopardo! 🦎👟';

        return message;
    }
};

// Event listeners del carrito
$(document).ready(function() {
    // Cargar carrito al inicializar
    CartManager.load();
    
    // Sincronizar badge móvil después de cargar
    setTimeout(() => {
        if (window.mobileMenu && window.mobileMenu.forceSyncCartBadge) {
            window.mobileMenu.forceSyncCartBadge();
        }
    }, 1000);
    
    // Event listeners para botones de cantidad
    $(document).on('click', '.quantity-btn', function() {
        const action = $(this).data('action');
        const itemId = $(this).data('item-id');
        const input = $(`input[data-item-id="${itemId}"]`);
        let currentQuantity = parseInt(input.val());
        
        if (action === 'increase') {
            currentQuantity++;
        } else if (action === 'decrease' && currentQuantity > 1) {
            currentQuantity--;
        }
        
        input.val(currentQuantity);
        CartManager.updateQuantity(itemId, currentQuantity);
    });
    
    // Event listener para input de cantidad
    $(document).on('change', '.quantity-input', function() {
        const itemId = $(this).data('item-id');
        const quantity = parseInt($(this).val());
        
        if (quantity > 0) {
            CartManager.updateQuantity(itemId, quantity);
        }
    });
    
    // Event listener para eliminar items
    $(document).on('click', '.remove-from-cart', function() {
        const itemId = $(this).data('item-id');
        CartManager.remove(itemId);
    });
    
    // Event listener para vaciar carrito
    $(document).on('click', '.clear-cart', function() {
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            CartManager.clear();
            CartManager.renderCartPage();
            CartManager.renderCartSummary();
            $('#cart-total').text(Utils.formatPrice(AppState.cart.total));

        }
    });
    
    // Event listener para agregar al carrito
    $(document).on('click', '.add-to-cart', function(e) {
        e.preventDefault();
        const productId = $(this).data('product-id');
        const quantity = parseInt($(this).data('quantity')) || 1;
        
        CartManager.add(productId, quantity);
    });
    
    // Event listener para checkout
    $(document).on('click', '.checkout-btn', function(e) {
        e.preventDefault();
        
        if (!AuthManager.requireAuth()) {
            return;
        }
        
        if (!CartManager.validateCart()) {
            return;
        }
        
        window.location.href = '/checkout';
    });

    // Event listener para proceder al pago por WhatsApp
    $(document).on('click', '#proceed-checkout', function(e) {
        e.preventDefault();
        
        if (AppState.cart.items.length === 0) {
            Utils.showNotification('No hay productos en el carrito', 'warning');
            return;
        }

        CartManager.proceedToWhatsApp();
    });
    
    // Migrar carrito local cuando el usuario se autentica
    $(document).on('auth:login', function() {
        CartManager.migrateLocalCart();
    });
});

// Exportar para uso global
window.CartManager = CartManager;

