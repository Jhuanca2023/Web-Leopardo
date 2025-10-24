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
        const query = this.mobileSearch?.value.trim();
        
        if (query) {
            window.location.href = `/productos?search=${encodeURIComponent(query)}`;
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
        }
    }

    updateAuthState() {
        const userMenu = document.getElementById('user-menu');
        const authMenu = document.getElementById('auth-menu');
        
        if (userMenu && userMenu.style.display !== 'none') {
            const userName = document.getElementById('user-name')?.textContent;
            if (this.mobileLoginBtn) {
                this.mobileLoginBtn.innerHTML = `
                    <i class="fas fa-user me-2"></i>
                    ${userName || 'Mi Perfil'}
                `;
                this.mobileLoginBtn.href = '/perfil';
            }
        } else {
            if (this.mobileLoginBtn) {
                this.mobileLoginBtn.innerHTML = `
                    <i class="fas fa-sign-in-alt me-2"></i>
                    Iniciar sesión
                `;
                this.mobileLoginBtn.href = '/login';
            }
        }
    }
    refresh() {
        this.syncCartBadge();
        this.updateAuthState();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.mobileMenu = new MobileMenu();
    document.addEventListener('cartUpdated', () => {
        window.mobileMenu?.refresh();
    });
    document.addEventListener('authStateChanged', () => {
        window.mobileMenu?.refresh();
    });
});

window.MobileMenu = MobileMenu;
