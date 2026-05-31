// Función para alerta de error (Roja)
export function mostrarAlertaError(mensajeTexto) {
    // Le pasamos: Mensaje, Color de Fondo, Color de Texto, Color de Borde
    crearToast(mensajeTexto, '#fef2f2', '#ef4444', '#fecaca');
}

// Función para alerta de éxito (Verde)
export function mostrarAlertaExito(mensajeTexto) {
    // Le pasamos: Mensaje, Color de Fondo, Color de Texto, Color de Borde
    crearToast(mensajeTexto, '#f0fdf4', '#16a34a', '#bbf7d0');
}

// Función central ultra simplificada (sin iconos)
function crearToast(mensaje, colorFondo, colorTexto, colorBorde) {
    const contenedor = document.getElementById('contenedor-alertas');
    if (!contenedor) return; // Si no encuentra dónde ponerlo, no hace nada

    // 1. Creamos la cajita (div)
    const alerta = document.createElement('div');
    
    // 2. Le damos estilos muy básicos y limpios directamente aquí
    alerta.style.backgroundColor = colorFondo;
    alerta.style.color = colorTexto;
    alerta.style.border = `1px solid ${colorBorde}`;
    alerta.style.padding = '0.75rem 1.5rem';
    alerta.style.borderRadius = '0.5rem';
    alerta.style.fontWeight = '500'; // Texto un poco negrita
    alerta.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
    alerta.style.marginBottom = '1rem';
    alerta.style.textAlign = 'center'; // Centramos el texto

    // 3. Le ponemos solo el texto limpio
    alerta.innerText = mensaje;

    // 4. Lo mostramos en pantalla
    contenedor.appendChild(alerta);

    // 5. Lo borramos automáticamente después de 3 segundos (3000 ms)
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}