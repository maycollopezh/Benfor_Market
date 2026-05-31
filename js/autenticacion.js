// Importamos la función de la alerta roja
import { mostrarAlertaError } from './interfaz.js';

// Esperamos a que todo el HTML cargue antes de hacer nada
document.addEventListener('DOMContentLoaded', () => {
    
    const formularioLogin = document.getElementById('formulario-login');

    // Cuando el usuario hace clic en "Entrar"
    formularioLogin.addEventListener('submit', (evento) => {
        
        // Esto evita que la página parpadee o se recargue sola
        evento.preventDefault(); 

        // Atrapamos lo que el usuario escribió en las cajas de texto
        const correoIngresado = document.getElementById('correo').value;
        const contrasenaIngresada = document.getElementById('contrasena').value;

        // --- SIMULADOR DE BASE DE DATOS ---
        
        // Caso 1: Administrador (Ve todo)
        if (correoIngresado === 'admin@benformarket.com' && contrasenaIngresada === '123456') {
            localStorage.setItem('rolUsuario', 'Administrador');
            localStorage.setItem('nombreUsuario', 'Maycol');
            window.location.href = 'dashboard.html'; 
        } 
        
        // Caso 2: Cajero (Solo ve Caja)
        else if (correoIngresado === 'caja@benformarket.com' && contrasenaIngresada === '123456') {
            localStorage.setItem('rolUsuario', 'Cajero');
            localStorage.setItem('nombreUsuario', 'Juan Perez');
            window.location.href = 'caja.html'; 
        } 

        // Caso 3: Encargado de Almacén (Solo ve Inventario)
        else if (correoIngresado === 'almacen@benformarket.com' && contrasenaIngresada === '123456') {
            localStorage.setItem('rolUsuario', 'Encargado de Almacén');
            localStorage.setItem('nombreUsuario', 'Ana Lopez');
            window.location.href = 'inventario.html'; 
        } 
        
        // Caso 4: Se equivocó de correo o contraseña
        else {
            mostrarAlertaError('Credenciales inválidas');
        }
    });
});