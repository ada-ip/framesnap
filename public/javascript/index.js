import { imagenValida, comprobarValidez, comprobarInputs } from "./modules/inputs.js";
import { crearElemAutocompletar } from "./modules/dom.js";
import { debounce } from "./modules/debounce.js";

const inputBusqueda = document.getElementById("buscar");
const ulAutocompletar = document.getElementById("autocompletar");

inputBusqueda.addEventListener(
	"input",
	debounce((e) => {
		if (e.target.value.trim() === "") {
			for (let elem of ulAutocompletar.children) {
				elem.remove();
			}
			ulAutocompletar.classList.remove("mostrar");
		} else {
			const url = "/api/v1/usuarios/" + e.target.value.trim().toLowerCase();

			fetch(url)
				.then((response) => {
					if (!response.ok) {
						throw new Error(`Error status: ${response.status}`);
					}
					return response.json();
				})
				.then((usuarios) => {
					const usuariosEncontrados = usuarios.filter(
						(usuario, i, array) => array.findIndex((elem) => elem.nombre === usuario.nombre) === i
					);

					ulAutocompletar.innerHTML = crearElemAutocompletar(usuariosEncontrados);
					ulAutocompletar.classList.add("mostrar");
				})
				.catch((error) => {});
		}
	}, 200)
);

const inputImagen = document.getElementById("imagenASubir");
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
