// Variables
const carrito = document.querySelector('#carrito');
const listaCursos = document.querySelector('#lista-cursos');
const contenedorCarrito = document.querySelector('#lista-carrito tbody');
const vaciarCarritoBtn = document.querySelector('#vaciar-carrito');
const procederCompraBtn = document.querySelector('#proceder-compra');
const cantidadCarrito = document.querySelector('#cantidad-carrito'); // Enlace del carrito
const mensajeVacio = document.querySelector('#mensaje-vacio'); // Mensaje cuando el carrito está vacío
let articulosCarrito = [];

// Listeners
cargarEventListeners();


function cargarEventListeners () {
    listaCursos.addEventListener('click', agregarCurso);
    carrito.addEventListener("click", eliminarCurso);

    document.addEventListener('DOMContentLoaded', () => {
        articulosCarrito = JSON.parse(localStorage.getItem("carrito")) || [];
        carritoHTML();
    });

    vaciarCarritoBtn.addEventListener("click", () => {
        articulosCarrito = [];
        carritoHTML();
    });

    procederCompraBtn.addEventListener("click", procesarPago);
}

// Funciones

async function procesarPago () {
    if (articulosCarrito.length === 0) {
        alert("The cart is empty. Add products before proceeding to checkout.");
        return;
    }
    let gastosEnvio = 10;
    let gastosGestion = 0;

    try {
        const response = await fetch("https://hotusedbriefs.onrender.com/create-checkout-session", {
            method: "POST",

            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: [
                    ...articulosCarrito.map(item => ({
                    name: item.titulo,
                    quantity: 1,
                    price: item.precio,
                })), 
                {
                    name: "Shipping & Handling",
                    quantity: 1,
                    price: (gastosEnvio + gastosGestion).toFixed(2),
                } 
                ]
            }),
        });

        const data = await response.json();
        if (data.url) {
            window.location.href = data.url; // Redirige a Stripe
        }
    } catch (error) {
        console.error("Error al procesar el pago:", error);
    }

    articulosCarrito = [];
    carritoHTML();
}

function agregarCurso (e) {
    e.preventDefault();
    if (e.target.classList.contains('agregar-carrito')) {
        const curso = e.target.parentElement.parentElement;
        leerDatosCurso(curso);
        productoAgregado(curso);
    }
}

function productoAgregado (curso) {
    const alert = document.createElement("H4");
    alert.style.cssText = " color: black; text-align: left;";
    alert.style.margin = "-10px 20px";
    alert.textContent = 'Added to cart';
    curso.appendChild(alert);
    setTimeout(() => {
        alert.remove();

    }, 2000);
}

function eliminarCurso (e) {
    if (e.target.classList.contains('borrar-curso')) {
        const cursoId = e.target.getAttribute("data-id");
        articulosCarrito = articulosCarrito.filter(curso => curso.id !== cursoId);
        carritoHTML();
    }
}

function leerDatosCurso (curso) {
    const infoCurso = {
        imagen: curso.querySelector('img').src,
        titulo: curso.querySelector('h4').textContent,
        precio: curso.querySelector('.precio span').textContent,
        id: curso.querySelector('.agregar-carrito').getAttribute('data-id')
    };

    const existe = articulosCarrito.some(item => item.id === infoCurso.id);

    if (existe) {
    alert("This item is already in your cart.");
    return;
    }

    articulosCarrito = [...articulosCarrito, infoCurso];

    carritoHTML();
}

function carritoHTML () {
    limpiarHTML();

    let total = 0;

    if (articulosCarrito.length === 0) {
        // Si el carrito está vacío, mostramos el mensaje y ocultamos los botones
        mensajeVacio.style.display = 'block'; // Mostrar mensaje
        document.getElementById("total-carrito").style.display = 'none';
        document.getElementById("gastos-envio").style.display = 'none';
        document.getElementById("total-real-carrito").style.display = 'none';
        document.getElementById("aviso-correos").style.display = 'none';
        vaciarCarritoBtn.style.display = 'none'; // Ocultar botón "Vaciar carrito"
        procederCompraBtn.style.display = 'none'; // Ocultar botón "Proceder a compra"
        cantidadCarrito.textContent = 0; // Actualizar contador
        return;
    }

    // Si hay productos en el carrito, mostramos los productos
    document.getElementById("total-carrito").style.display = 'block';
    document.getElementById("gastos-envio").style.display = 'block';
    document.getElementById("total-real-carrito").style.display = 'block';
    document.getElementById("aviso-correos").style.display = 'block';
    mensajeVacio.style.display = 'none'; // Ocultar mensaje
    vaciarCarritoBtn.style.display = 'block'; // Mostrar botón "Vaciar carrito"
    procederCompraBtn.style.display = 'block'; // Mostrar botón "Proceder a compra"

    articulosCarrito.forEach(curso => {
        const row1 = document.createElement('tr');

        const precio = parseFloat(curso.precio.replace('€', '').replace(',', '.'));
        total += precio;

        row1.innerHTML = `
            <td><img src="${curso.imagen}" width="60"></td>
            <td>${curso.titulo}</td>
            <td>${precio.toFixed(2)}€</td>
            <td><a href="#" class="borrar-curso" data-id="${curso.id}">X</a></td>
        `;

        contenedorCarrito.appendChild(row1);
    });

    let gastosEnvio = 10;
    let gastosGestion = 0;

    let gastos = gastosEnvio +  gastosGestion;

    let totalReal = total + gastos;

    // Actualizar el total en el HTML
    document.getElementById("total-precio").textContent = `${total.toFixed(2)}€`;
    document.getElementById("total-envio").textContent = `${gastos.toFixed(2)}€`;
    document.getElementById("total-real").textContent = `${totalReal.toFixed(2)}€`;

    // Actualizar la cantidad en el carrito
    actualizarCantidadCarrito();
    sincronizarStorage();
}

function actualizarCantidadCarrito () {
    const cantidadTotal = articulosCarrito.length;
    cantidadCarrito.textContent = cantidadTotal;
}

function sincronizarStorage () {
    localStorage.setItem("carrito", JSON.stringify(articulosCarrito));
}

function limpiarHTML () {
    while (contenedorCarrito.firstChild) {
        contenedorCarrito.removeChild(contenedorCarrito.firstChild);
    }
}



