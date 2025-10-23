// product-details.js
(function () {
  console.log("Inicializando Product Details...");

  let radios = document.querySelectorAll('input[name="options"]');
let tallaTexto = document.getElementById("tallaSeleccionada");

radios.forEach(radio => {
    radio.addEventListener("change", () => {
        tallaTexto.innerHTML = `<strong>Talla:</strong> ${radio.value}`;
    });
});
// Script cantidad
let stock = 1;
const decreaseBtn = document.getElementById("decrease");
const increaseBtn = document.getElementById("increase");
const cantidadInput = document.getElementById("cantidad");

decreaseBtn.addEventListener("click", () => {
    let current = parseInt(cantidadInput.value);
    if (current > 1) {
        cantidadInput.value = current - 1;
    }
});
// Botón sumar
increaseBtn.addEventListener("click", () => {
    stock = document.getElementById("product-stock").textContent;
    let current = parseInt(cantidadInput.value);
    if (current < stock) {
        cantidadInput.value = current + 1;
    }
});
})();
