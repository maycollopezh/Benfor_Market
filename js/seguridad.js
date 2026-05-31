document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Preguntamos quién está usando el sistema ahora mismo
    const rolActual = localStorage.getItem('rolUsuario');
    const nombreActual = localStorage.getItem('nombreUsuario');

    // Si nadie inició sesión (intentaron saltarse el login), los botamos al index
    if (!rolActual) {
        window.location.href = 'index.html';
        return; // Detenemos cualquier otra acción
    }

    // 2. Pintamos su nombre y rol en la barra lateral
    const textoNombre = document.querySelector('.nombre-usuario');
    const textoRol = document.querySelector('.rol-usuario');
    if (textoNombre) textoNombre.innerText = nombreActual;
    if (textoRol) textoRol.innerText = rolActual;

    // 3. Averiguamos en qué página estamos parados actualmente
    const paginaActual = window.location.pathname.split('/').pop();

    // Referencias a los botones del menú lateral
    const linkDashboard = document.getElementById('link-dashboard');
    const linkInventario = document.getElementById('link-inventario');
    const linkCaja = document.getElementById('link-caja');

    // ==========================================
    // 4. LÓGICA DE RESTRICCIÓN DE PANTALLAS
    // ==========================================

    if (rolActual === 'Cajero') {
        // Le ocultamos visualmente las otras opciones del menú
        if (linkDashboard) linkDashboard.style.display = 'none';
        if (linkInventario) linkInventario.style.display = 'none';
        
        // Si el cajero es curioso e intenta escribir "dashboard.html" en la URL:
        if (paginaActual !== 'caja.html') {
            window.location.href = 'caja.html'; // Lo regresamos a la caja a la fuerza
        }
    } 
    else if (rolActual === 'Encargado de Almacén') {
        // Le ocultamos visualmente el Dashboard y la Caja
        if (linkDashboard) linkDashboard.style.display = 'none';
        if (linkCaja) linkCaja.style.display = 'none';

        // Si intenta entrar a otra página que no sea su inventario:
        if (paginaActual !== 'inventario.html') {
            window.location.href = 'inventario.html'; 
        }
    }
    // Si es Administrador, no hacemos nada de restricciones porque tiene permiso total.


    // ==========================================
    // 5. FUNCIÓN GLOBAL PARA CERRAR SESIÓN
    // ==========================================
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            // Borramos su información de la memoria
            localStorage.removeItem('rolUsuario');
            localStorage.removeItem('nombreUsuario');
            // Lo mandamos al Login
            window.location.href = 'index.html';
        });
    }
});