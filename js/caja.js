import { mostrarAlertaExito, mostrarAlertaError } from './interfaz.js';
import { supabase } from './conexion.js';

document.addEventListener('DOMContentLoaded', async () => {

    // 1. CARGAMOS INVENTARIO DE SUPABASE
    let inventario = [];
    async function cargarInventarioCaja() {
        const { data, error } = await supabase.from('productos').select('*');
        if (!error && data) {
            inventario = data;
            document.getElementById('info-catalogo').innerText = `${inventario.length} en catálogo`;
        }
    }
    await cargarInventarioCaja();

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
                        inputBusqueda.value = codigo;
                        escannerCaja.stop().then(() => lectorCamaraCaja.style.display = 'none');
                        formAgregar.dispatchEvent(new Event('submit'));
                        mostrarAlertaExito('Producto escaneado');
                    },
                    (error) => {} 
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

        // Buscamos si existe por código_barras o por nombre
        const productoEncontrado = inventario.find(p => 
            p.codigo_barras === textoBuscado || p.nombre.toLowerCase() === textoBuscado
        );

        if (productoEncontrado) {
            const itemEnCarrito = carrito.find(item => item.codigo_barras === productoEncontrado.codigo_barras);

            if (itemEnCarrito) {
                if (itemEnCarrito.cantidad < productoEncontrado.stock) {
                    itemEnCarrito.cantidad++;
                } else {
                    mostrarAlertaError('No hay más stock disponible');
                }
            } else {
                if (productoEncontrado.stock > 0) {
                    carrito.push({
                        ...productoEncontrado, 
                        cantidad: 1            
                    });
                } else {
                    mostrarAlertaError('Producto agotado');
                }
            }
            inputBusqueda.value = ''; 
            actualizarInterfazCarrito();
        } else {
            mostrarAlertaError('Producto no encontrado');
        }
    });

    // 4. ACTUALIZAR INTERFAZ
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
                        <div style="font-size: 0.75rem; color: #64748b;">${item.codigo_barras}</div>
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

        document.getElementById('resumen-cantidad').innerText = totalProductos;
        document.getElementById('resumen-subtotal').innerText = `Bs. ${totalCaja.toFixed(2)}`;
        document.getElementById('resumen-total').innerText = `Bs. ${totalCaja.toFixed(2)}`;
    }

    // 5. ESCUCHAR CLICS DENTRO DEL CARRITO
    cuerpoCarrito.addEventListener('click', (e) => {
        const btnSumar = e.target.closest('.btn-sumar');
        const btnRestar = e.target.closest('.btn-restar');
        const btnQuitar = e.target.closest('.btn-quitar');

        if (btnSumar) {
            const index = btnSumar.getAttribute('data-index');
            const item = carrito[index];
            const prodInventario = inventario.find(p => p.codigo_barras === item.codigo_barras);
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
            carrito.splice(index, 1); 
            actualizarInterfazCarrito();
        }
    });

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
    const tabEfectivo = document.getElementById('tab-efectivo');
    const tabQr = document.getElementById('tab-qr');

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

    const vistaEfectivo = document.getElementById('vista-efectivo');
    const vistaQr = document.getElementById('vista-qr');

    tabEfectivo.addEventListener('click', () => {
        tabEfectivo.classList.add('activo');
        tabQr.classList.remove('activo');
        vistaEfectivo.classList.remove('oculto'); 
        vistaQr.classList.add('oculto');          
        inputMonto.focus(); 
    });

    tabQr.addEventListener('click', () => {
        tabQr.classList.add('activo');
        tabEfectivo.classList.remove('activo');
        vistaQr.classList.remove('oculto');       
        vistaEfectivo.classList.add('oculto');    
    });

    inputMonto.addEventListener('input', () => {
        const monto = parseFloat(inputMonto.value) || 0;
        const cambio = monto - totalCaja;
        if (cambio >= 0) {
            textoCambio.innerText = `Bs. ${cambio.toFixed(2)}`;
            textoCambio.style.color = '#16a34a';
        } else {
            textoCambio.innerText = 'Falta dinero';
            textoCambio.style.color = '#ef4444';
        }
    });

    // 7. CONFIRMAR LA VENTA (CONEXIÓN SUPABASE EN CASCADA)
    async function finalizarVenta() {
        const metodoSeleccionado = tabEfectivo.classList.contains('activo') ? 'Efectivo' : 'QR / Billetera';
        
        // 1. Guardar la Cabecera de la Venta
        const { data: ventaGuardada, error: errorVenta } = await supabase.from('ventas').insert([{
            total: totalCaja,
            metodo_pago: metodoSeleccionado
            // La fecha se pone sola en SQL con CURRENT_DATE
        }]).select();

        if (errorVenta || !ventaGuardada) {
            mostrarAlertaError('Error al registrar la transacción de venta');
            return;
        }

        const idVentaGenerado = ventaGuardada[0].id;

        // 2. Guardar Detalles y Descontar Stock producto por producto
        for (const item of carrito) {
            // Guardamos el historial del producto vendido
            await supabase.from('detalle_ventas').insert([{
                venta_id: idVentaGenerado,
                producto_id: item.id,
                nombre_producto: item.nombre,
                cantidad: item.cantidad,
                costo_historico: item.costo,
                subtotal: item.precio * item.cantidad
            }]);

            // Descontamos stock del producto en la Base de Datos
            const productoOriginal = inventario.find(p => p.codigo_barras === item.codigo_barras);
            const nuevoStock = productoOriginal.stock - item.cantidad;
            
            await supabase.from('productos').update({ stock: nuevoStock }).eq('id', item.id);
        }

        // Refrescamos inventario local para no permitir vender algo que ya se agotó en la BD
        await cargarInventarioCaja(); 

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