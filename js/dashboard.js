import { mostrarAlertaExito } from './interfaz.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // Mostramos bienvenida
    const nombreActual = localStorage.getItem('nombreUsuario') || '';
    mostrarAlertaExito(`¡Bienvenid@ al sistema, ${nombreActual}!`);

    // 1. LEER BASES DE DATOS LOCALES
    let inventario = JSON.parse(localStorage.getItem('baseDatosInventario')) || [];
    let ventas = JSON.parse(localStorage.getItem('baseDatosVentas')) || [];

    // 2. CÁLCULO DE KPIs DEL DÍA Y GANANCIAS
    const fechaHoy = new Date();
    const year = fechaHoy.getFullYear();
    const month = String(fechaHoy.getMonth() + 1).padStart(2, '0');
    const day = String(fechaHoy.getDate()).padStart(2, '0');
    const hoyString = `${year}-${month}-${day}`; 

    let ingresosHoy = 0;
    let costosHoy = 0;
    let cantidadVentasHoy = 0;

    ventas.forEach(venta => {
        if (venta.fecha === hoyString) {
            ingresosHoy += venta.total;
            cantidadVentasHoy++;
            
            // Sumamos cuánto nos costó la mercadería que vendimos hoy
            venta.productos.forEach(item => {
                // Multiplicamos el costo unitario por la cantidad que se llevó el cliente
                costosHoy += (item.costo || 0) * item.cantidad; 
            });
        }
    });

    // La matemática del éxito: Ingresos - Costos = Ganancia Neta
    const gananciaHoy = ingresosHoy - costosHoy;

    // 3. PRODUCTOS CON STOCK BAJO
    const productosStockBajo = inventario.filter(p => p.stock <= p.minimo).length;

    // Pintamos los 4 cuadros (Usando los IDs que pusimos en el HTML)
    document.getElementById('kpi-ingreso').innerText = `Bs. ${ingresosHoy.toFixed(2)}`;
    document.getElementById('kpi-ganancia').innerText = `Bs. ${gananciaHoy.toFixed(2)}`;
    document.getElementById('kpi-ventas').innerText = cantidadVentasHoy;
    document.getElementById('kpi-alertas').innerText = productosStockBajo;

    // 4. TOP 5 PRODUCTOS MÁS VENDIDOS
    let conteoVentas = {};
    ventas.forEach(venta => {
        venta.productos.forEach(item => {
            if (!conteoVentas[item.nombre]) {
                conteoVentas[item.nombre] = { unidades: 0, total: 0 };
            }
            conteoVentas[item.nombre].unidades += item.cantidad;
            conteoVentas[item.nombre].total += item.subtotal;
        });
    });

    // Convertimos, ordenamos de mayor a menor ventas y cortamos los 5 primeros
    const top5 = Object.entries(conteoVentas)
        .map(([nombre, datos]) => ({ nombre, ...datos }))
        .sort((a, b) => b.unidades - a.unidades)
        .slice(0, 5);

    const cuerpoTablaTop = document.getElementById('tabla-top-productos');
    cuerpoTablaTop.innerHTML = ''; 

    if (top5.length === 0) {
        cuerpoTablaTop.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#64748b;">Aún no hay ventas registradas</td></tr>';
    } else {
        top5.forEach(producto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td style="font-weight: 500;">${producto.nombre}</td>
                <td>${producto.unidades}</td>
                <td style="color: #16a34a;">Bs. ${producto.total.toFixed(2)}</td>
            `;
            cuerpoTablaTop.appendChild(fila);
        });
    }

    // 5. PRÓXIMOS A VENCER (15 DÍAS)
    // Calculamos qué día será exactamente dentro de 15 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaHoy.getDate() + 15);

    const proximosVencer = inventario.filter(p => {
        if (!p.caducidad) return false;
        
        // Convertimos la fecha de caducidad del producto a un objeto Date real
        const partesFecha = p.caducidad.split('-');
        const fechaCaducidad = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);
        
        // Verificamos si cae entre hoy y dentro de 15 días
        return fechaCaducidad >= fechaHoy && fechaCaducidad <= fechaLimite;
    });

    const cuerpoTablaVencimientos = document.getElementById('tabla-vencimientos');
    cuerpoTablaVencimientos.innerHTML = '';

    if (proximosVencer.length === 0) {
        cuerpoTablaVencimientos.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#64748b;">Ningún producto próximo a vencer</td></tr>';
    } else {
        proximosVencer.forEach(producto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td style="font-weight: 500;">${producto.nombre}</td>
                <td style="color: #ef4444; font-weight: bold;">${producto.caducidad}</td>
                <td>${producto.stock}</td>
            `;
            cuerpoTablaVencimientos.appendChild(fila);
        });
    }

    // 6. PANEL PREDICTIVO MATEMÁTICO (S(t) = s0 - kt)
    const cuerpoTablaPredictiva = document.getElementById('tabla-predictiva');
    cuerpoTablaPredictiva.innerHTML = '';

    inventario.forEach(producto => {
        // Obtenemos cuánto se ha vendido de este producto en toda la historia
        let totalVendidoHistorico = 0;
        if(conteoVentas[producto.nombre]) {
            totalVendidoHistorico = conteoVentas[producto.nombre].unidades;
        }

        // Para nuestro prototipo, estimamos 'k' asumiendo que el histórico se dio en los últimos 7 días.
        let kDiario = totalVendidoHistorico > 0 ? (totalVendidoHistorico / 7) : 0;
        
        // Aplicamos la fórmula: Días = Stock Actual / Tasa de consumo
        let diasRestantes = kDiario > 0 ? Math.floor(producto.stock / kDiario) : 'Sin datos';

        const fila = document.createElement('tr');
        
        let etiquetaDias = '';
        if (diasRestantes === 'Sin datos') {
            etiquetaDias = `<span class="etiqueta-gris">Sin ventas aún</span>`;
        } else if (diasRestantes <= 3) {
            etiquetaDias = `<span class="etiqueta-roja">${diasRestantes} días</span>`; // Peligro inminente
        } else {
            etiquetaDias = `<span class="etiqueta-gris" style="background:#f0fdf4; color:#16a34a; font-weight:bold;">${diasRestantes} días</span>`; // Todo bien
        }

        fila.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.stock}</td>
            <td>${kDiario > 0 ? kDiario.toFixed(2) : '0.00'}</td>
            <td>${etiquetaDias}</td>
            <td>
                <button class="btn-secundario btn-grafica" 
                    data-nombre="${producto.nombre}" 
                    data-stock="${producto.stock}" 
                    data-k="${kDiario}" 
                    style="padding: 0.25rem 0.5rem; font-size: 0.8rem; border-color: #0f172a; color: #0f172a;">
                    📊 Gráfica
                </button>
            </td>
        `;
        cuerpoTablaPredictiva.appendChild(fila);
    });

    // ==========================================
    // NUEVO: MOTOR DE GRÁFICAS (CHART.JS)
    // ==========================================
    const modalGrafica = document.getElementById('modal-grafica');
    const ctxCanvas = document.getElementById('lienzo-grafica').getContext('2d');
    let graficoInstancia = null; // Guardará la gráfica actual para poder borrarla al cambiar de producto

    cuerpoTablaPredictiva.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-grafica');
        if (btn) {
            const nombre = btn.getAttribute('data-nombre');
            const s0 = parseFloat(btn.getAttribute('data-stock')); // Stock Inicial
            const k = parseFloat(btn.getAttribute('data-k')); // Tasa de consumo
            
            dibujarGrafica(nombre, s0, k);
        }
    });

    document.getElementById('btn-cerrar-grafica').addEventListener('click', () => {
        modalGrafica.classList.add('oculto');
    });

    function dibujarGrafica(nombre, s0, k) {
        document.getElementById('titulo-grafica').innerText = `Proyección: ${nombre}`;
        modalGrafica.classList.remove('oculto');

        // Si ya había una gráfica dibujada antes, la destruimos
        if (graficoInstancia) {
            graficoInstancia.destroy();
        }

        let ejeX_Dias = [];
        let ejeY_Stock = [];

        // ==========================================
        // NUEVO: TRADUCTOR DE DÍAS REALES
        // ==========================================
        const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const fechaActual = new Date(); // Toma la fecha local de tu equipo

        function obtenerEtiquetaDia(diasASumar) {
            const fechaFutura = new Date(fechaActual);
            fechaFutura.setDate(fechaActual.getDate() + diasASumar);
            
            const nombreDia = nombresDias[fechaFutura.getDay()];
            const numeroMes = fechaFutura.getDate();
            
            if (diasASumar === 0) return `Hoy (${nombreDia} ${numeroMes})`;
            if (diasASumar === 1) return `Mañana (${nombreDia} ${numeroMes})`;
            return `${nombreDia} ${numeroMes}`;
        }

        // Generamos los puntos de la recta evaluando S(t) = s0 - kt
        if (k <= 0) {
            // Si no hay ventas, la recta es constante
            ejeX_Dias = [obtenerEtiquetaDia(0), obtenerEtiquetaDia(7), obtenerEtiquetaDia(14), obtenerEtiquetaDia(30)];
            ejeY_Stock = [s0, s0, s0, s0];
        } else {
            // Calculamos hasta que llegue a 0
            let diasTotales = Math.ceil(s0 / k);
            let paso = Math.max(1, Math.floor(diasTotales / 5)); 

            for (let t = 0; t <= diasTotales; t += paso) {
                ejeX_Dias.push(obtenerEtiquetaDia(t));
                let s_t = s0 - (k * t);
                ejeY_Stock.push(Math.max(0, s_t)); 
            }
            
            // Aseguramos que el último punto toque exactamente el 0 (El día que se agota)
            const etiquetaFinal = obtenerEtiquetaDia(diasTotales);
            if (ejeX_Dias[ejeX_Dias.length - 1] !== etiquetaFinal) {
                ejeX_Dias.push(etiquetaFinal);
                ejeY_Stock.push(0);
            }
        }

        // Configuración de Chart.js
        graficoInstancia = new Chart(ctxCanvas, {
            type: 'line',
            data: {
                labels: ejeX_Dias,
                datasets: [{
                    label: 'Nivel de Stock S(t)',
                    data: ejeY_Stock,
                    borderColor: '#ef4444', 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    borderWidth: 3,
                    fill: true,
                    tension: 0.1, 
                    pointBackgroundColor: '#0f172a',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Unidades Físicas (Stock)' }
                    },
                    x: { 
                        title: { display: true, text: 'Fecha Estimada' }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Stock proyectado: ${context.parsed.y.toFixed(2)} unidades`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 7. BOTÓN CERRAR SESIÓN
    const btnCerrar = document.getElementById('btn-cerrar-sesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            localStorage.removeItem('rolUsuario');
            localStorage.removeItem('nombreUsuario');
            window.location.href = 'index.html';
        });
    }
});