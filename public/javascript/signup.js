import {
	comprobarValidez,
	comprobarContrasenyas,
	nombreValido,
	correoValido,
	contrasenyaValida,
	habilitarBoton,
	deshabilitarBoton,
	comprobarInputs,
	crearMensajeError,
	borrarMensajeError
} from "./modules/auth.js";

const inputNombre = document.getElementById("nombre");
const inputCorreo = document.getElementById("correo");
const inputPassw1 = document.getElementById("passw1");
const inputPassw2 = document.getElementById("passw2");
const btnSubmit = document.getElementById("signup-btn");

inputNombre.addEventListener("change", (e) => {
	let mensajeError = "El nombre tiene que tener entre 3 y 30 caracteres alfanuméricos";
	comprobarValidez(e.target, nombreValido, mensajeError, btnSubmit);
});

inputNombre.addEventListener("change", async (e) => {
	if (e.target.classList.contains("input-valido")) {
		const url = "/api/v1/usuarios/validez/" + e.target.value.trim().toLowerCase();
		try {
			const response = await fetch(url);

			if (response.ok) {
				const usuario = await response.json();
				if (usuario.nombre) {
					e.target.classList.remove("input-valido");
					e.target.classList.add("input-no-valido");
					deshabilitarBoton(btnSubmit);
					crearMensajeError(e.target, "El nombre ya está cogido");
				}
			}
		} catch (error) {}
	}
});

inputNombre.addEventListener("change", (e) => {
	comprobarInputs([inputNombre, inputCorreo, inputPassw1, inputPassw2], btnSubmit);
});

inputCorreo.addEventListener("change", (e) => {
	let mensajeError = "El correo tiene que tener el formato: ejemplo@gmail.com";
	comprobarValidez(e.target, correoValido, mensajeError, btnSubmit);
});

inputCorreo.addEventListener("change", async (e) => {
	if (e.target.classList.contains("input-valido")) {
		const url = "/api/v1/usuarios/validez/" + e.target.value.trim().toLowerCase();
		try {
			const response = await fetch(url);

			if (response.ok) {
				const usuario = await response.json();
				if (usuario.correo) {
					e.target.classList.remove("input-valido");
					e.target.classList.add("input-no-valido");
					deshabilitarBoton(btnSubmit);
					crearMensajeError(e.target, "El correo ya está registrado");
				}
			}
		} catch (error) {}
	}
});

inputCorreo.addEventListener("change", (e) => {
	comprobarInputs([inputNombre, inputCorreo, inputPassw1, inputPassw2], btnSubmit);
});

inputPassw1.addEventListener("change", (e) => {
	let mensajeError =
		"La contraseña tiene que tener como mínimo 6 caracteres y sólo puede contener letras, números y caracteres especiales";
	comprobarValidez(e.target, contrasenyaValida, mensajeError, btnSubmit);
});

inputPassw1.addEventListener("change", (e) => {
	comprobarContrasenyas(inputPassw1, inputPassw2, btnSubmit);
});

inputPassw1.addEventListener("change", (e) => {
	comprobarInputs([inputNombre, inputCorreo, inputPassw1, inputPassw2], btnSubmit);
});

inputPassw2.addEventListener("change", (e) => {
	comprobarContrasenyas(inputPassw1, inputPassw2, btnSubmit);
});

inputPassw2.addEventListener("change", (e) => {
	comprobarInputs([inputNombre, inputCorreo, inputPassw1, inputPassw2], btnSubmit);
});
