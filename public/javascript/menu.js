/**
 * Este módulo gestiona la funcionalidad de autocompletado de la barra de búsqueda del menú de navegación.
 * Cuando el usuario escribe algo en la barra de búsqueda, se realiza una solicitud HTTP para obtener
 * una lista de sugerencias de usuarios en función de lo que esté escribiendo el usuario.
 */

import { debounce } from "./modules/debounce.js";
import { crearElemAutocompletar } from "./modules/dom.js";

const inputBusqueda = document.getElementById("buscar");
const ulAutocompletar = document.getElementById("autocompletar-busqueda");

inputBusqueda.addEventListener(
	"input",
	debounce((e) => {
		if (e.target.value.trim().length < 2) {
			for (let elem of ulAutocompletar.children) {
				elem.remove();
			}
			ulAutocompletar.classList.remove("mostrar");
		} else {
			let url = "/api/v1/usuarios/" + e.target.value.trim().toLowerCase();

			fetch(url)
				.then((response) => {
					if (!response.ok) {
						throw new Error(`Error status: ${response.status}`);
					}
					return response.json();
				})
				.then((usuarios) => {
					ulAutocompletar.innerHTML = crearElemAutocompletar(usuarios);
					ulAutocompletar.classList.add("mostrar");
				})
				.catch((error) => {});
		}
	}, 200)
);
