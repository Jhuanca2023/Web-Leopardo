// product-details.js
(function () {
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const sortFilter = document.getElementById("sort-filter");
const productsContainer = document.getElementById("products-container");
const products = Array.from(productsContainer.getElementsByClassName("product-item"));

function applyFilters() {
    const searchText = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const sortValue = sortFilter.value;

    // 🔍 Filtrar productos
    products.forEach(product => {
        const name = product.dataset.name.toLowerCase();
        const category = product.dataset.category;
        const matchesSearch = name.includes(searchText);
        const matchesCategory = !selectedCategory || category === selectedCategory;
        const parent = product.parentElement; // el padre del product-item

        if (matchesSearch && matchesCategory) {
            parent.style.display = "";  // mostrar según CSS original
        } else {
            parent.style.display = "none"; // ocultar todo el bloque padre
        }
    });

    // 📊 Ordenar productos visibles
    let visibleProducts = products.filter(p => p.style.display !== "none");

    visibleProducts.sort((a, b) => {
        if (sortValue === "nombre") {
            return a.dataset.name.localeCompare(b.dataset.name);
        } else if (sortValue === "precio_asc") {
            return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
        } else if (sortValue === "precio_desc") {
            return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
        } else if (sortValue === "fecha_desc") {
            return new Date(b.dataset.date) - new Date(a.dataset.date);
        }
        return 0;
    });

    // 🔄 Reordenar en el DOM usando el padre
    visibleProducts.forEach(product => {
        productsContainer.appendChild(product.parentElement);
    });
}

// Listeners 
["input", "change"].forEach(evt => {
    searchInput.addEventListener(evt, applyFilters);
});
categoryFilter.addEventListener("change", applyFilters);
sortFilter.addEventListener("change", applyFilters);

})();
