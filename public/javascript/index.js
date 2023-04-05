import { imagenValida, comprobarValidez, comprobarInputs } from "./modules/inputs.js";

const inputImagen = document.getElementById("imagen-a-subir");
const inputTexto = document.getElementById("texto");
const form = document.getElementById("form-subir-foto");
const btn = document.getElementById("btn-subir-img");

inputImagen.addEventListener("change", (e) => {
	let mensajeError = "La imagen tiene que tener uno de los siguientes formatos: jpg, jpeg";
	comprobarValidez(inputImagen, imagenValida, mensajeError, true);
});

inputTexto.addEventListener("change", (e) => {
	let mensajeError = "Tienes que escribir un pie de foto";
	comprobarValidez(e.target, () => e.target.value.trim() != "", mensajeError);
});

form.addEventListener("submit", (e) => {
	e.preventDefault();

	if (comprobarInputs([inputImagen, inputTexto])) {
		e.target.submit();
	} else {
		if (!inputImagen.classList.contains("input-no-valido")) {
			let mensajeError = "La imagen tiene que tener uno de los siguientes formatos: jpg, jpeg";
			comprobarValidez(inputImagen, imagenValida, mensajeError, true);
		}

		if (!inputTexto.classList.contains("input-no-valido")) {
			let mensajeError = "Tienes que escribir un pie de foto";
			comprobarValidez(inputTexto, () => inputTexto.value.trim() != "", mensajeError);
		}
	}
});
