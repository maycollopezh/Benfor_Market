import { mostrarAlertaExito, mostrarAlertaError } from './interfaz.js';

document.addEventListener('DOMContentLoaded', () => {

    // 1. CARGAMOS INVENTARIO DE LA BASE DE DATOS LOCAL
    let inventario = JSON.parse(localStorage.getItem('baseDatosInventario')) || [];
    document.getElementById('info-catalogo').innerText = `${inventario.length} en catálogo`;

    // 2. ESTADO DEL CARRITO
    let carrito = [];
    let totalCaja = 0;

    // Referencias al DOM
    const inputBusqueda = document.getElementById('input-busqueda-caja');

    // ==========================================
    // LÓGICA DEL ESCÁNER DE CÁMARA (CAJA)
    // ==========================================
    const btnEscanearCaja = document.getElementById('btn-escanear-caja');
    const lectorCamaraCaja = document.getElementById('lector-camara-caja');
    let escannerCaja;

    if (btnEscanearCaja) {
        btnEscanearCaja.addEventListener('click', () => {
            if (lectorCamaraCaja.style.display === 'block') {
                if (escannerCaja) escannerCaja.stop().then(() => lectorCamaraCaja.style.display = 'none');
            } else {
                lectorCamaraCaja.style.display = 'block';
                escannerCaja = new Html5Qrcode("lector-camara-caja");
                
                escannerCaja.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 100 } },
                    (codigo) => {
                        // Pone el código en la cajita
                        inputBusqueda.value = codigo;
                        
                        // Apaga la cámara
                        escannerCaja.stop().then(() => lectorCamaraCaja.style.display = 'none');
                        
                        // ¡Automáticamente simula darle al botón "Agregar"!
                        formAgregar.dispatchEvent(new Event('submit'));
                        mostrarAlertaExito('Producto escaneado');
                    },
                    (error) => {} // Ignorar
                ).catch((err) => {
                    mostrarAlertaError('Sin permisos de cámara');
                    lectorCamaraCaja.style.display = 'none';
                });
            }
        });
    }

    const formAgregar = document.getElementById('form-agregar-producto');
    const cuerpoCarrito = document.getElementById('cuerpo-carrito');
    const mensajeVacio = document.getElementById('mensaje-carrito-vacio');
    const btnCobrar = document.getElementById('btn-cobrar');

    

    // 3. AGREGAR PRODUCTO AL CARRITO
    formAgregar.addEventListener('submit', (e) => {
        e.preventDefault();
        const textoBuscado = inputBusqueda.value.trim().toLowerCase();
        if (textoBuscado === '') return;

        // Buscamos si existe por código o por nombre exacto
        const productoEncontrado = inventario.find(p => 
            p.codigo === textoBuscado || p.nombre.toLowerCase() === textoBuscado
        );

        if (productoEncontrado) {
            // Revisamos si ya lo teníamos en el carrito
            const itemEnCarrito = carrito.find(item => item.codigo === productoEncontrado.codigo);

            if (itemEnCarrito) {
                // Si ya está, verificamos que haya stock suficiente para sumar 1 más
                if (itemEnCarrito.cantidad < productoEncontrado.stock) {
                    itemEnCarrito.cantidad++;
                } else {
                    mostrarAlertaError('No hay más stock disponible');
                }
            } else {
                // Si es nuevo en el carrito, revisamos si el stock no es 0
                if (productoEncontrado.stock > 0) {
                    carrito.push({
                        ...productoEncontrado, // Copiamos todos los datos
                        cantidad: 1            // Le agregamos la propiedad cantidad
                    });
                } else {
                    mostrarAlertaError('Producto agotado');
                }
            }
            inputBusqueda.value = ''; // Limpiamos la cajita
            actualizarInterfazCarrito();
        } else {
            mostrarAlertaError('Producto no encontrado');
        }
    });

    // 4. ACTUALIZAR INTERFAZ (Pintar carrito y sumar totales)
    function actualizarInterfazCarrito() {
        cuerpoCarrito.innerHTML = '';
        let totalProductos = 0;
        totalCaja = 0;

        if (carrito.length === 0) {
            cuerpoCarrito.appendChild(mensajeVacio);
            btnCobrar.disabled = true;
        } else {
            btnCobrar.disabled = false;
            
            carrito.forEach((item, index) => {
                const subtotal = item.precio * item.cantidad;
                totalCaja += subtotal;
                totalProductos += item.cantidad;

                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>
                        <div style="font-weight: bold; color: #0f172a;">${item.nombre}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">${item.codigo}</div>
                    </td>
                    <td>Bs. ${item.precio.toFixed(2)}</td>
                    <td>
                        <div class="control-cantidad">
                            <button class="btn-cant btn-restar" data-index="${index}">-</button>
                            <span>${item.cantidad}</span>
                            <button class="btn-cant btn-sumar" data-index="${index}">+</button>
                        </div>
                    </td>
                    <td style="font-weight: 500;">Bs. ${subtotal.toFixed(2)}</td>
                    <td>
                        <button class="btn-accion btn-quitar" data-index="${index}" style="color: red;">🗑️</button>
                    </td>
                `;
                cuerpoCarrito.appendChild(fila);
            });
        }

        // Actualizar Resumen Lateral
        document.getElementById('resumen-cantidad').innerText = totalProductos;
        document.getElementById('resumen-subtotal').innerText = `Bs. ${totalCaja.toFixed(2)}`;
        document.getElementById('resumen-total').innerText = `Bs. ${totalCaja.toFixed(2)}`;
    }

    // 5. ESCUCHAR CLICS DENTRO DEL CARRITO (+, -, Quitar)
    cuerpoCarrito.addEventListener('click', (e) => {
        const btnSumar = e.target.closest('.btn-sumar');
        const btnRestar = e.target.closest('.btn-restar');
        const btnQuitar = e.target.closest('.btn-quitar');

        if (btnSumar) {
            const index = btnSumar.getAttribute('data-index');
            const item = carrito[index];
            const prodInventario = inventario.find(p => p.codigo === item.codigo);
            if (item.cantidad < prodInventario.stock) item.cantidad++;
            else mostrarAlertaError('Stock máximo alcanzado');
            actualizarInterfazCarrito();
        }

        if (btnRestar) {
            const index = btnRestar.getAttribute('data-index');
            if (carrito[index].cantidad > 1) carrito[index].cantidad--;
            actualizarInterfazCarrito();
        }

        if (btnQuitar) {
            const index = btnQuitar.getAttribute('data-index');
            carrito.splice(index, 1); // Lo borra del arreglo
            actualizarInterfazCarrito();
        }
    });

    // Botón Vaciar Carrito
    document.getElementById('btn-vaciar').addEventListener('click', () => {
        carrito = [];
        actualizarInterfazCarrito();
    });


    // ==========================================
    // 6. LÓGICA DEL MODAL DE COBRO
    // ==========================================
    const modalCobro = document.getElementById('modal-cobro');
    const inputMonto = document.getElementById('input-monto-recibido');
    const textoCambio = document.getElementById('texto-cambio');

    btnCobrar.addEventListener('click', () => {
        document.getElementById('titulo-modal-cobro').innerText = `Procesar pago — Total Bs. ${totalCaja.toFixed(2)}`;
        inputMonto.value = '';
        textoCambio.innerText = 'Bs. 0.00';
        modalCobro.classList.remove('oculto');
        setTimeout(() => inputMonto.focus(), 100);
    });

    document.getElementById('btn-cerrar-cobro').addEventListener('click', () => {
        modalCobro.classList.add('oculto');
    });

    // Pestañas (Efectivo / QR)
    const tabEfectivo = document.getElementById('tab-efectivo');
    const tabQr = document.getElementById('tab-qr');
    const vistaEfectivo = document.getElementById('vista-efectivo');
    const vistaQr = document.getElementById('vista-qr');

    // Cuando hacemos clic en Efectivo
    tabEfectivo.addEventListener('click', () => {
        tabEfectivo.classList.add('activo');
        tabQr.classList.remove('activo');
        
        vistaEfectivo.classList.remove('oculto'); // Mostramos efectivo
        vistaQr.classList.add('oculto');          // Ocultamos QR
        
        inputMonto.focus(); // Ponemos el cursor listo para escribir
    });

    // Cuando hacemos clic en QR / Billetera
    tabQr.addEventListener('click', () => {
        tabQr.classList.add('activo');
        tabEfectivo.classList.remove('activo');
        
        vistaQr.classList.remove('oculto');       // Mostramos QR
        vistaEfectivo.classList.add('oculto');    // Ocultamos efectivo
    });

    // Calcular Cambio dinámicamente
    inputMonto.addEventListener('input', () => {
        const monto = parseFloat(inputMonto.value) || 0;
        const cambio = monto - totalCaja;
        if (cambio >= 0) {
            textoCambio.innerText = `Bs. ${cambio.toFixed(2)}`;
            textoCambio.style.color = '#16a34a'; // Verde
        } else {
            textoCambio.innerText = 'Falta dinero';
            textoCambio.style.color = '#ef4444'; // Rojo
        }
    });

    // 7. CONFIRMAR LA VENTA (EL NÚCLEO DEL PROYECTO)
    function finalizarVenta() {
        // Descontar stock del inventario
        carrito.forEach(itemVendido => {
            const productoOriginal = inventario.find(p => p.codigo === itemVendido.codigo);
            if (productoOriginal) {
                productoOriginal.stock -= itemVendido.cantidad;
            }
        });

        // Guardar el nuevo stock en la base de datos
        localStorage.setItem('baseDatosInventario', JSON.stringify(inventario));

        // ===============================================
        // NUEVO: GUARDAR EL HISTORIAL DE VENTAS DEL DÍA
        // ===============================================
        let historialVentas = JSON.parse(localStorage.getItem('baseDatosVentas')) || [];
        
        // Obtenemos la fecha local exacta (Ej: 2026-06-05)
        const ahora = new Date();
        const year = ahora.getFullYear();
        const month = String(ahora.getMonth() + 1).padStart(2, '0');
        const day = String(ahora.getDate()).padStart(2, '0');
        const fechaLocal = `${year}-${month}-${day}`;

        // Creamos el comprobante interno de la venta
        // Creamos el comprobante interno de la venta
        const nuevaVenta = {
            id: Date.now(),
            fecha: fechaLocal,
            total: totalCaja,
            productos: carrito.map(item => ({
                nombre: item.nombre,
                cantidad: item.cantidad,
                costo: item.costo,
                subtotal: item.precio * item.cantidad
            }))
        };

        // Guardamos la venta en el historial
        historialVentas.push(nuevaVenta);
        localStorage.setItem('baseDatosVentas', JSON.stringify(historialVentas));

        // Cerrar modal, vaciar carrito y avisar
        const modalCobro = document.getElementById('modal-cobro');
        if(modalCobro) modalCobro.classList.add('oculto');
        
        carrito = [];
        actualizarInterfazCarrito();
        mostrarAlertaExito('¡Venta registrada exitosamente!');
    }

    // Botones de confirmar
    document.getElementById('btn-confirmar-efectivo').addEventListener('click', () => {
        const monto = parseFloat(inputMonto.value) || 0;
        if (monto >= totalCaja) finalizarVenta();
        else mostrarAlertaError('El monto recibido es insuficiente');
    });

    document.getElementById('btn-confirmar-qr').addEventListener('click', finalizarVenta);
});