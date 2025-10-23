/**
 * LEOPARDO E-COMMERCE - PANEL DE ADMINISTRACIÓN DE PRODUCTOS
 * Sistema simplificado enfocado únicamente en la gestión de productos
 */
// Variable global donde se guardarán las imágenes adicionales
let archivosAdicionales = [];

// Función debounce local para admin
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Estado del administrador
const AdminState = {
    allProductos: [], // Todos los productos cargados
    productos: [], // Productos filtrados para mostrar
    categorias: [],
    currentPage: 1,
    itemsPerPage: 10,
    searchTerm: '',
    selectedCategory: '',
    isLoading: false,
    categoriasLoaded: false
};

window.initAdminPanel = function(){
    // Configurar botón volver
    const btnVolver = document.getElementById('btn-volver-cliente');
    if (btnVolver) {
        btnVolver.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

    // Ocultar header y footer en admin
    if (window.location.pathname.startsWith('/admin')) {
        const header = document.getElementById('site-header');
        const footer = document.getElementById('site-footer');
        if (header) header.style.display = 'none';
        if (footer) footer.style.display = 'none';
    }

    // Inicializar funcionalidades del panel
    initAdminEventListeners();
    loadCategorias();
    loadProductos();
}

// Inicializar event listeners del panel
function initAdminEventListeners() {
    // Búsqueda de productos
    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
        console.log('Configurando search input listener');
        searchInput.addEventListener('input', debounce(function(event) {
            const searchValue = event.target.value.trim();
            AdminState.searchTerm = searchValue;
            AdminState.currentPage = 1;
            filterAndRenderProducts();
        }, 300));
    } else {
        console.warn('No se encontró el elemento admin-search-input');
    }

    // Filtro por categoría
    const categoryFilter = document.getElementById('admin-category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            AdminState.selectedCategory = this.value;
            AdminState.currentPage = 1;
            filterAndRenderProducts();
        });
    }

    // Botón nuevo producto
    const btnNuevoProducto = document.getElementById('btn-nuevo-producto');
    if (btnNuevoProducto) {
        btnNuevoProducto.addEventListener('click', function() {
            showProductModal();
        });
    }

    // Botón guardar producto
    const btnSaveProduct = document.getElementById('btn-save-product');
    if (btnSaveProduct) {
        btnSaveProduct.addEventListener('click', function() {
            saveProduct();
        });
    }

    // Botón gestionar administradores
    const btnAdminUsers = document.getElementById('btn-admin-users');
    if (btnAdminUsers) {
        btnAdminUsers.addEventListener('click', function() {
            showAdminUsersModal();
        });
    }

    // Botón nuevo administrador
    const btnNewAdmin = document.getElementById('btn-new-admin');
    if (btnNewAdmin) {
        btnNewAdmin.addEventListener('click', function() {
            showAdminUserFormModal();
        });
    }

    // Botón guardar administrador
    const btnSaveAdminUser = document.getElementById('btn-save-admin-user');
    if (btnSaveAdminUser) {
        btnSaveAdminUser.addEventListener('click', function() {
            saveAdminUser();
        });
    }
}

function eliminarImagenesOcultas() {
  const inputs = document.querySelectorAll('.input-img-adicional');
  const rutasAEliminar = [];

  inputs.forEach(input => {
    const style = window.getComputedStyle(input);
    if (style.display === 'none' && input.value.trim() !== '') {
      rutasAEliminar.push(input.value.trim());
    }
  });

  if (rutasAEliminar.length === 0) {
    console.log('No hay imágenes para eliminar');
    return $.Deferred().resolve().promise(); // Devuelve promesa resuelta para encadenar luego
  }

  return API.post('/imagenes/eliminar', { rutas: rutasAEliminar })
    .done(function (response) {
      Utils.showNotification('Imágenes eliminadas correctamente', 'success');
      console.log('Eliminadas:', response);
    })
    .fail(function (xhr) {
      console.error('Error al eliminar imágenes:', xhr);
      const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al eliminar imágenes';
      Utils.showNotification(error, 'error');
    });
}

function subirNuevasImagenes() {
  if (archivosAdicionales.length === 0) {
    console.log('No hay nuevas imágenes para subir');
    return $.Deferred().resolve().promise(); // Para encadenar luego
  }

  const formData = new FormData();
  archivosAdicionales.forEach(({ idImagen, file }) => {
    formData.append(file.name, file);
  });

  return API.post('/imagenes/subir', formData)
    .done(function (response) {
      Utils.showNotification('Imágenes subidas correctamente', 'success');
      console.log('Subidas:', response);
    })
    .fail(function (xhr) {
      console.error('Error al subir imágenes:', xhr);
      const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al subir imágenes';
      Utils.showNotification(error, 'error');
    });
}

function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 9);
}

function obtenerRutasImagenesAdicionales() {
    const inputs = document.querySelectorAll('#listaImagenAdicional .input-img-adicional');
    const imagenesAdicionales = [];

    inputs.forEach(input => {
        const valor = input.value.trim();
        if (!valor) return; // si está vacío, lo ignora

        // Si ya tiene "assets/images/" no lo modificamos
        if (valor.startsWith('assets/images/')) {
            imagenesAdicionales.push(valor);
        } else {
            // Si solo tiene el nombre del archivo
            imagenesAdicionales.push(`assets/images/${valor}`);
        }
    });

    return imagenesAdicionales;
}

function agregarImagesAdicionales(){
  const input = document.getElementById('imagenAdicionalInput');
  const lista = document.getElementById('listaImagenAdicional');
  const file = input.files[0];

  if (!file) return; // nada seleccionado
  
  // id para referenciar este archivo en el array y DOM
  const idImagen = uid();

  // Guardar el File con su id
  archivosAdicionales.push({ idImagen, file });

  // crear contenedor del elemento
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.gap = '8px';
  div.style.marginBottom = '5px';

  // input bloqueado con el nombre del archivo
  const inputBloqueado = document.createElement('input');
  inputBloqueado.id = idImagen ;
  inputBloqueado.className = 'input-img-adicional input-img-nueva';
  inputBloqueado.type = 'text';
  inputBloqueado.value = file.name;
  inputBloqueado.readOnly = true;
  inputBloqueado.style.flex = '1';

  // botón eliminar
  const btnEliminar = document.createElement('button');
  btnEliminar.textContent = 'X';
  btnEliminar.style.background = '#dc3545';
  btnEliminar.style.color = '#fff';
  btnEliminar.style.border = 'none';
  btnEliminar.style.borderRadius = '4px';
  btnEliminar.style.padding = '4px 8px';
  btnEliminar.style.cursor = 'pointer';

  // eliminar este elemento al hacer clic
  btnEliminar.onclick = () => {
  // Eliminar del DOM
  div.remove();
  // Eliminar del array global imagenesAdicionales
  archivosAdicionales= archivosAdicionales.filter(img => img.id !== idImagen);
  };

  // añadir todo al contenedor
  div.appendChild(inputBloqueado);
  div.appendChild(btnEliminar);
  lista.appendChild(div);

  // limpiar input para permitir volver a elegir la misma imagen
  input.value = '';
}

// Cargar categorías
function loadCategorias() {
    if (AdminState.categoriasLoaded) {
        return Promise.resolve(AdminState.categorias);
    }
    
    return new Promise((resolve, reject) => {
        API.get('/categorias')
            .done(function(categorias) {
                AdminState.categorias = categorias;
                AdminState.categoriasLoaded = true;
                populateCategoryFilters();
                resolve(categorias);
            })
            .fail(function(xhr) {
                Utils.showNotification('Error al cargar categorías', 'error');
                reject(xhr);
            });
    });
}

// Poblar filtros de categoría
function populateCategoryFilters(selectedCategoryId = null) {
    const filterSelect = document.getElementById('admin-category-filter');
    const modalSelect = document.getElementById('product-categoria');
    
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Todas las categorías</option>';
        AdminState.categorias.forEach(cat => {
            const selected = AdminState.selectedCategory == cat.id ? 'selected' : '';
            filterSelect.innerHTML += `<option value="${cat.id}" ${selected}>${Utils.sanitizeHtml(cat.nombre)}</option>`;
        });
    }

    if (modalSelect) {
        modalSelect.innerHTML = '<option value="">Seleccionar categoría</option>';
        AdminState.categorias.forEach(cat => {
            const selected = selectedCategoryId == cat.id ? 'selected' : '';
            modalSelect.innerHTML += `<option value="${cat.id}" ${selected}>${Utils.sanitizeHtml(cat.nombre)}</option>`;
        });
    }
}

// Cargar productos
function loadProductos() {
    if (AdminState.isLoading) return;
    
    AdminState.isLoading = true;
    
    // Construir parámetros de búsqueda
    const params = {
        page: AdminState.currentPage,
        limit: AdminState.itemsPerPage
    };
    
    if (AdminState.searchTerm) {
        params.search = AdminState.searchTerm;
    }
    
    if (AdminState.selectedCategory) {
        params.categoria_id = AdminState.selectedCategory;
    }

    // Solo cargar todos los productos una vez (sin filtros)
    const simpleParams = { limit: 1000 }; // Cargar muchos productos

    API.get('/productos/all', simpleParams)
        .done(function(response) {
            AdminState.allProductos = response.data || response;
            filterAndRenderProducts();
        })
        .fail(function() {
            Utils.showNotification('Error al cargar productos', 'error');
        })
        .always(function() {
            AdminState.isLoading = false;
        });
}

// Filtrar y renderizar productos localmente
function filterAndRenderProducts() {
    let filteredProducts = [...AdminState.allProductos];
    
    // Filtrar por término de búsqueda
    if (AdminState.searchTerm) {
        const searchTerm = AdminState.searchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(producto => {
            return (
                producto.nombre.toLowerCase().includes(searchTerm) ||
                producto.codigo.toLowerCase().includes(searchTerm) ||
                (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm)) ||
                (producto.categoria_nombre && producto.categoria_nombre.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    // Filtrar por categoría
    if (AdminState.selectedCategory) {
        filteredProducts = filteredProducts.filter(producto => 
            producto.categoria_id == AdminState.selectedCategory
        );
    }
    
    // Calcular paginación
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / AdminState.itemsPerPage);
    const startIndex = (AdminState.currentPage - 1) * AdminState.itemsPerPage;
    const endIndex = startIndex + AdminState.itemsPerPage;
    
    console.log('Cálculos de paginación:', {
        totalProducts,
        totalPages,
        currentPage: AdminState.currentPage,
        itemsPerPage: AdminState.itemsPerPage,
        startIndex,
        endIndex
    });
    
    // Productos para la página actual
    AdminState.productos = filteredProducts.slice(startIndex, endIndex);
    console.log('Productos para mostrar en esta página:', AdminState.productos.length);
    
    // Renderizar
    renderProductsTable();
    updateProductsCount(totalProducts);
    renderPagination(totalProducts, totalPages);
}

// Renderizar tabla de productos
function renderProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    if (AdminState.productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="fas fa-inbox fa-3x mb-3 d-block"></i>
                    No se encontraron productos
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    AdminState.productos.forEach(producto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="/${producto.imagen_principal || 'assets/images/producto-default.jpg'}" 
                     alt="${Utils.sanitizeHtml(producto.nombre)}" 
                     class="admin-product-img"
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
            </td>
            <td>
                <div class="fw-medium">${Utils.sanitizeHtml(producto.nombre)}</div>
                <small class="product-code-gradient">${Utils.sanitizeHtml(producto.codigo || '')}</small>
            </td>
            <td>${Utils.sanitizeHtml(producto.categoria_nombre || 'Sin categoría')}</td>
            <td>
                <div class="fw-medium product-price-gradient">${Utils.formatPrice(producto.precio)}</div>
                ${producto.precio_promocional ? `<small class="text-success">Promo: ${Utils.formatPrice(producto.precio_promocional)}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-${getTotalStock(producto.tallas_stock) > 0 ? 'success' : 'danger'}">
                    ${getTotalStock(producto.tallas_stock)} unidades
                </span>
            </td>
            <td>
                <span class="badge bg-${producto.activo == 1 ? 'success' : 'secondary'}">
                    ${producto.activo == 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-primary btn-sm" 
                            onclick="editProduct(${producto.id})" 
                            title="Editar producto">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" 
                            onclick="deleteProduct(${producto.id})" 
                            title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Calcular stock total
function getTotalStock(tallasStock) {
    if (!tallasStock || typeof tallasStock !== 'object') return 0;
    return Object.values(tallasStock).reduce((total, stock) => total + parseInt(stock || 0), 0);
}

// Actualizar contador de productos
function updateProductsCount(totalCount = null) {
    const counter = document.getElementById('products-count');
    if (counter) {
        const count = totalCount !== null ? totalCount : AdminState.productos.length;
        const showing = AdminState.productos.length;
        
        if (AdminState.searchTerm || AdminState.selectedCategory) {
            counter.textContent = `${showing} de ${count} producto${count !== 1 ? 's' : ''}`;
        } else {
            counter.textContent = `${count} producto${count !== 1 ? 's' : ''}`;
        }
    }
}

// Renderizar paginación
function renderPagination(total, totalPages) {
    const container = document.getElementById('admin-pagination');
    console.log('Renderizando paginación:', { total, totalPages, currentPage: AdminState.currentPage });
    
    if (!container) {
        console.error('No se encontró el contenedor de paginación');
        return;
    }
    
    if (!totalPages || totalPages <= 1) {
        console.log('No se necesita paginación (páginas <= 1)');
        container.innerHTML = '';
        return;
    }

    let paginationHtml = '';
    
    // Botón anterior
    if (AdminState.currentPage > 1) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${AdminState.currentPage - 1}, event)">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
    }

    // Páginas
    const startPage = Math.max(1, AdminState.currentPage - 2);
    const endPage = Math.min(totalPages, AdminState.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <li class="page-item ${i === AdminState.currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}, event)">${i}</a>
            </li>
        `;
    }

    // Botón siguiente
    if (AdminState.currentPage < totalPages) {
        paginationHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${AdminState.currentPage + 1}, event)">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
    }

    container.innerHTML = paginationHtml;
}

// Cambiar página
function changePage(page, event) {
    if (event) {
        event.preventDefault();
    }
    
    console.log('Cambiando a página:', page);
    console.log('Página actual antes:', AdminState.currentPage);
    
    AdminState.currentPage = parseInt(page);
    
    console.log('Página actual después:', AdminState.currentPage);
    console.log('Total productos:', AdminState.allProductos.length);
    
    filterAndRenderProducts();
}

// Mostrar modal de producto
function showProductModal(producto = null) {
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    const form = document.getElementById('product-form');
    const modalTitle = document.getElementById('productModalLabel');
    
    // Limpiar formulario
    form.reset();
    
    // Asegurar que las categorías estén cargadas antes de continuar
    loadCategorias().then(() => {
        setupProductModal(producto, modal, form, modalTitle);
    }).catch(() => {
        Utils.showNotification('Error al cargar las categorías', 'error');
    });
}

// Función auxiliar para configurar el modal una vez que las categorías estén listas
function setupProductModal(producto, modal, form, modalTitle) {
    document.getElementById("listaImagenAdicional").innerHTML = "";
    
    if (producto) {
        // Modo edición
        modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Producto';
        document.getElementById('product-id').value = producto.id;
        document.getElementById('product-codigo').value = producto.codigo || '';
        document.getElementById('product-nombre').value = producto.nombre || '';
        document.getElementById('product-descripcion').value = producto.descripcion || '';
        document.getElementById('product-tipo').value = producto.tipo || '';
        document.getElementById('product-categoria').value = producto.categoria_id || '';
        document.getElementById('product-precio').value = producto.precio || '';
        document.getElementById('product-precio-promocional').value = producto.precio_promocional || '';
        
        // Configurar selects de destacado e impermeable
        const destacadoSelect = document.getElementById('product-destacado');
        const impermeableSelect = document.getElementById('product-impermeable');
        
        if (destacadoSelect) {
            destacadoSelect.value = producto.destacado || '0';
        }
        
        if (impermeableSelect) {
            impermeableSelect.value = producto.impermeable || '0';
        }
        
        document.getElementById('product-activo').checked = producto.activo == 1;
        
        // Especificaciones técnicas
        document.getElementById('product-material').value = producto.material || '';
        document.getElementById('product-espesor_cuero').value = producto.espesor_cuero || '';
        document.getElementById('product-forro').value = producto.forro || '';
        document.getElementById('product-puntera').value = producto.puntera || '';
        document.getElementById('product-suela').value = producto.suela || '';
        document.getElementById('product-plantilla').value = producto.plantilla || '';
        document.getElementById('product-aislamiento').value = producto.aislamiento || '';
        // El valor de impermeable ya se estableció arriba con verificación
        
        // Imágenes
        // Botón agregar imagenes adicionales
        const btnAddImagesA= document.getElementById('btn-add-imagen-adicional');
        if (btnAddImagesA) {
            btnAddImagesA.addEventListener('click', function() {
                agregarImagesAdicionales();
            });
        }
        
        document.getElementById("textoImagenPrincipal").innerHTML = `Imagen cargada: <span id="rutaImagenPrincipal">${producto.imagen_principal.split('/').pop()}</span>`;
        
        const inputImagen = document.getElementById("imagenPrincipalInput");
        inputImagen.addEventListener("change", () => {
            const archivo = inputImagen.files[0]; // Obtiene el primer archivo seleccionado
            if (archivo) {
                document.getElementById("rutaImagenPrincipal").textContent = archivo.name;
            } else {
                document.getElementById("rutaImagenPrincipal").textContent = "";
            }
        });

        const lista = document.getElementById('listaImagenAdicional');
        lista.innerHTML = ''; // Limpia la lista antes de cargar nuevas
        archivosAdicionales = [];

        if (producto.imagenes_adicionales || producto.imagenes_adicionales.length) {
            producto.imagenes_adicionales.forEach(ruta => {
                // Crear contenedor
                const div = document.createElement('div');
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.marginBottom = '5px';

                // Crear input bloqueado
                const input = document.createElement('input');
                input.className = 'input-img-adicional input-img-vacio';
                input.type = 'text';
                input.value = ruta; // Muestra la ruta
                input.disabled = true;
                input.style.flex = '1';
                input.style.marginRight = '8px';

                // Botón eliminar
                const btnEliminar = document.createElement('button');
                btnEliminar.type = 'button';
                btnEliminar.textContent = 'X';
                btnEliminar.style.cursor = 'pointer';
                btnEliminar.style.background = '#dc3545';
                btnEliminar.style.color = 'white';
                btnEliminar.style.border = 'none';
                btnEliminar.style.padding = '6px 10px';
                btnEliminar.style.borderRadius = '4px';
                btnEliminar.onclick = () => {div.style.display = 'none';};

                // Agregar elementos
                div.appendChild(input);
                div.appendChild(btnEliminar);
                lista.appendChild(div);
            });
        }
        
        // Stock por tallas (ahora se maneja dinámicamente)
        // document.getElementById('product-stock').value = stockTallas; // Comentado - ahora se maneja con initTallasDinamicas
    } else {
        // Modo creación
        modalTitle.innerHTML = '<i class="fas fa-plus me-2"></i>Nuevo Producto';
        document.getElementById('product-id').value = '';
        document.getElementById('product-activo').checked = true;
        document.getElementById('product-destacado').value = '0';
        document.getElementById('product-impermeable').value = '0';
    }
    
    // Cargar categorías en el select (ahora garantizadas como cargadas)
    populateCategoryFilters(producto ? producto.categoria_id : null);
    
    // Inicializar características dinámicas
    initCaracteristicasDinamicas(producto);
    
    // Inicializar tallas dinámicas
    initTallasDinamicas(producto);
    
    // Configurar validación de precio promocional
    setupPriceValidation();
    
    // Mostrar modal
    modal.show();
    
    // Establecer valores de selects después de mostrar el modal
    if (producto) {
        // Usar requestAnimationFrame para asegurar que el DOM esté completamente renderizado
        requestAnimationFrame(() => {
            setTimeout(() => {
                setSelectValues(producto);
            }, 50);
        });
    }
}

// Función auxiliar para establecer valores de selects
function setSelectValues(producto) {
    const categoriaSelect = document.getElementById('product-categoria');
    const destacadoSelect = document.getElementById('product-destacado');
    const impermeableSelect = document.getElementById('product-impermeable');
    
    if (categoriaSelect && producto.categoria_id) {
        categoriaSelect.value = producto.categoria_id.toString();
        // Verificar que se estableció correctamente
        if (categoriaSelect.value !== producto.categoria_id.toString()) {
            console.warn('No se pudo establecer la categoría:', producto.categoria_id);
        }
    }
    
    if (destacadoSelect) {
        const destacadoValue = (producto.destacado == 1 || producto.destacado === '1') ? '1' : '0';
        destacadoSelect.value = destacadoValue;
        console.log('Estableciendo destacado:', producto.destacado, '→', destacadoValue, 'Resultado:', destacadoSelect.value);
    }
    
    if (impermeableSelect) {
        const impermeableValue = (producto.impermeable == 1 || producto.impermeable === '1') ? '1' : '0';
        impermeableSelect.value = impermeableValue;
        console.log('Estableciendo impermeable:', producto.impermeable, '→', impermeableValue, 'Resultado:', impermeableSelect.value);
    }
}
// Guardar producto
function saveProduct() {
    const form = document.getElementById('product-form');
    const formData = new FormData(form);
    const productId = document.getElementById('product-id').value;
    
    // Validar campos requeridos
    if (!document.getElementById('product-codigo').value || 
        !document.getElementById('product-nombre').value || 
        !document.getElementById('product-descripcion').value ||
        !document.getElementById('product-categoria').value || 
        !document.getElementById('product-precio').value ||
        !document.getElementById('rutaImagenPrincipal').textContent) {
        Utils.showNotification('Por favor completa todos los campos requeridos (*)', 'warning');
        return;
    }
    
    // Validar precio promocional
    const precio = parseFloat(document.getElementById('product-precio').value);
    const precioPromocionalValue = document.getElementById('product-precio-promocional').value;
    const precioPromocional = precioPromocionalValue ? parseFloat(precioPromocionalValue) : null;
    
    if (precioPromocional && precioPromocional >= precio) {
        Utils.showNotification('El precio promocional debe ser menor al precio regular', 'warning');
        return;
    }
    
    // Procesar características
    const caracteristicas = getCaracteristicasArray();
    
    // Procesar imágenes adicionales
    let imagenesAdicionales = obtenerRutasImagenesAdicionales();    
    
    // Procesar imagen principal
    const imagenPrincipal = `assets/images/${document.getElementById('rutaImagenPrincipal').textContent}`;
    const archivoImagenPrincipal = document.getElementById("imagenPrincipalInput").files[0];
    // if (archivoImagenPrincipal) archivosAdicionales.push({ idImagen: Date.now(), file: archivo });
    
    // Procesar stock por tallas (sistema dinámico)
    const tallasStock = getTallasStockObject();
    
    // Construir objeto producto
    const productData = {
        codigo: document.getElementById('product-codigo').value.trim(),
        nombre: document.getElementById('product-nombre').value.trim(),
        descripcion: document.getElementById('product-descripcion').value.trim(),
        tipo: document.getElementById('product-tipo').value.trim() || null,
        precio: precio,
        precio_promocional: precioPromocional,
        categoria_id: parseInt(document.getElementById('product-categoria').value),
        destacado: parseInt(document.getElementById('product-destacado').value),
        activo: document.getElementById('product-activo').checked ? 1 : 0,
        
        // Especificaciones técnicas
        material: document.getElementById('product-material').value.trim() || null,
        espesor_cuero: document.getElementById('product-espesor_cuero').value.trim() || null,
        forro: document.getElementById('product-forro').value.trim() || null,
        puntera: document.getElementById('product-puntera').value.trim() || null,
        suela: document.getElementById('product-suela').value.trim() || null,
        plantilla: document.getElementById('product-plantilla').value.trim() || null,
        aislamiento: document.getElementById('product-aislamiento').value.trim() || null,
        impermeable: parseInt(document.getElementById('product-impermeable').value),
        
        // Imágenes
        imagen_principal: imagenPrincipal,
        imagenes_adicionales: imagenesAdicionales,
        
        // Características y stock
        caracteristicas: caracteristicas,
        tallas_stock: tallasStock
    };
    
    // Determinar si es edición o creación
    const isEdit = productId && productId !== '';
    const url = isEdit ? `/productos/${productId}` : '/productos';
    const method = isEdit ? 'put' : 'post';
    
        console.log(productData)
    
    // Guardar producto
    API[method](url, productData)
        .done(function() {
            // eliminarImagenesOcultas();
            // subirNuevasImagenes();
            
            Utils.showNotification(
                `Producto ${isEdit ? 'actualizado' : 'creado'} correctamente`, 
                'success'
            );
            
            // Cerrar modal y recargar productos
            const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            modal.hide();
            loadProductos();
        })
        .fail(function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al guardar el producto';
            Utils.showNotification(error, 'error');
        });
}

// Editar producto
function editProduct(productId) {
    API.get(`/productos/${productId}`)
        .done(function(producto) {
            showProductModal(producto);
        })
        .fail(function() {
            Utils.showNotification('Error al cargar el producto', 'error');
        });
}

// Eliminar producto
function deleteProduct(productId) {
    if (!confirm(`¿Estás seguro de que deseas eliminar este producto?`)) {
        return;
    }
    
    API.delete(`/productos/${productId}`)
        .done(function() {
            Utils.showNotification('Producto eliminado correctamente', 'success');
            loadProductos();
        })
        .fail(function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al eliminar el producto';
            Utils.showNotification(error, 'error');
        });
}

// Inicializar características dinámicas
function initCaracteristicasDinamicas(producto = null) {
    const container = document.getElementById('caracteristicas-container');
    if (!container) return;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    let caracteristicas = [];
    if (producto && producto.caracteristicas) {
        if (Array.isArray(producto.caracteristicas)) {
            caracteristicas = producto.caracteristicas;
        } else if (typeof producto.caracteristicas === 'string') {
            caracteristicas = producto.caracteristicas.split(',').map(c => c.trim()).filter(c => c);
        }
    }
    
    // Si no hay características, agregar un campo vacío
    if (caracteristicas.length === 0) {
        caracteristicas = [''];
    }
    
    // Crear campos de características
    caracteristicas.forEach((caracteristica, index) => {
        addCaracteristicaField(caracteristica, index);
    });
    
    // Configurar botón agregar
    const btnAdd = document.getElementById('btn-add-caracteristica');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => addCaracteristicaField(''));
    }
}

function addCaracteristicaField(value = '', index = null) {
    const container = document.getElementById('caracteristicas-container');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'caracteristica-item mb-2';
    
    const isFirst = container.children.length === 0;
    
    div.innerHTML = `
        <div class="input-group">
            <input type="text" class="form-control caracteristica-input" placeholder="Ej: Antideslizante" value="${value}">
            <button type="button" class="btn btn-outline-danger btn-remove-caracteristica" ${isFirst ? 'style="display:none;"' : ''}>
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(div);
    
    // Configurar botón remover
    const btnRemove = div.querySelector('.btn-remove-caracteristica');
    btnRemove.addEventListener('click', () => {
        div.remove();
        updateCaracteristicasRemoveButtons();
    });
    
    updateCaracteristicasRemoveButtons();
}

function updateCaracteristicasRemoveButtons() {
    const container = document.getElementById('caracteristicas-container');
    if (!container) return;
    
    const items = container.querySelectorAll('.caracteristica-item');
    items.forEach((item, index) => {
        const removeBtn = item.querySelector('.btn-remove-caracteristica');
        if (items.length === 1) {
            removeBtn.style.display = 'none';
        } else {
            removeBtn.style.display = 'block';
        }
    });
}

function getCaracteristicasArray() {
    const inputs = document.querySelectorAll('.caracteristica-input');
    const caracteristicas = [];
    
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            caracteristicas.push(value);
        }
    });
    
    return caracteristicas;
}

// ============================================
// GESTIÓN DINÁMICA DE TALLAS Y STOCK
// ============================================

// Inicializar tallas dinámicas
function initTallasDinamicas(producto = null) {
    const container = document.getElementById('tallas-stock-container');
    if (!container) return;
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    let tallasStock = {};
    if (producto && producto.tallas_stock) {
        if (typeof producto.tallas_stock === 'object') {
            tallasStock = producto.tallas_stock;
        } else if (typeof producto.tallas_stock === 'string') {
            // Parsear string formato "38:10,39:15,40:8"
            const pairs = producto.tallas_stock.split(',');
            pairs.forEach(pair => {
                const parts = pair.split(':');
                if (parts.length === 2) {
                    const talla = parts[0].trim();
                    const stock = parseInt(parts[1].trim()) || 0;
                    if (talla) {
                        tallasStock[talla] = stock;
                    }
                }
            });
        }
    }
    
    // Si no hay tallas, agregar el rango estándar completo 38-45
    if (Object.keys(tallasStock).length === 0) {
        tallasStock = { 
            '38': 0, '39': 0, '40': 0, '41': 0, 
            '42': 0, '43': 0, '44': 0, '45': 0 
        };
    }
    
    // Crear campos de tallas
    Object.entries(tallasStock).forEach(([talla, stock]) => {
        addTallaStockField(talla, stock);
    });
    
    // Configurar botón agregar
    const btnAdd = document.getElementById('btn-add-talla');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            addTallaStockField('', 0);
            // Ordenar automáticamente cuando el usuario agregue una talla manualmente
            setTimeout(() => {
                const tallasInputs = document.querySelectorAll('.talla-input');
                const lastInput = tallasInputs[tallasInputs.length - 1];
                if (lastInput) {
                    lastInput.addEventListener('blur', () => {
                        if (lastInput.value.trim()) {
                            sortTallasFields();
                        }
                    });
                }
            }, 100);
        });
    }
}

function addTallaStockField(talla = '', stock = 0) {
    const container = document.getElementById('tallas-stock-container');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'talla-stock-item mb-2';
    
    div.innerHTML = `
        <div class="row g-2">
            <div class="col-4">
                <input type="text" 
                       class="form-control talla-input" 
                       placeholder="Talla" 
                       value="${talla}"
                       pattern="[0-9]{1,3}"
                       title="Ingresa solo números (ej: 38, 39, 40)"
                       style="background: #2d2d2d; border: 2px solid #555; color: #f5c518; font-weight: bold;">
            </div>
            <div class="col-6">
                <input type="number" 
                       class="form-control stock-input" 
                       placeholder="Stock" 
                       value="${stock}"
                       min="0"
                       max="9999"
                       style="background: #2d2d2d; border: 2px solid #555; color: #ffffff; font-weight: bold;">
            </div>
            <div class="col-2">
                <button type="button" 
                        class="btn btn-outline-danger btn-remove-talla w-100" 
                        title="Eliminar talla"
                        style="border-color: #dc3545; color: #dc3545; font-weight: bold;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(div);
    
    // Configurar eventos
    const tallaInput = div.querySelector('.talla-input');
    const stockInput = div.querySelector('.stock-input');
    const btnRemove = div.querySelector('.btn-remove-talla');
    
    // Eventos de focus para efectos visuales
    tallaInput.addEventListener('focus', function() {
        this.style.borderColor = '#f5c518';
        this.style.boxShadow = '0 0 10px rgba(245, 197, 24, 0.3)';
    });
    
    tallaInput.addEventListener('blur', function() {
        this.style.borderColor = '#555';
        this.style.boxShadow = 'none';
    });
    
    stockInput.addEventListener('focus', function() {
        this.style.borderColor = '#f5c518';
        this.style.boxShadow = '0 0 10px rgba(245, 197, 24, 0.3)';
    });
    
    stockInput.addEventListener('blur', function() {
        this.style.borderColor = '#555';
        this.style.boxShadow = 'none';
    });
    
    // Hover effects para el botón remove
    btnRemove.addEventListener('mouseenter', function() {
        this.style.background = '#dc3545';
        this.style.color = 'white';
    });
    
    btnRemove.addEventListener('mouseleave', function() {
        this.style.background = 'transparent';
        this.style.color = '#dc3545';
    });
    
    // Validación de talla (solo números)
    tallaInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 3) {
            this.value = this.value.slice(0, 3);
        }
        updateTallasRemoveButtons();
    });
    
    // Validación de stock
    stockInput.addEventListener('input', function() {
        if (parseInt(this.value) < 0) this.value = 0;
        if (parseInt(this.value) > 9999) this.value = 9999;
        updateTallasStockBadge();
    });
    
    // Botón remover
    btnRemove.addEventListener('click', () => {
        div.remove();
        updateTallasRemoveButtons();
        updateTallasStockBadge();
    });
    
    updateTallasRemoveButtons();
    updateTallasStockBadge();
}

function updateTallasRemoveButtons() {
    const container = document.getElementById('tallas-stock-container');
    if (!container) return;
    
    const items = container.querySelectorAll('.talla-stock-item');
    items.forEach((item, index) => {
        const removeBtn = item.querySelector('.btn-remove-talla');
        // Siempre permitir eliminar tallas (a diferencia de características)
        removeBtn.style.display = 'block';
    });
}

function updateTallasStockBadge() {
    const badge = document.getElementById('total-stock-badge');
    if (!badge) return;
    
    const totalStock = getTotalStockFromInputs();
    badge.textContent = `${totalStock} unidades`;
    
    if (totalStock > 0) {
        badge.className = 'badge text-dark ms-2 fw-bold';
        badge.style.background = 'linear-gradient(135deg, #f5c518 0%, #d4a017 100%)';
        badge.style.boxShadow = '0 2px 8px rgba(245, 197, 24, 0.4)';
    } else {
        badge.className = 'badge bg-secondary text-white ms-2 fw-bold';
        badge.style.background = '#6c757d';
        badge.style.boxShadow = '0 2px 8px rgba(108, 117, 125, 0.3)';
    }
}

function getTotalStockFromInputs() {
    const stockInputs = document.querySelectorAll('.stock-input');
    let total = 0;
    
    stockInputs.forEach(input => {
        const stock = parseInt(input.value) || 0;
        total += stock;
    });
    
    return total;
}

function getTallasStockObject() {
    const container = document.getElementById('tallas-stock-container');
    if (!container) return {};
    
    const tallasStock = {};
    const items = container.querySelectorAll('.talla-stock-item');
    
    items.forEach(item => {
        const tallaInput = item.querySelector('.talla-input');
        const stockInput = item.querySelector('.stock-input');
        
        const talla = tallaInput.value.trim();
        const stock = parseInt(stockInput.value) || 0;
        
        if (talla && talla !== '') {
            tallasStock[talla] = stock;
        }
    });
    
    return tallasStock;
}

// Función para agregar tallas predefinidas completas
function addCommonSizes() {
    const commonSizes = ['38', '39', '40', '41', '42', '43', '44', '45'];
    const existingTallas = [];
    
    // Obtener tallas existentes
    const tallaInputs = document.querySelectorAll('.talla-input');
    tallaInputs.forEach(input => {
        if (input.value.trim()) {
            existingTallas.push(input.value.trim());
        }
    });
    
    // Agregar solo las tallas que no existen
    commonSizes.forEach(size => {
        if (!existingTallas.includes(size)) {
            addTallaStockField(size, 0);
        }
    });
    
    // Ordenar las tallas después de agregar
    sortTallasFields();
    updateTallasStockBadge();
}

// Función para ordenar los campos de talla numéricamente
function sortTallasFields() {
    const container = document.getElementById('tallas-stock-container');
    if (!container) return;
    
    const items = Array.from(container.querySelectorAll('.talla-stock-item'));
    
    items.sort((a, b) => {
        const tallaA = parseInt(a.querySelector('.talla-input').value) || 0;
        const tallaB = parseInt(b.querySelector('.talla-input').value) || 0;
        return tallaA - tallaB;
    });
    
    // Limpiar container y re-agregar en orden
    container.innerHTML = '';
    items.forEach(item => container.appendChild(item));
}

// Configurar validación de precios
function setupPriceValidation() {
    const precioRegular = document.getElementById('product-precio');
    const precioPromocional = document.getElementById('product-precio-promocional');
    const errorDiv = document.getElementById('precio-promocional-error');
    
    function validarPrecioPromocional() {
        const regular = parseFloat(precioRegular.value) || 0;
        const promocional = parseFloat(precioPromocional.value) || 0;
        
        if (precioPromocional.value && promocional >= regular) {
            precioPromocional.classList.add('is-invalid');
            if (errorDiv) {
                errorDiv.textContent = 'El precio promocional debe ser menor al precio regular';
                errorDiv.style.display = 'block';
            }
            return false;
        } else {
            precioPromocional.classList.remove('is-invalid');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
            return true;
        }
    }
    
    if (precioRegular && precioPromocional) {
        precioRegular.addEventListener('input', validarPrecioPromocional);
        precioPromocional.addEventListener('input', validarPrecioPromocional);
    }
}

// ============================================
// GESTIÓN DE ADMINISTRADORES
// ============================================

// Mostrar modal de administradores
function showAdminUsersModal() {
    const modal = new bootstrap.Modal(document.getElementById('adminUsersModal'));
    loadAdminUsers();
    modal.show();
}

// Cargar lista de administradores
function loadAdminUsers() {
    API.get('/admin/users')
        .done(function(users) {
            renderAdminUsersTable(users);
        })
        .fail(function(xhr) {
            console.error('Error al cargar usuarios:', xhr);
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al cargar usuarios';
            Utils.showNotification(error, 'error');
        });
}

// Renderizar tabla de administradores
function renderAdminUsersTable(users) {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="fas fa-users fa-2x mb-2 d-block"></i>
                    No hay usuarios registrados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="bg-${user.es_admin == 1 ? 'warning' : 'primary'} rounded-circle me-2 d-flex align-items-center justify-content-center" 
                         style="width: 35px; height: 35px; font-size: 14px;">
                        <i class="fas fa-${user.es_admin == 1 ? 'user-cog' : 'user'} text-white"></i>
                    </div>
                    <div>
                        <div class="fw-medium">${Utils.sanitizeHtml(user.name)}</div>
                        <small class="text-muted">${Utils.sanitizeHtml(user.telefono || 'Sin teléfono')}</small>
                    </div>
                </div>
            </td>
            <td>
                <div>${Utils.sanitizeHtml(user.email)}</div>
                ${user.telefono ? `<small class="text-muted"><i class="fas fa-phone me-1"></i>${Utils.sanitizeHtml(user.telefono)}</small>` : ''}
            </td>
            <td>
                <div class="text-muted">
                    ${user.direccion ? `<i class="fas fa-map-marker-alt me-1"></i>${Utils.sanitizeHtml(user.direccion)}` : '<span class="text-muted fst-italic">Sin dirección</span>'}
                </div>
            </td>
            <td>
                <span class="badge bg-${user.es_admin == 1 ? 'warning' : 'info'}">
                    <i class="fas fa-${user.es_admin == 1 ? 'user-cog' : 'user'} me-1"></i>
                    ${user.es_admin == 1 ? 'Administrador' : 'Cliente'}
                </span>
            </td>
            <td>
                <span class="badge bg-${user.activo == 1 ? 'success' : 'secondary'}">
                    ${user.activo == 1 ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <small class="text-muted">
                    ${user.fecha_creacion ? new Date(user.fecha_creacion).toLocaleDateString() : 'No disponible'}
                </small>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-primary btn-sm" 
                            onclick="editAdminUser(${user.id})" 
                            title="Editar usuario">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" 
                            onclick="deleteAdminUser(${user.id})" 
                            title="Eliminar usuario"
                            ${user.is_super_admin ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Mostrar modal de formulario de administrador
function showAdminUserFormModal(user = null) {
    const modal = new bootstrap.Modal(document.getElementById('adminUserFormModal'));
    const form = document.getElementById('admin-user-form');
    const modalTitle = document.getElementById('adminUserFormModalLabel');
    
    // Limpiar formulario
    form.reset();
    
    if (user) {
        // Modo edición
        modalTitle.innerHTML = '<i class="fas fa-user-edit me-2"></i>Editar Usuario';
        document.getElementById('admin-user-id').value = user.id;
        document.getElementById('admin-user-nombre').value = user.name || '';
        document.getElementById('admin-user-email').value = user.email || '';
        document.getElementById('admin-user-telefono').value = user.telefono || '';
        document.getElementById('admin-user-direccion').value = user.direccion || '';
        document.getElementById('admin-user-rol').value = user.es_admin == 1 ? 'admin' : 'cliente';
        document.getElementById('admin-user-activo').checked = user.activo == 1;
        
        // En modo edición, la contraseña es opcional
        const passwordField = document.getElementById('admin-user-password');
        passwordField.required = false;
        passwordField.placeholder = 'Dejar en blanco para mantener la actual';
    } else {
        // Modo creación
        modalTitle.innerHTML = '<i class="fas fa-user-plus me-2"></i>Nuevo Usuario';
        document.getElementById('admin-user-id').value = '';
        document.getElementById('admin-user-activo').checked = true;
        
        // En modo creación, la contraseña es requerida
        const passwordField = document.getElementById('admin-user-password');
        passwordField.required = true;
        passwordField.placeholder = 'Mínimo 6 caracteres';
    }
    
    modal.show();
}

// Guardar administrador
function saveAdminUser() {
    const form = document.getElementById('admin-user-form');
    const userId = document.getElementById('admin-user-id').value;
    
    // Validar campos requeridos
    if (!document.getElementById('admin-user-nombre').value || 
        !document.getElementById('admin-user-email').value) {
        Utils.showNotification('Por favor completa todos los campos requeridos (*)', 'warning');
        return;
    }
    
    // Validar contraseña en modo creación
    if (!userId && !document.getElementById('admin-user-password').value) {
        Utils.showNotification('La contraseña es requerida para nuevos usuarios', 'warning');
        return;
    }
    
    // Construir objeto de datos
    const userData = {
        name: document.getElementById('admin-user-nombre').value.trim(),
        email: document.getElementById('admin-user-email').value.trim(),
        telefono: document.getElementById('admin-user-telefono').value.trim() || null,
        direccion: document.getElementById('admin-user-direccion').value.trim() || null,
        es_admin: document.getElementById('admin-user-rol').value === 'admin' ? 1 : 0,
        activo: document.getElementById('admin-user-activo').checked ? 1 : 0
    };
    
    // Agregar contraseña si se proporcionó
    const password = document.getElementById('admin-user-password').value;
    if (password) {
        if (password.length < 6) {
            Utils.showNotification('La contraseña debe tener al menos 6 caracteres', 'warning');
            return;
        }
        userData.password = password;
    }
    
    // Determinar si es edición o creación
    const isEdit = userId && userId !== '';
    const url = isEdit ? `/admin/users/${userId}` : '/admin/users';
    const method = isEdit ? 'put' : 'post';
    
    console.log('Guardando usuario:', { isEdit, url, method, userData });
    
    // Guardar usuario
    API[method](url, userData)
        .done(function() {
            Utils.showNotification(
                `Usuario ${isEdit ? 'actualizado' : 'creado'} correctamente`, 
                'success'
            );
            
            // Cerrar modal y recargar lista
            const modal = bootstrap.Modal.getInstance(document.getElementById('adminUserFormModal'));
            modal.hide();
            loadAdminUsers();
        })
        .fail(function(xhr) {
            console.error('Error al guardar usuario:', xhr);
            let error = 'Error al guardar el usuario';
            if (xhr.status === 403) {
                error = 'No tienes permisos para realizar esta acción';
            } else if (xhr.responseJSON && xhr.responseJSON.error) {
                error = xhr.responseJSON.error;
            }
            Utils.showNotification(error, 'error');
        });
}

// Editar administrador
function editAdminUser(userId) {
    console.log('Editando usuario:', userId);
    API.get(`/admin/users/${userId}`)
        .done(function(user) {
            console.log('Usuario cargado:', user);
            showAdminUserFormModal(user);
        })
        .fail(function(xhr) {
            console.error('Error al cargar usuario:', xhr);
            let error = 'Error al cargar el usuario';
            if (xhr.status === 403) {
                error = 'No tienes permisos para ver este usuario';
            } else if (xhr.responseJSON && xhr.responseJSON.error) {
                error = xhr.responseJSON.error;
            }
            Utils.showNotification(error, 'error');
        });
}

// Eliminar administrador
function deleteAdminUser(userId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?\n\nEsta acción no se puede deshacer.')) {
        return;
    }
    
    API.delete(`/admin/users/${userId}`)
        .done(function() {
            Utils.showNotification('Usuario eliminado correctamente', 'success');
            loadAdminUsers();
        })
        .fail(function(xhr) {
            const error = xhr.responseJSON ? xhr.responseJSON.error : 'Error al eliminar el usuario';
            Utils.showNotification(error, 'error');
        });
}

// Exportar funciones globales
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.changePage = changePage;
window.editAdminUser = editAdminUser;
window.deleteAdminUser = deleteAdminUser;
window.addCommonSizes = addCommonSizes;
window.sortTallasFields = sortTallasFields;
