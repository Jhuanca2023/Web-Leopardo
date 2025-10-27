/**
 * SISTEMA DE AUTENTICACIÓN - jQuery
 * Adaptado del AuthContext de React
 */

const AuthManager = {
    /**
     * Verificar estado de autenticación al cargar la página
     */
    checkAuthStatus: function() {
        return API.get('/auth/check')
            .done(function(response) {
                if (response.user) {
                    AppState.user = response.user;
                    AuthManager.updateUI();
                    AuthManager.startSessionTimer();
                }
            })
            .fail(function() {
                // Si falla la verificación, limpiar estado local
                AuthManager.clearAuthState();
            });
    },

    /**
     * Iniciar sesión
     */
    login: function(email, password) {
        Utils.showLoading('Iniciando sesión...');
        
        return API.post('/auth/login', { email, password })
            .done(function(response) {
                AppState.user = response.user;
                localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(response.user));
                
                // Verificar si hay productos en el carrito local antes de la autenticación
                const hasLocalCartItems = AuthManager.hasLocalCartItems();
                
                AuthManager.updateUI();
                AuthManager.startSessionTimer();
                
                // Solo disparar evento de migración si hay productos en el carrito local
                if (hasLocalCartItems) {
                    $(document).trigger('auth:login');
                    Utils.showNotification('Sesión iniciada. Productos del carrito transferidos a tu cuenta.', 'success');
                } else {
                    Utils.showNotification('Sesión iniciada correctamente', 'success');
                }
                
                // Redirigir si hay parámetro redirect
                const urlParams = Utils.getUrlParams();
                if (urlParams.redirect) {
                    window.location.href = decodeURIComponent(urlParams.redirect);
                } else {
                    window.location.href = '/';
                }
            })
            .fail(function(xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al iniciar sesión';
                Utils.showNotification(error, 'error');
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
        
        // Validar datos
        if (!AuthManager.validateUserData(userData)) {
            Utils.hideLoading();
            return Promise.reject('Datos inválidos');
        }
        console.log(userData)
        return API.post('/auth/register', userData)
            .done(function(response) {
                AppState.user = response.user;
                localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(response.user));
                Utils.showNotification('Usuario registrado correctamente', 'success');
                AuthManager.updateUI();
                AuthManager.startSessionTimer();
                window.location.href = '/';
            })
            .fail(function(xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al registrar usuario';
                Utils.showNotification(error, 'error');
            })
            .always(function() {
                Utils.hideLoading();
            });
    },

    /**
     * Cerrar sesión
     */
    logout: function() {
        Utils.showLoading('Cerrando sesión...');
        
        return API.post('/auth/logout')
            .always(function() {
                AuthManager.clearAuthState();
                Utils.showNotification('Sesión cerrada', 'info');
                Utils.hideLoading();
                window.location.href = '/';
            });
    },

    /**
     * Obtener perfil del usuario
     */
    getProfile: function() {
        return API.get('/auth/profile')
            .done(function(response) {
                AppState.user = response;
                localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(response));
                AuthManager.updateUI();
            });
    },

    /**
     * Actualizar perfil
     */
    updateProfile: function(profileData) {
        Utils.showLoading('Actualizando perfil...');
        
        return API.put('/auth/profile', profileData)
            .done(function(response) {
                AppState.user = response.user;
                localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(response.user));
                Utils.showNotification('Perfil actualizado correctamente', 'success');
                AuthManager.updateUI();
            })
            .fail(function(xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al actualizar perfil';
                Utils.showNotification(error, 'error');
            })
            .always(function() {
                Utils.hideLoading();
            });
    },

    /**
     * Cambiar contraseña
     */
    changePassword: function(currentPassword, newPassword) {
        Utils.showLoading('Cambiando contraseña...');
        
        return API.post('/auth/change-password', {
            current_password: currentPassword,
            new_password: newPassword
        })
            .done(function(response) {
                Utils.showNotification('Contraseña cambiada correctamente', 'success');
            })
            .fail(function(xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al cambiar contraseña';
                Utils.showNotification(error, 'error');
            })
            .always(function() {
                Utils.hideLoading();
            });
    },

    /**
     * Actualizar UI de autenticación
     */
    updateUI: function() {
        if (AppState.user) {
            // Mostrar menú de usuario
            $('#user-menu').show();
            $('#auth-menu').hide();
            $('#user-name').text(AppState.user.name);
            
            // Actualizar enlaces de administración
           if (this.isAdmin()){
                $('#admin-panel-menu').show();
            } else{
                $('#admin-panel-menu').hide();
            }
            
            // Actualizar formularios con datos del usuario
            $('input[name="name"]').val(AppState.user.name || '');
            $('input[name="email"]').val(AppState.user.email || '');
            $('input[name="telefono"]').val(AppState.user.telefono || '');
            $('textarea[name="direccion"]').val(AppState.user.direccion || '');
        } else {
            // Ocultar menú de usuario
            $('#user-menu').hide();
            $('#auth-menu').show();
            $('.admin-only').hide();
        }
    },

    /**
     * Actualizar datos del usuario actual en el almacenamiento local
     */
    updateCurrentUser: function(userData) {
        AppState.user = { ...AppState.user, ...userData };
        localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(AppState.user));
        this.updateUI();
    },

    /**
     * Obtener usuario actual
     */
    getCurrentUser: function() {
        return AppState.user;
    },

    /**
     * Verificar si hay productos en el carrito local (antes de autenticarse)
     */
    hasLocalCartItems: function() {
        try {
            const localCart = localStorage.getItem(APP_CONFIG.cartKey);
            if (localCart) {
                const cart = JSON.parse(localCart);
                return cart.items && cart.items.length > 0;
            }
        } catch (e) {
            console.error('Error checking local cart:', e);
        }
        return false;
    },

    /**
     * Limpiar estado de autenticación
     */
    clearAuthState: function() {
        AppState.user = null;
        localStorage.removeItem(APP_CONFIG.userKey);
        localStorage.removeItem(APP_CONFIG.cartKey);
        AuthManager.updateUI();
        AuthManager.stopSessionTimer();
    },

    /**
     * Validar datos de usuario
     */
    validateUserData: function(userData) {
        const errors = [];
        
        if (!userData.name || userData.name.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }
        
        if (!userData.email || !Utils.validateEmail(userData.email)) {
            errors.push('Email inválido');
        }
        
        if (!userData.password || userData.password.length < 6) {
            errors.push('La contraseña debe tener al menos 6 caracteres');
        }
        
        if (userData.password !== userData.confirm_password) {
            errors.push('Las contraseñas no coinciden');
        }
        
        if (errors.length > 0) {
            Utils.showNotification(errors.join('<br>'), 'error');
            return false;
        }
        
        return true;
    },

    /**
     * Iniciar timer de sesión
     */
    startSessionTimer: function() {
        AuthManager.stopSessionTimer(); // Limpiar timer anterior
        
        AuthManager.sessionTimer = setTimeout(function() {
            Utils.showNotification('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
            AuthManager.logout();
        }, APP_CONFIG.sessionTimeout);
    },

    /**
     * Detener timer de sesión
     */
    stopSessionTimer: function() {
        if (AuthManager.sessionTimer) {
            clearTimeout(AuthManager.sessionTimer);
            AuthManager.sessionTimer = null;
        }
    },

    /**
     * Verificar si está autenticado
     */
    isAuthenticated: function() {
        return AppState.user !== null;
    },

    /**
     * Verificar si es administrador
     */
    isAdmin: function() {
        return AppState.user && AppState.user.es_admin;
    },

    /**
     * Requerir autenticación
     */
    requireAuth: function() {
        if (!AuthManager.isAuthenticated()) {
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `/login?redirect=${currentUrl}`;
            return false;
        }
        return true;
    },

    /**
     * Requerir permisos de administrador
     */
    requireAdmin: function() {
        if (!AuthManager.requireAuth()) {
            return false;
        }
        
        if (!AuthManager.isAdmin()) {
            Utils.showNotification('No tienes permisos de administrador', 'error');
            window.location.href = '/';
            return false;
        }
        
        return true;
    }
};

// Formularios de autenticación
const AuthForms = {
    /**
     * Inicializar formulario de login
     */
    initLoginForm: function() {
        $('#login-form').on('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                email: $('#login-email').val().trim(),
                password: $('#login-password').val()
            };
            
            if (!formData.email || !formData.password) {
                Utils.showNotification('Por favor, completa todos los campos', 'error');
                return;
            }
            
            AuthManager.login(formData.email, formData.password);
        });
        
        // Limpiar errores al escribir
        $('#login-form input').on('input', function() {
            $(this).removeClass('is-invalid');
        });
    },

    /**
     * Inicializar formulario de registro
     */
    initRegisterForm: function() {
        $('#register-form').on('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: $('#register-name').val().trim(),
                email: $('#register-email').val().trim(),
                password: $('#register-password').val(),
                confirm_password: $('#register-confirm-password').val(),
                telefono: $('#register-phone').val().trim(),
                direccion: $('#register-direccion').val().trim()
            };
            
            AuthManager.register(formData);
        });
        
        // Validación en tiempo real
        $('#register-password, #register-confirm-password').on('input', function() {
            const password = $('#register-password').val();
            const confirmPassword = $('#register-confirm-password').val();
            
            if (confirmPassword && password !== confirmPassword) {
                $('#register-confirm-password').addClass('is-invalid');
            } else {
                $('#register-confirm-password').removeClass('is-invalid');
            }
        });
        
        // Limpiar errores al escribir
        $('#register-form input, #register-form textarea').on('input', function() {
            $(this).removeClass('is-invalid');
        });
    },

    /**
     * Inicializar formulario de perfil
     */
    initProfileForm: function() {
        $('#profile-form').on('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: $('#profile-name').val().trim(),
                telefono: $('#profile-telefono').val().trim(),
                direccion: $('#profile-direccion').val().trim()
            };
            
            AuthManager.updateProfile(formData);
        });
        
        // Cargar datos del usuario
        if (AppState.user) {
            $('#profile-name').val(AppState.user.name || '');
            $('#profile-email').val(AppState.user.email || '');
            $('#profile-telefono').val(AppState.user.telefono || '');
            $('#profile-direccion').val(AppState.user.direccion || '');
        }
    },

    /**
     * Inicializar formulario de cambio de contraseña
     */
    initChangePasswordForm: function() {
        $('#change-password-form').on('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = $('#current-password').val();
            const newPassword = $('#new-password').val();
            const confirmPassword = $('#confirm-new-password').val();
            
            if (newPassword !== confirmPassword) {
                Utils.showNotification('Las contraseñas no coinciden', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                Utils.showNotification('La nueva contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            AuthManager.changePassword(currentPassword, newPassword);
        });
    }
};

// Inicialización cuando el documento esté listo
$(document).ready(function() {
    // Cargar usuario guardado
    const savedUser = localStorage.getItem(APP_CONFIG.userKey);
    if (savedUser) {
        try {
            AppState.user = JSON.parse(savedUser);
            AuthManager.updateUI();
        } catch (e) {
            localStorage.removeItem(APP_CONFIG.userKey);
        }
    }
    
    // Verificar autenticación
    AuthManager.checkAuthStatus();
    
    // Inicializar formularios si existen
    if ($('#login-form').length) {
        AuthForms.initLoginForm();
    }
    
    if ($('#register-form').length) {
        AuthForms.initRegisterForm();
    }
    
    if ($('#profile-form').length) {
        AuthForms.initProfileForm();
    }
    
    if ($('#change-password-form').length) {
        AuthForms.initChangePasswordForm();
    }
    
    // Event listener para logout
    $(document).on('click', '#logout-btn', function(e) {
        e.preventDefault();
        AuthManager.logout();
    });
    
    // Event listener para renovar sesión
    $(document).on('click keypress scroll', function() {
        if (AuthManager.isAuthenticated()) {
            AuthManager.startSessionTimer();
        }
    });
});

// Exportar para uso global
window.AuthManager = AuthManager;
window.AuthForms = AuthForms;

