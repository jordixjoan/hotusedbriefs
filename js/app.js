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

    const modal = document.getElementById("videoModal");
    const player = document.getElementById("videoPlayer");
    const cerrar = document.getElementById("cerrarVideo");

    document.querySelectorAll(".abrir-video").forEach(btn => {

        btn.addEventListener("click", () => {

            const video = btn.dataset.video;

            player.src = video;
            modal.style.display = "block";
            player.play();
        });
    });

    cerrar.addEventListener("click", () => {
        modal.style.display = "none";
        player.pause();
        player.currentTime = 0;
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            player.pause();
            player.currentTime = 0;
        }
    });

    /* ACTUALIZAR PRECIOS DINÁMICAMENTE */

    document.querySelectorAll(".card").forEach(card => {

        const selectorDias = card.querySelector(".opcion-dias");
        const checkboxExtra = card.querySelector(".opcion-extra");
        const precioElemento = card.querySelector(".precio-final");

        if (!selectorDias || !checkboxExtra || !precioElemento) return;

        function actualizarPrecio() {

            let precio = parseFloat(selectorDias.value);

            if (checkboxExtra.checked) {
                precio += 30;
            }

            precioElemento.textContent = precio.toFixed(2) + "€";
        }

        selectorDias.addEventListener("change", () => {
            actualizarPrecio();
            actualizarEstadoBotones();
        });

        checkboxExtra.addEventListener("change", () => {
            actualizarPrecio();
            actualizarEstadoBotones();
        });

        actualizarPrecio();
    });

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

    if (e.target.classList.contains('agregar-carrito')) {
        e.preventDefault();

        const curso = e.target.closest('.card');
        leerDatosCurso(curso);
        productoAgregado(curso);
    }
}

    function leerDatosCurso (curso) {
        const selectorDias = curso.querySelector('.opcion-dias');
        const checkboxExtra = curso.querySelector('.opcion-extra');
        const precioFinal = curso.querySelector('.precio-final').textContent;

        const idBase = curso.querySelector('.agregar-carrito').getAttribute('data-id');

        const infoCurso = {
            imagen: curso.querySelector('img').getAttribute('src'),
            titulo: curso.querySelector('h4').textContent,
            precio: precioFinal,
            id: idBase,
            dias: selectorDias.value,
            extra: checkboxExtra.checked
        };

        const indexExiste = articulosCarrito.findIndex(item => item.id === idBase);

        if (indexExiste !== -1) {
            const itemExistente = articulosCarrito[indexExiste];

            const mismasOpciones =
                itemExistente.dias === infoCurso.dias &&
                itemExistente.extra === infoCurso.extra;


            articulosCarrito[indexExiste] = infoCurso;
            
        } else {
            articulosCarrito = [...articulosCarrito, infoCurso];
        }

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
            actualizarEstadoBotones();
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
                <td>
                    ${curso.titulo}<br>
                    <small>
                        ${curso.dias == 30 ? '1 day of use' : curso.dias == 40 ? '3 days of use' : '7 days of use'}
                        ${curso.extra ? '+ Cum on it' : ''}
                    </small>
                </td>
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
        actualizarEstadoBotones();
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
                            price: "15.00",
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

    function actualizarEstadoBotones() {

        document.querySelectorAll('.card').forEach(card => {

            const boton = card.querySelector('.agregar-carrito');
            const id = boton.dataset.id;

            const dias = card.querySelector('.opcion-dias')?.value;
            const extra = card.querySelector('.opcion-extra')?.checked;

            const itemCarrito = articulosCarrito.find(item => item.id === id);

            if (!itemCarrito) {
                boton.textContent = 'Add to cart';
                boton.style.opacity = '1';
                boton.style.pointerEvents = 'auto';
                return;
            }

            const mismasOpciones =
                itemCarrito.dias === dias &&
                itemCarrito.extra === extra;

            if (mismasOpciones) {
                boton.textContent = '✓ Item already in cart';
                boton.style.opacity = '0.6';
                boton.style.pointerEvents = 'none';
            } else {
                boton.textContent = 'Update cart';
                boton.style.opacity = '1';
                boton.style.pointerEvents = 'auto';
            }
        });
    }

    function abrirVideo001() {
        document.getElementById("video001").style.display = "block";

        const video = document.getElementById("video001-player");
        video.currentTime = 0;
        video.play();
    }

    function cerrarVideo001() {
        document.getElementById("video001").style.display = "none";

        const video = document.getElementById("video001-player");
        video.pause();
        video.currentTime = 0;
    }

    window.addEventListener("click", function(e) {
        const modal = document.getElementById("video001");

        if (e.target === modal) {
            cerrarVideo001();
        }
    });
});