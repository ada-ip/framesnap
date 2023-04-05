import { comprobarValidez, correoValido, comprobarInputs, crearMensajeError, borrarMensajeError } from "./modules/inputs.js";

const inputCorreo = document.getElementById("correo");
const inputPassw = document.getElementById("passw");
const form = document.getElementById("form-login");

inputCorreo.addEventListener("change", (e) => {
	let mensajeError = "El correo tiene que tener el formato: ejemplo@gmail.com";
	comprobarValidez(e.target, correoValido, mensajeError);
});

inputPassw.addEventListener("change", (e) => {
	let mensajeError = "Tienes que escribir la contraseña";
	comprobarValidez(e.target, () => e.target.value.trim() != "", mensajeError);
});

form.addEventListener("submit", (e) => {
	e.preventDefault();
	console.log(e.action);

	if (comprobarInputs([inputCorreo, inputPassw])) {
		e.target.submit();
	} else {
		if (!inputCorreo.classList.contains("input-no-valido")) {
			let mensajeError = "El correo tiene que tener el formato: ejemplo@gmail.com";
			comprobarValidez(inputCorreo, correoValido, mensajeError);
		}

		if (!inputPassw.classList.contains("input-no-valido")) {
			let mensajeError = "Tienes que rellenar la contraseña";
			comprobarValidez(inputPassw, () => inputPassw.value.trim() != "", mensajeError);
		}
	}
});
