import { mostrarAlertaExito } from './interfaz.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Mostrar mensaje de Bienvenida simulando que venimos del Login
    mostrarAlertaExito('¡Bienvenid@ al sistema!');

    // 2. SIMULADOR DE DATOS (Como si vinieran de MySQL)
    const ventasTop = [
        { nombre: 'Pan', unidades: 96, total: 'Bs. 192.00' }
    ];

    const datosPredictivos = [
        { nombre: 'Pan', stockActual: 7, kDiario: 2.86 }
    ];

    // 3. Pintar la tabla de Top Productos
    const cuerpoTablaTop = document.getElementById('tabla-top-productos');
    ventasTop.forEach(producto => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.unidades}</td>
            <td>${producto.total}</td>
        `;
        cuerpoTablaTop.appendChild(fila);
    });

    // 4. Pintar el Panel Predictivo (Matemática pura)
    const cuerpoTablaPredictiva = document.getElementById('tabla-predictiva');
    datosPredictivos.forEach(producto => {
        
        // Aplicamos la fórmula matemática: Días = Stock / tasa de venta
        let diasRestantes = Math.floor(producto.stockActual / producto.kDiario);

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.stockActual}</td>
            <td>${producto.kDiario}</td>
            <td><span class="etiqueta-roja">${diasRestantes} días</span></td>
        `;
        cuerpoTablaPredictiva.appendChild(fila);
    });

    // 5. Botón de Cerrar Sesión
    document.getElementById('btn-cerrar-sesion').addEventListener('click', () => {
        // En la vida real, aquí limpiaríamos el LocalStorage
        window.location.href = 'index.html'; // Volvemos al login
    });
});