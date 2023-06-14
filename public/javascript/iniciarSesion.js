/**
 * Este módulo gestiona la interacción del usuario con la página de inicio de sesión.
 * En este fichero se verifica la validez de los inputs del usuario y muestra mensajes de error si dichos inputs son erróneos.
 */

import { comprobarValidez, nombreValido, comprobarInputs, crearMensajeError } from "./modules/inputs.js";

const inputNombre = document.getElementById("nombre");
const inputPassw = document.getElementById("passw");
const form = document.getElementById("form-login");

inputNombre.addEventListener("change", (e) => {
	let mensajeError = "Tienes que escribir el nombre";
	comprobarValidez(e.target, () => e.target.value.trim() != "", mensajeError);
});

inputNombre.addEventListener("change", (e) => {
	if (e.target.classList.contains("input-valido")) {
		const url = "/api/v1/usuarios/" + e.target.value.trim().toLowerCase() + "/validez";

		fetch(url)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((usuario) => {
				if (!usuario) {
					e.target.classList.remove("input-valido");
					e.target.classList.add("input-no-valido");
					crearMensajeError(e.target, "El usuario no está registrado");
				}
			})
			.catch((error) => {});
	}
});

inputPassw.addEventListener("change", (e) => {
	let mensajeError = "Tienes que escribir la contraseña";
	comprobarValidez(e.target, () => e.target.value.trim() != "", mensajeError);
});

form.addEventListener("submit", (e) => {
	e.preventDefault();

	if (comprobarInputs([inputNombre, inputPassw])) {
		e.target.submit();
	} else {
		if (!inputNombre.classList.contains("input-no-valido")) {
			let mensajeError = "Tienes que escribir el nombre de usuario";
			comprobarValidez(inputNombre, nombreValido, mensajeError);
		}

		if (!inputPassw.classList.contains("input-no-valido")) {
			let mensajeError = "Tienes que rellenar la contraseña";
			comprobarValidez(inputPassw, (valorInput) => valorInput != "", mensajeError);
		}
	}
});
