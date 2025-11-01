/**
 * MÓVIL MENÚ LATERAL - LEOPARDO E-COMMERCE
 * Controla la apertura/cierre del menú lateral en dispositivos móviles
 */

class MobileMenu {
    constructor() {
        this.sidebar = document.getElementById('mobile-sidebar');
        this.overlay = document.getElementById('mobile-sidebar-overlay');
        this.menuBtn = document.getElementById('mobile-menu-btn');
        this.closeBtn = document.getElementById('mobile-sidebar-close');
        this.categoriesToggle = document.getElementById('mobile-categories-toggle');
        this.mobileSearchForm = document.getElementById('mobile-search-form');
        this.mobileSearch = document.getElementById('mobile-search');
        this.mobileCartBadge = document.getElementById('mobile-cart-badge');
        this.mobileLoginBtn = document.getElementById('mobile-login-btn');
        
        this.isOpen = false;
        this.init();
    }

    init() {

        this.menuBtn?.addEventListener('click', () => this.open());
        this.closeBtn?.addEventListener('click', () => this.close());
        this.overlay?.addEventListener('click', () => this.close());
        
 
        this.mobileSearchForm?.addEventListener('submit', (e) => this.handleMobileSearch(e));
        this.categoriesToggle?.addEventListener('click', (e) => this.handleCategoriesToggle(e));
        this.sidebar?.addEventListener('click', (e) => {
            if (e.target.closest('a[href]') && !e.target.closest('#mobile-categories-toggle')) {
                this.close();
            }
        });
        

        this.syncCartBadge();
        this.updateAuthState();
    }

    open() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.add('show');
            this.overlay.classList.add('show');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            const icon = this.menuBtn?.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-times';
            }
            
            // Actualizar el estado de autenticación cada vez que se abre el menú
            this.updateAuthState();
        }
    }

    close() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.remove('show');
            this.overlay.classList.remove('show');
            this.isOpen = false;
            

            document.body.style.overflow = '';
            const icon = this.menuBtn?.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
        }
    }

    handleMobileSearch(e) {
        e.preventDefault();
        const query = this.mobileSearch?.value || '';

        if (typeof window.handleGlobalSearch === 'function') {
            window.handleGlobalSearch(query, { closeMobileMenu: true });
        }
    }

    handleCategoriesToggle(e) {
        e.preventDefault();
        let categoriesSubmenu = document.getElementById('mobile-categories-submenu');
        
        if (!categoriesSubmenu) {
            this.createCategoriesSubmenu();
        } else {

            const isVisible = categoriesSubmenu.style.display !== 'none';
            categoriesSubmenu.style.display = isVisible ? 'none' : 'block';
            const chevron = this.categoriesToggle?.querySelector('.fa-chevron-right');
            if (chevron) {
                chevron.className = isVisible ? 'fas fa-chevron-right ms-auto' : 'fas fa-chevron-down ms-auto';
            }
        }
    }

    createCategoriesSubmenu() {
        const categoriesSubmenu = document.createElement('ul');
        categoriesSubmenu.id = 'mobile-categories-submenu';
        categoriesSubmenu.style.display = 'block';
        categoriesSubmenu.style.marginLeft = '1rem';
        categoriesSubmenu.style.marginTop = '0.5rem';
        categoriesSubmenu.style.listStyle = 'none';
        categoriesSubmenu.style.padding = '0';
        const categories = [
            { name: 'Calzado de Seguridad', href: '/productos?categoria=calzado-seguridad' },
            { name: 'Calzado Impermeable', href: '/productos?categoria=impermeable' },
            { name: 'Calzado Dieléctrico', href: '/productos?categoria=dielectrico' },
            { name: 'Línea Económica', href: '/productos?categoria=economica' },
            { name: 'Trekking', href: '/productos?categoria=trekking' }
        ];
        
        categories.forEach(category => {
            const li = document.createElement('li');
            li.style.marginBottom = '0.25rem';
            
            const a = document.createElement('a');
            a.href = category.href;
            a.className = 'nav-link';
            a.style.padding = '0.5rem 1rem';
            a.style.color = 'var(--text-primary)';
            a.style.textDecoration = 'none';
            a.style.borderRadius = 'var(--border-radius)';
            a.style.transition = 'var(--transition)';
            a.style.display = 'flex';
            a.style.alignItems = 'center';
            a.innerHTML = `<i class="fas fa-chevron-right me-2" style="font-size: 0.8rem;"></i>${category.name}`;
            
            a.addEventListener('mouseenter', () => {
                a.style.background = 'var(--bg-hover)';
                a.style.color = 'var(--primary-color)';
            });
            
            a.addEventListener('mouseleave', () => {
                a.style.background = 'transparent';
                a.style.color = 'var(--text-primary)';
            });
            
            li.appendChild(a);
            categoriesSubmenu.appendChild(li);
        });

        const categoriesItem = this.categoriesToggle?.parentElement;
        if (categoriesItem) {
            categoriesItem.insertAdjacentElement('afterend', categoriesSubmenu);
        }

        const chevron = this.categoriesToggle?.querySelector('.fa-chevron-right');
        if (chevron) {
            chevron.className = 'fas fa-chevron-down ms-auto';
        }
    }

    syncCartBadge() {
        const mainCartBadge = document.getElementById('cart-badge');
        if (mainCartBadge && this.mobileCartBadge) {
            this.mobileCartBadge.textContent = mainCartBadge.textContent;
            
            // También sincronizar visibilidad
            if (mainCartBadge.style.display === 'none' || mainCartBadge.textContent === '0') {
                this.mobileCartBadge.style.display = 'none';
            } else {
                this.mobileCartBadge.style.display = 'inline-block';
            }
        }
    }

    updateAuthState() {
        console.log('🔄 Actualizando estado de autenticación móvil...');
        
        // Cargar usuario desde localStorage si AppState aún no lo tiene
        if (!AppState.user) {
            const savedUser = localStorage.getItem(APP_CONFIG?.userKey || 'leopardo_user');
            if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
                try {
                    AppState.user = JSON.parse(savedUser);
                } catch (e) {
                    console.error('Error parsing user from localStorage:', e);
                    localStorage.removeItem(APP_CONFIG?.userKey || 'leopardo_user');
                }
            }
        }
        
        // Verificar si el usuario está autenticado
        const isAuthenticated = AppState && AppState.user && AppState.user.id;
        
        console.log('📱 Estado de autenticación móvil:', { 
            isAuthenticated, 
            hasAppState: !!AppState, 
            hasUser: !!(AppState && AppState.user),
            userId: AppState && AppState.user ? AppState.user.id : 'no user',
            userName: AppState && AppState.user ? AppState.user.name : 'no user'
        });
        
            // Obtener elementos del menú
        const mobileUserMenu = document.getElementById('mobile-user-menu');
        const mobileLoginContainer = document.getElementById('mobile-login-container');
        
        console.log('🔍 Elementos del menú móvil:', {
            mobileUserMenu: !!mobileUserMenu,
            mobileLoginContainer: !!mobileLoginContainer
        });
        
        if (isAuthenticated) {
            console.log('🔐 Usuario autenticado - Configurando menú móvil');
            // Usuario autenticado - mostrar menú de usuario y ocultar contenedor de login
            if (mobileUserMenu) {
                console.log('✅ mobileUserMenu existe, configurando...');
                mobileUserMenu.style.display = 'block';
                console.log('✅ Mostrando menú de usuario móvil');
                
                // Mostrar/ocultar "Panel Administrador" según el rol
                const mobileAdminLink = document.getElementById('mobile-admin-link');
                if (mobileAdminLink) {
                    // Verificar si el usuario es admin usando AppState
                    const isAdmin = AppState.user && AppState.user.es_admin;
                    console.log('👤 Es admin?', isAdmin, 'user.es_admin:', AppState.user?.es_admin);
                    if (isAdmin) {
                        mobileAdminLink.style.display = 'block';
                        console.log('✅ Mostrando Panel Admin');
                    } else {
                        mobileAdminLink.style.display = 'none';
                        console.log('❌ Ocultando Panel Admin');
                    }
                } else {
                    console.error('❌ No se encontró el elemento mobile-admin-link');
                }
            } else {
                console.error('❌ PROBLEMA: No se encontró el elemento mobile-user-menu');
            }
            
            if (mobileLoginContainer) {
                mobileLoginContainer.style.display = 'none';
                console.log('✅ Ocultando contenedor de login');
            }
            
            // Configurar el botón de logout móvil
            const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
            if (mobileLogoutBtn) {
                // Limpiar listeners previos para evitar duplicados
                mobileLogoutBtn.replaceWith(mobileLogoutBtn.cloneNode(true));
                const newLogoutBtn = document.getElementById('mobile-logout-btn');
                
                newLogoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (document.getElementById('logout-btn')) {
                        document.getElementById('logout-btn').click();
                    }
                });
            }
        } else {
            // Usuario no autenticado - mostrar contenedor de login y ocultar menú de usuario
            if (mobileUserMenu) {
                mobileUserMenu.style.display = 'none';
                console.log('❌ Ocultando menú de usuario móvil');
            }
            
            if (mobileLoginContainer) {
                mobileLoginContainer.style.display = 'block';
                console.log('✅ Mostrando contenedor de login');
            }
        }
    }
    refresh() {
        this.syncCartBadge();
        this.updateAuthState();
    }
    
    // Función para sincronizar inmediatamente al cargar
    forceSyncCartBadge() {
        console.log('🛒 Sincronizando badge móvil del carrito...');
        
        // Obtener el estado actual del carrito desde AppState
        if (window.AppState && window.AppState.cart) {
            console.log('📊 Estado del carrito:', window.AppState.cart);
            
            if (this.mobileCartBadge) {
                const count = window.AppState.cart.count || 0;
                this.mobileCartBadge.textContent = count;
                
                console.log(`🔢 Actualizando badge móvil a: ${count}`);
                
                if (count > 0) {
                    this.mobileCartBadge.style.display = 'inline-block';
                    console.log('✅ Badge móvil visible');
                } else {
                    this.mobileCartBadge.style.display = 'none';
                    console.log('❌ Badge móvil oculto');
                }
            } else {
                console.error('❌ No se encontró el elemento mobile-cart-badge');
            }
        } else {
            console.log('⚠️ AppState.cart no disponible, usando fallback');
            // Fallback: sincronizar con el badge principal
            this.syncCartBadge();
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.mobileMenu = new MobileMenu();
    
    // Sincronizar después de que se cargue el carrito
    setTimeout(() => {
        window.mobileMenu?.forceSyncCartBadge();
        // También actualizar estado de autenticación después de un delay para asegurar que AppState esté cargado
        window.mobileMenu?.updateAuthState();
    }, 500);
    
    document.addEventListener('cartUpdated', () => {
        window.mobileMenu?.refresh();
    });
    document.addEventListener('authStateChanged', () => {
        window.mobileMenu?.refresh();
    });
    
});

window.MobileMenu = MobileMenu;
