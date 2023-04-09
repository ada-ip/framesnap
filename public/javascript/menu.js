import { debounce } from "./modules/debounce.js";
import { crearElemAutocompletar } from "./modules/dom.js";

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
