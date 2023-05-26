import {
	comprobarValidez,
	comprobarContrasenyas,
	nombreValido,
	correoValido,
	contrasenyaValida,
	comprobarInputs,
	crearMensajeError,
} from "./modules/inputs.js";

const inputNombre = document.getElementById("nombre");
const inputCorreo = document.getElementById("correo");
const inputPassw1 = document.getElementById("passw1");
const inputPassw2 = document.getElementById("passw2");
const form = document.getElementById("signup-form");

inputNombre.addEventListener("change", (e) => {
	let mensajeError = "El nombre tiene que tener entre 3 y 30 caracteres alfanuméricos";
	comprobarValidez(e.target, nombreValido, mensajeError);
});

inputNombre.addEventListener("change", (e) => {
	console.log(e.target);
	if (e.target.classList.contains("input-valido")) {
		console.log("hola");
		const url = "/api/v1/usuarios/" + e.target.value.trim().toLowerCase() + "/validez";

		console.log(url);
		fetch(url)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((usuario) => {
				if (usuario.nombre) {
					e.target.classList.remove("input-valido");
					e.target.classList.add("input-no-valido");
					crearMensajeError(e.target, "El nombre ya está cogido");
				}
			})
			.catch((error) => {});
	}
});

inputCorreo.addEventListener("change", (e) => {
	let mensajeError = "El correo tiene que tener el formato: ejemplo@gmail.com";
	comprobarValidez(e.target, correoValido, mensajeError);
});

inputCorreo.addEventListener("change", (e) => {
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
				if (usuario.correo) {
					e.target.classList.remove("input-valido");
					e.target.classList.add("input-no-valido");
					crearMensajeError(e.target, "El correo ya está registrado");
				}
			})
			.catch((error) => {});
	}
});

inputPassw1.addEventListener("change", (e) => {
	let mensajeError =
		"La contraseña tiene que tener como mínimo 6 caracteres y sólo puede contener letras, números y caracteres especiales";
	comprobarValidez(e.target, contrasenyaValida, mensajeError);
});

inputPassw1.addEventListener("change", (e) => {
	comprobarContrasenyas(inputPassw1, inputPassw2);
});

inputPassw2.addEventListener("change", (e) => {
	comprobarContrasenyas(inputPassw1, inputPassw2);
});

form.addEventListener("submit", (e) => {
	e.preventDefault();

	if (comprobarInputs([inputNombre, inputCorreo, inputPassw1, inputPassw2])) {
		e.target.submit();
	} else {
		if (!inputNombre.classList.contains("input-no-valido")) {
			let mensajeError = "El nombre tiene que tener entre 3 y 30 caracteres alfanuméricos";
			comprobarValidez(inputNombre, nombreValido, mensajeError);
		}
		if (!inputCorreo.classList.contains("input-no-valido")) {
			let mensajeError = "El correo tiene que tener el formato: ejemplo@gmail.com";
			comprobarValidez(inputCorreo, correoValido, mensajeError);
		}

		if (!inputPassw1.classList.contains("input-no-valido")) {
			let mensajeError =
				"La contraseña tiene que tener como mínimo 6 caracteres y sólo puede contener letras, números y caracteres especiales";
			comprobarValidez(inputPassw1, contrasenyaValida, mensajeError);
		}
	}
});
