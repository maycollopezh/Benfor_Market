import { mostrarAlertaExito } from './interfaz.js';
import { supabase } from './conexion.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // Mostramos bienvenida
    const nombreActual = localStorage.getItem('nombreUsuario') || '';
    mostrarAlertaExito(`¡Bienvenid@ al sistema, ${nombreActual}!`);

    let inventario = [];
    let ventas = [];

    // 1. LEER BASES DE DATOS DESDE SUPABASE
    async function cargarDatosDashboard() {
        // Cargar productos
        const { data: dataProductos } = await supabase.from('productos').select('*');
        if (dataProductos) inventario = dataProductos;

        // Cargar ventas con su detalle usando el poder relacional de Supabase
        const { data: dataVentas } = await supabase.from('ventas').select(`
            id,
            fecha,
            total,
            metodo_pago,
            detalle_ventas (
                nombre_producto,
                cantidad,
                costo_historico,
                subtotal
            )
        `);

        if (dataVentas) {
            // Adaptamos la respuesta de Supabase a la estructura exacta que tu lógica ya usaba
            ventas = dataVentas.map(venta => ({
                fecha: venta.fecha,
                total: parseFloat(venta.total),
                productos: venta.detalle_ventas.map(detalle => ({
                    nombre: detalle.nombre_producto,
                    cantidad: detalle.cantidad,
                    costo: parseFloat(detalle.costo_historico),
                    subtotal: parseFloat(detalle.subtotal)
                }))
            }));
        }

        // Ejecutamos tu lógica matemática
        calcularKpisYGraficas();
    }

    // Iniciamos la carga
    await cargarDatosDashboard();


    // ==========================================
    // 2. LÓGICA MATEMÁTICA
    // ==========================================
    function calcularKpisYGraficas() {
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
                
                venta.productos.forEach(item => {
                    costosHoy += (item.costo || 0) * item.cantidad; 
                });
            }
        });

        const gananciaHoy = ingresosHoy - costosHoy;

        // PRODUCTOS CON STOCK BAJO
        const productosStockBajo = inventario.filter(p => p.stock <= p.minimo).length;

        // Pintamos los 4 cuadros
        document.getElementById('kpi-ingreso').innerText = `Bs. ${ingresosHoy.toFixed(2)}`;
        document.getElementById('kpi-ganancia').innerText = `Bs. ${gananciaHoy.toFixed(2)}`;
        document.getElementById('kpi-ventas').innerText = cantidadVentasHoy;
        document.getElementById('kpi-alertas').innerText = productosStockBajo;

        // TOP 5 PRODUCTOS MÁS VENDIDOS
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

        // PRÓXIMOS A VENCER (15 DÍAS)
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaHoy.getDate() + 15);

        const proximosVencer = inventario.filter(p => {
            if (!p.caducidad) return false;
            
            const partesFecha = p.caducidad.split('-');
            const fechaCaducidad = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);
            
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


    //TODO PANEL PREDICTIVO MATEMÁTICO
    
        const cuerpoTablaPredictiva = document.getElementById('tabla-predictiva');
        cuerpoTablaPredictiva.innerHTML = '';

        // Cálculo de la constante K
        inventario.forEach(producto => {
            // 1. Obtener la sumatoria de ventas históricas del producto evaluado
            let totalVendidoHistorico = 0;
            if(conteoVentas[producto.nombre]) {
                totalVendidoHistorico = conteoVentas[producto.nombre].unidades;
            }

            // 2. CÁLCULO DE 'k': Tasa de consumo diario promedio
            // Si hay historial, k = Total Vendido / 7 días. Si no hay ventas, k = 0.
            let kDiario = totalVendidoHistorico > 0 ? (totalVendidoHistorico / 7) : 0;

            // 3. DESPEJE DE 't': Cálculo de días restantes de abastecimiento
            // Fórmula aplicada: t = S_0 / k
            let diasRestantes = kDiario > 0 ? Math.floor(producto.stock / kDiario) : 'Sin datos';

            const fila = document.createElement('tr');
            
            // 4. Lógica de Alertas Visuales (Semáforo de Desabastecimiento)
            let etiquetaDias = '';
            if (diasRestantes === 'Sin datos') {
                etiquetaDias = `<span class="etiqueta-gris">Sin ventas aún</span>`;
            } else if (diasRestantes <= 3) {

                // Alerta roja: El desabastecimiento (S(t) -> 0) ocurrirá en t <= 3
                etiquetaDias = `<span class="etiqueta-roja">${diasRestantes} días</span>`; 
            } else {

                // Estado óptimo
                etiquetaDias = `<span class="etiqueta-gris" style="background:#f0fdf4; color:#16a34a; font-weight:bold;">${diasRestantes} días</span>`;
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
    }

    // ==========================================
    // MOTOR DE GRÁFICAS (CHART.JS)
    // ==========================================
    const modalGrafica = document.getElementById('modal-grafica');
    const ctxCanvas = document.getElementById('lienzo-grafica').getContext('2d');
    let graficoInstancia = null; 

    document.getElementById('tabla-predictiva').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-grafica');
        if (btn) {
            const nombre = btn.getAttribute('data-nombre');
            const s0 = parseFloat(btn.getAttribute('data-stock')); 
            const k = parseFloat(btn.getAttribute('data-k')); 
            
            dibujarGrafica(nombre, s0, k);
        }
    });

    document.getElementById('btn-cerrar-grafica').addEventListener('click', () => {
        modalGrafica.classList.add('oculto');
    });

    function dibujarGrafica(nombre, s0, k) {
        document.getElementById('titulo-grafica').innerText = `Proyección: ${nombre}`;
        modalGrafica.classList.remove('oculto');

        if (graficoInstancia) {
            graficoInstancia.destroy();
        }


        let ejeX_Dias = [];  // Arreglo para la variable independiente (Tiempo 't')
        let ejeY_Stock = [];  // Arreglo para la variable dependiente (Nivel de Stock 'S')


        const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const fechaActual = new Date(); 

        function obtenerEtiquetaDia(diasASumar) {
            const fechaFutura = new Date(fechaActual);
            fechaFutura.setDate(fechaActual.getDate() + diasASumar);
            
            const nombreDia = nombresDias[fechaFutura.getDay()];
            const numeroMes = fechaFutura.getDate();
            
            if (diasASumar === 0) return `Hoy (${nombreDia} ${numeroMes})`;
            if (diasASumar === 1) return `Mañana (${nombreDia} ${numeroMes})`;
            return `${nombreDia} ${numeroMes}`;
        }

        if (k <= 0) {

            // Comportamiento de una constante: No hay consumo, la recta es horizontal (Pendiente 0)
            ejeX_Dias = [obtenerEtiquetaDia(0), obtenerEtiquetaDia(7), obtenerEtiquetaDia(14), obtenerEtiquetaDia(30)];
            ejeY_Stock = [s0, s0, s0, s0];
        } else {

            // Despeje del tiempo total hasta el vaciado absoluto (S(t) = 0)
            let diasTotales = Math.ceil(s0 / k);
            let paso = Math.max(1, Math.floor(diasTotales / 5));   // Segmentación del eje X

             // BUCLE EVALUADOR: Evalúa la función S(t) = s_0 - kt en distintos puntos de 't'
            for (let t = 0; t <= diasTotales; t += paso) {
                ejeX_Dias.push(obtenerEtiquetaDia(t));

                // Aplicación directa del modelo matemático
                let s_t = s0 - (k * t);

                // Math.max(0, s_t) asegura que el gráfico no proyecte stocks negativos
                ejeY_Stock.push(Math.max(0, s_t)); 
            }
            
            // Cierre exacto en el eje X cuando el stock llega a 0
            const etiquetaFinal = obtenerEtiquetaDia(diasTotales);
            if (ejeX_Dias[ejeX_Dias.length - 1] !== etiquetaFinal) {
                ejeX_Dias.push(etiquetaFinal);
                ejeY_Stock.push(0);
            }
        }


        // Configuración de instancia Chart.js para dibujar la proyección
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