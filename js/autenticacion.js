// Importamos la función de la alerta roja y la conexión a Supabase
import { mostrarAlertaError } from './interfaz.js';
import { supabase } from './conexion.js';

// Esperamos a que todo el HTML cargue antes de hacer nada
document.addEventListener('DOMContentLoaded', () => {
    
    const formularioLogin = document.getElementById('formulario-login');

    // Cuando el usuario hace clic en "Entrar" (ahora es una función asíncrona)
    formularioLogin.addEventListener('submit', async (evento) => {
        
        // Esto evita que la página parpadee o se recargue sola
        evento.preventDefault(); 

        // Atrapamos lo que el usuario escribió en las cajas de texto
        const correoIngresado = document.getElementById('correo').value;
        const contrasenaIngresada = document.getElementById('contrasena').value;

        try {
            // --- CONEXIÓN A LA BASE DE DATOS SUPABASE ---
            // Buscamos un usuario que coincida con el correo y la contraseña
            const { data: usuario, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('email', correoIngresado)
                .eq('password_hash', contrasenaIngresada)
                .single(); // .single() asegura que solo traiga un registro exacto

            // Si hay un error o no encontró al usuario
            if (error || !usuario) {
                mostrarAlertaError('Credenciales inválidas');
                return;
            }

            // Si el login es exitoso, guardamos la sesión en localStorage para seguridad.js
            localStorage.setItem('rolUsuario', usuario.rol);
            localStorage.setItem('nombreUsuario', usuario.nombre_completo);

            // Redirigimos según el rol que vino desde Supabase
            if (usuario.rol === 'Administrador') {
                window.location.href = 'dashboard.html'; 
            } else if (usuario.rol === 'Encargado de Caja') {
                window.location.href = 'caja.html'; 
            } else if (usuario.rol === 'Encargado de Almacén') {
                window.location.href = 'inventario.html'; 
            }

        } catch (error) {
            mostrarAlertaError('Error de conexión con el servidor');
            console.error(error);
        }
    });
});