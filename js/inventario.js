import { mostrarAlertaExito } from './interfaz.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. BASE DE DATOS SIMULADA
    let inventario = JSON.parse(localStorage.getItem('baseDatosInventario')) || [
        { codigo: '123456789', nombre: 'Leche', precio: 10.00, stock: 50, minimo: 10, caducidad: '2026-08-14' },
        { codigo: '12345678', nombre: 'Pan', precio: 2.00, stock: 7, minimo: 20, caducidad: '2026-06-20' }
    ];

    const cuerpoTabla = document.getElementById('cuerpo-tabla-inventario');
    const inputBuscador = document.getElementById('buscador-productos');

    // Elementos de los Modales
    const modalCrear = document.getElementById('modal-producto');
    const modalEditar = document.getElementById('modal-editar');
    const modalEliminar = document.getElementById('modal-eliminar');
    
    // Variable para recordar qué producto estamos modificando/borrando
    let codigoProductoActivo = null; 

    // 2. FUNCIÓN PARA PINTAR LA TABLA
    function renderizarTabla(listaProductos) {
        cuerpoTabla.innerHTML = ''; 

        listaProductos.forEach(producto => {
            const fila = document.createElement('tr');
            
            if (producto.stock <= producto.minimo) {
                fila.classList.add('fila-peligro');
            }

            // Agregamos data-codigo a los botones para saber a quién pertenecen
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

    // 3. BUSCADOR (Solo por nombre)
    inputBuscador.addEventListener('input', (evento) => {
        const textoBuscado = evento.target.value.toLowerCase();
        const productosFiltrados = inventario.filter(producto => 
            producto.nombre.toLowerCase().includes(textoBuscado)
        );
        renderizarTabla(productosFiltrados);
    });

    // ==========================================
    // 4. LÓGICA: CREAR PRODUCTO
    // ==========================================
    const formCrear = document.getElementById('formulario-producto');
    const inputCodigoCrear = document.getElementById('input-codigo');

    document.getElementById('btn-abrir-modal').addEventListener('click', () => {
        modalCrear.classList.remove('oculto');
        setTimeout(() => inputCodigoCrear.focus(), 100);
    });

    document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
        modalCrear.classList.add('oculto');
    });

    inputCodigoCrear.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('input-nombre').focus(); }
    });

    formCrear.addEventListener('submit', (e) => {
        e.preventDefault();
        const nuevoProducto = {
            codigo: inputCodigoCrear.value,
            nombre: document.getElementById('input-nombre').value,
            precio: parseFloat(document.getElementById('input-precio').value),
            stock: parseInt(document.getElementById('input-stock').value),
            minimo: parseInt(document.getElementById('input-minimo').value),
            caducidad: document.getElementById('input-caducidad').value
        };
        inventario.push(nuevoProducto);
        guardarYRefrescar();
        modalCrear.classList.add('oculto');
        formCrear.reset();
        mostrarAlertaExito('Producto guardado correctamente');
    });


    // ==========================================
    // 5. ESCUCHAR CLICS EN LA TABLA (Editar / Borrar)
    // ==========================================
    cuerpoTabla.addEventListener('click', (evento) => {
        // Detectamos si hicieron clic en un botón de editar o borrar
        const btnEditar = evento.target.closest('.btn-editar');
        const btnBorrar = evento.target.closest('.btn-borrar');

        if (btnEditar) {
            codigoProductoActivo = btnEditar.getAttribute('data-codigo');
            abrirModalEditar(codigoProductoActivo);
        }

        if (btnBorrar) {
            codigoProductoActivo = btnBorrar.getAttribute('data-codigo');
            abrirModalEliminar(codigoProductoActivo);
        }
    });


    // ==========================================
    // 6. LÓGICA: EDITAR PRODUCTO
    // ==========================================
    const formEditar = document.getElementById('formulario-editar');

    function abrirModalEditar(codigo) {
        // Buscamos el producto en nuestro arreglo
        const producto = inventario.find(p => p.codigo === codigo);
        if (!producto) return;

        // Llenamos las cajitas del formulario con los datos actuales
        document.getElementById('edit-codigo-original').value = producto.codigo;
        document.getElementById('edit-codigo').value = producto.codigo;
        document.getElementById('edit-nombre').value = producto.nombre;
        document.getElementById('edit-precio').value = producto.precio;
        document.getElementById('edit-stock').value = producto.stock;
        document.getElementById('edit-minimo').value = producto.minimo;
        document.getElementById('edit-caducidad').value = producto.caducidad;

        modalEditar.classList.remove('oculto');
    }

    document.getElementById('btn-cerrar-editar').addEventListener('click', () => {
        modalEditar.classList.add('oculto');
    });

    formEditar.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Buscamos cuál era el producto original
        const codigoOriginal = document.getElementById('edit-codigo-original').value;
        const indice = inventario.findIndex(p => p.codigo === codigoOriginal);

        // Lo reemplazamos con los nuevos datos
        inventario[indice] = {
            codigo: document.getElementById('edit-codigo').value,
            nombre: document.getElementById('edit-nombre').value,
            precio: parseFloat(document.getElementById('edit-precio').value),
            stock: parseInt(document.getElementById('edit-stock').value),
            minimo: parseInt(document.getElementById('edit-minimo').value),
            caducidad: document.getElementById('edit-caducidad').value
        };

        guardarYRefrescar();
        modalEditar.classList.add('oculto');
        mostrarAlertaExito('Cambios guardados correctamente');
    });


    // ==========================================
    // 7. LÓGICA: ELIMINAR PRODUCTO
    // ==========================================
    function abrirModalEliminar(codigo) {
        const producto = inventario.find(p => p.codigo === codigo);
        if (!producto) return;

        // Personalizamos el texto para que diga el nombre exacto
        document.getElementById('texto-eliminar').innerText = `Se eliminará "${producto.nombre}" permanentemente.`;
        modalEliminar.classList.remove('oculto');
    }

    document.getElementById('btn-cancelar-eliminar').addEventListener('click', () => {
        modalEliminar.classList.add('oculto');
    });

    document.getElementById('btn-confirmar-eliminar').addEventListener('click', () => {
        // Filtramos el arreglo quitando el producto seleccionado
        inventario = inventario.filter(p => p.codigo !== codigoProductoActivo);
        
        guardarYRefrescar();
        modalEliminar.classList.add('oculto');
        mostrarAlertaExito('Producto eliminado');
    });


    // Función auxiliar para no repetir código
    function guardarYRefrescar() {
        localStorage.setItem('baseDatosInventario', JSON.stringify(inventario));
        // Borramos lo que haya en el buscador y repintamos toda la tabla
        inputBuscador.value = '';
        renderizarTabla(inventario);
    }
});