document.addEventListener('DOMContentLoaded', () => {
    // Variables
    const carrito = document.querySelector('#carrito');
    const listaCursos = document.querySelector('#lista-cursos');
    const contenedorCarrito = document.querySelector('#lista-carrito tbody');
    const vaciarCarritoBtn = document.querySelector('#vaciar-carrito');
    const procederCompraBtn = document.querySelector('#proceder-compra');
    const cantidadCarrito = document.querySelector('#cantidad-carrito');
    const mensajeVacio = document.querySelector('#mensaje-vacio');

    let articulosCarrito = JSON.parse(localStorage.getItem("carrito")) || [];

    cargarEventListeners();
    carritoHTML();

    function cargarEventListeners () {
        listaCursos.addEventListener('click', agregarCurso);
        carrito.addEventListener("click", eliminarCurso);

        vaciarCarritoBtn.addEventListener("click", () => {
            articulosCarrito = [];
            carritoHTML();
        });

        procederCompraBtn.addEventListener("click", procesarPago);
    }

    function agregarCurso (e) {
        e.preventDefault();

        if (e.target.classList.contains('agregar-carrito')) {
            const curso = e.target.closest('.card');
            leerDatosCurso(curso);
            productoAgregado(curso);
        }
    }

    function leerDatosCurso (curso) {
        const infoCurso = {
            imagen: curso.querySelector('img').getAttribute('src'),
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
            mensajeVacio.style.display = 'block';
            document.getElementById("total-carrito").style.display = 'none';
            document.getElementById("gastos-envio").style.display = 'none';
            document.getElementById("total-real-carrito").style.display = 'none';
            document.getElementById("aviso-correos").style.display = 'none';
            vaciarCarritoBtn.style.display = 'none';
            procederCompraBtn.style.display = 'none';
            cantidadCarrito.textContent = 0;
            sincronizarStorage();
            return;
        }

        document.getElementById("total-carrito").style.display = 'block';
        document.getElementById("gastos-envio").style.display = 'block';
        document.getElementById("total-real-carrito").style.display = 'block';
        document.getElementById("aviso-correos").style.display = 'block';
        mensajeVacio.style.display = 'none';
        vaciarCarritoBtn.style.display = 'block';
        procederCompraBtn.style.display = 'block';

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

        let gastos = 10;
        let totalReal = total + gastos;

        document.getElementById("total-precio").textContent = `${total.toFixed(2)}€`;
        document.getElementById("total-envio").textContent = `${gastos.toFixed(2)}€`;
        document.getElementById("total-real").textContent = `${totalReal.toFixed(2)}€`;

        actualizarCantidadCarrito();
        sincronizarStorage();
    }

    function productoAgregado (curso) {
        const aviso = document.createElement("H4");
        aviso.style.cssText = "color: black; text-align: left; margin: -10px 20px;";
        aviso.textContent = 'Added to cart';
        curso.appendChild(aviso);

        setTimeout(() => {
            aviso.remove();
        }, 2000);
    }

    function eliminarCurso (e) {
        if (e.target.classList.contains('borrar-curso')) {
            const cursoId = e.target.getAttribute("data-id");
            articulosCarrito = articulosCarrito.filter(curso => curso.id !== cursoId);
            carritoHTML();
        }
    }

    async function procesarPago () {
        if (articulosCarrito.length === 0) {
            alert("The cart is empty.");
            return;
        }

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
                            price: "10.00",
                        }
                    ]
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Error al procesar el pago:", error);
        }
    }

    function actualizarCantidadCarrito () {
        cantidadCarrito.textContent = articulosCarrito.length;
    }

    function sincronizarStorage () {
        localStorage.setItem("carrito", JSON.stringify(articulosCarrito));
    }

    function limpiarHTML () {
        while (contenedorCarrito.firstChild) {
            contenedorCarrito.removeChild(contenedorCarrito.firstChild);
        }
    }
});