import { mostrarAlertaExito, mostrarAlertaError } from './interfaz.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. BASE DE DATOS SIMULADA
    let inventario = JSON.parse(localStorage.getItem('baseDatosInventario')) || [];

    const cuerpoTabla = document.getElementById('cuerpo-tabla-inventario');
    const inputBuscador = document.getElementById('buscador-productos');
    const modalCrear = document.getElementById('modal-producto');
    const modalEditar = document.getElementById('modal-editar');
    const modalEliminar = document.getElementById('modal-eliminar');
    let codigoProductoActivo = null; 

    // 2. RENDERIZAR TABLA
    function renderizarTabla(listaProductos) {
        cuerpoTabla.innerHTML = ''; 
        listaProductos.forEach(producto => {
            const fila = document.createElement('tr');
            if (producto.stock <= producto.minimo) fila.classList.add('fila-peligro');
            fila.innerHTML = `
                <td>${producto.codigo}</td>
                <td>${producto.stock <= producto.minimo ? '⚠️ ' : ''}${producto.nombre}</td>
                <td>Bs. ${producto.precio.toFixed(2)}</td>
                <td>${producto.stock}</td>
                <td>${producto.minimo}</td>
                <td>${producto.caducidad}</td>
                <td>
                    <button class="btn-accion btn-editar" data-codigo="${producto.codigo}">✏️</button>
                    <button class="btn-accion btn-borrar" data-codigo="${producto.codigo}" style="color: red;">🗑️</button>
                </td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    }
    renderizarTabla(inventario);

    // 3. BUSCADOR
    inputBuscador.addEventListener('input', (e) => {
        const textoBuscado = e.target.value.toLowerCase();
        const filtrados = inventario.filter(p => p.nombre.toLowerCase().includes(textoBuscado));
        renderizarTabla(filtrados);
    });

    // ==========================================
    // 4. LÓGICA DEL ESCÁNER DE CÁMARA
    // ==========================================
    const btnEscanear = document.getElementById('btn-escanear');
    const lectorCamara = document.getElementById('lector-camara');
    let escannerHtml5;

    if (btnEscanear) {
        btnEscanear.addEventListener('click', () => {
            if (lectorCamara.style.display === 'block') {
                if (escannerHtml5) escannerHtml5.stop().then(() => lectorCamara.style.display = 'none');
            } else {
                lectorCamara.style.display = 'block';
                escannerHtml5 = new Html5Qrcode("lector-camara");
                escannerHtml5.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 100 } },
                    (codigo) => {
                        document.getElementById('input-codigo').value = codigo;
                        escannerHtml5.stop().then(() => {
                            lectorCamara.style.display = 'none';
                            document.getElementById('input-nombre').focus();
                        });
                        mostrarAlertaExito('Código escaneado');
                    },
                    (error) => {} 
                ).catch(() => {
                    mostrarAlertaError('No se pudo acceder a la cámara.');
                    lectorCamara.style.display = 'none';
                });
            }
        });
    }

    // ==========================================
    // 5. INTELIGENCIA DE PRECIOS Y GANANCIAS
    // ==========================================
    const inputCostoTotal = document.getElementById('input-costo-total');
    const inputStock = document.getElementById('input-stock');
    const inputPrecio = document.getElementById('input-precio');
    const textoCostoUnit = document.getElementById('info-costo-unitario');
    const textoMargen = document.getElementById('sugerencia-margen');

    // Función que divide la factura y sugiere el 33%
    function procesarFactura() {
        const costoTotal = parseFloat(inputCostoTotal.value) || 0;
        const stock = parseInt(inputStock.value) || 0;

        if (costoTotal > 0 && stock > 0) {
            const costoUnitario = costoTotal / stock;
            textoCostoUnit.innerText = `Costo unitario interno: Bs. ${costoUnitario.toFixed(2)}`;

            // Sugerimos precio multiplicando el costo por 1.33 (33% de ganancia)
            const precioSugerido = costoUnitario * 1.33; 
            inputPrecio.value = precioSugerido.toFixed(2);
            
            evaluarMargenManual(); // Pintamos el texto verde
        } else {
            textoCostoUnit.innerText = 'Costo unitario interno: Bs. 0.00';
            textoMargen.innerText = '';
        }
    }

    // Función por si el usuario borra la sugerencia y pone su propio precio
    function evaluarMargenManual() {
        const costoTotal = parseFloat(inputCostoTotal.value) || 0;
        const stock = parseInt(inputStock.value) || 0;
        const precioVenta = parseFloat(inputPrecio.value) || 0;

        if (costoTotal > 0 && stock > 0 && precioVenta > 0) {
            const costoUnitario = costoTotal / stock;
            if (precioVenta > costoUnitario) {
                const ganancia = precioVenta - costoUnitario;
                const margen = (ganancia / precioVenta) * 100;
                textoMargen.innerText = `Ganancia: Bs. ${ganancia.toFixed(2)} | Margen: ${margen.toFixed(1)}%`;
                textoMargen.style.color = '#16a34a';
            } else {
                textoMargen.innerText = `¡Peligro! Pierdes dinero. Costo base: Bs. ${costoUnitario.toFixed(2)}`;
                textoMargen.style.color = '#ef4444';
            }
        }
    }

    // Escuchamos cuando el usuario escribe
    inputCostoTotal.addEventListener('input', procesarFactura);
    inputStock.addEventListener('input', procesarFactura);
    inputPrecio.addEventListener('input', evaluarMargenManual);


    // ==========================================
    // 6. CREAR PRODUCTO
    // ==========================================
    const formCrear = document.getElementById('formulario-producto');

    document.getElementById('btn-abrir-modal').addEventListener('click', () => {
        modalCrear.classList.remove('oculto');
        setTimeout(() => document.getElementById('input-codigo').focus(), 100);
    });

    document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
        modalCrear.classList.add('oculto');
    });

    formCrear.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const codigoNuevo = document.getElementById('input-codigo').value.trim();
        const nombreNuevo = document.getElementById('input-nombre').value.trim();

        // Candado de Duplicados
        const productoDuplicado = inventario.find(p => p.codigo === codigoNuevo || p.nombre.toLowerCase() === nombreNuevo.toLowerCase());
        if (productoDuplicado) {
            mostrarAlertaError('Ese código o nombre de producto ya existe.');
            return; 
        }

        const costoTotal = parseFloat(inputCostoTotal.value);
        const stock = parseInt(inputStock.value);
        const costoUnitario = costoTotal / stock; // Lo que guardamos en la Base de Datos
        const precio = parseFloat(inputPrecio.value);

        if (precio <= costoUnitario) {
            mostrarAlertaError('El precio de venta debe ser mayor al costo.');
            return;
        }

        inventario.push({
            codigo: codigoNuevo,
            nombre: nombreNuevo,
            costo: costoUnitario, // Guardamos el costo por unidad
            precio: precio,
            stock: stock,
            minimo: parseInt(document.getElementById('input-minimo').value),
            caducidad: document.getElementById('input-caducidad').value
        });
        
        guardarYRefrescar();
        modalCrear.classList.add('oculto');
        formCrear.reset();
        textoCostoUnit.innerText = 'Costo unitario interno: Bs. 0.00';
        textoMargen.innerText = '';
        mostrarAlertaExito('Producto guardado correctamente');
    });

    // ==========================================
    // LÓGICA DE EDITAR Y BORRAR (Sin cambios grandes)
    // ==========================================
    cuerpoTabla.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.btn-editar');
        const btnBorrar = e.target.closest('.btn-borrar');
        if (btnEditar) abrirModalEditar(btnEditar.getAttribute('data-codigo'));
        if (btnBorrar) abrirModalEliminar(btnBorrar.getAttribute('data-codigo'));
    });

    const formEditar = document.getElementById('formulario-editar');
    function abrirModalEditar(codigo) {
        const p = inventario.find(x => x.codigo === codigo);
        if (!p) return;
        document.getElementById('edit-codigo-original').value = p.codigo;
        document.getElementById('edit-codigo').value = p.codigo;
        document.getElementById('edit-nombre').value = p.nombre;
        document.getElementById('edit-costo').value = p.costo;
        document.getElementById('edit-precio').value = p.precio;
        document.getElementById('edit-stock').value = p.stock;
        document.getElementById('edit-minimo').value = p.minimo;
        document.getElementById('edit-caducidad').value = p.caducidad;
        modalEditar.classList.remove('oculto');
    }

    document.getElementById('btn-cerrar-editar').addEventListener('click', () => modalEditar.classList.add('oculto'));

    formEditar.addEventListener('submit', (e) => {
        e.preventDefault();
        const codigoOriginal = document.getElementById('edit-codigo-original').value;
        const indice = inventario.findIndex(p => p.codigo === codigoOriginal);
        
        inventario[indice] = {
            codigo: document.getElementById('edit-codigo').value,
            nombre: document.getElementById('edit-nombre').value,
            costo: parseFloat(document.getElementById('edit-costo').value),
            precio: parseFloat(document.getElementById('edit-precio').value),
            stock: parseInt(document.getElementById('edit-stock').value),
            minimo: parseInt(document.getElementById('edit-minimo').value),
            caducidad: document.getElementById('edit-caducidad').value
        };
        guardarYRefrescar();
        modalEditar.classList.add('oculto');
        mostrarAlertaExito('Cambios guardados');
    });

    function abrirModalEliminar(codigo) {
        codigoProductoActivo = codigo;
        modalEliminar.classList.remove('oculto');
    }

    document.getElementById('btn-cancelar-eliminar').addEventListener('click', () => modalEliminar.classList.add('oculto'));
    document.getElementById('btn-confirmar-eliminar').addEventListener('click', () => {
        inventario = inventario.filter(p => p.codigo !== codigoProductoActivo);
        guardarYRefrescar();
        modalEliminar.classList.add('oculto');
        mostrarAlertaExito('Producto eliminado');
    });

    function guardarYRefrescar() {
        localStorage.setItem('baseDatosInventario', JSON.stringify(inventario));
        inputBuscador.value = '';
        renderizarTabla(inventario);
    }
});