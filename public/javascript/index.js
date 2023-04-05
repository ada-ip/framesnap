import {
	comprobarValidez,
	correoValido,
	habilitarBoton,
	deshabilitarBoton,
	comprobarInputs,
	crearMensajeError,
	borrarMensajeError
} from "./modules/inputs.js";

const inputImagen = document.getElementById("imagen-a-subir");
const inputTexto = document.getElementById("texto");

inputImagen.addEventListener("change", (e) => {
	let mensajeError = "La imagen tiene que tener uno de los siguientes formatos: jpg, jpeg";
	comprobarValidez(e.target, imagenValida, mensajeError, btnLogin);
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
