import {
	comprobarValidez,
	correoValido,
	habilitarBoton,
	deshabilitarBoton,
	comprobarInputs,
	crearMensajeError,
	borrarMensajeError
} from "./modules/auth.js";

const inputCorreo = document.getElementById("correo");
const inputPassw = document.getElementById("passw");
const btnLogin = document.getElementById("login-btn");

inputCorreo.addEventListener("change", (e) => {
	let mensajeError = "El correo tiene que tener el formato: ejemplo@gmail.com";
	comprobarValidez(e.target, correoValido, mensajeError, btnLogin);
});

inputCorreo.addEventListener("change", (e) => {
	comprobarInputs([inputCorreo, inputPassw], btnLogin);
});

inputPassw.addEventListener("change", (e) => {
	let mensajeError = "Tiene que escribir la contraseña";
	comprobarValidez(e.target, () => e.target.value.trim() != "", mensajeError, btnLogin);
});

inputPassw.addEventListener("change", (e) => {
	comprobarInputs([inputCorreo, inputPassw], btnLogin);
});
