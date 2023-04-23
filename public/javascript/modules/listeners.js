import { comprobarValidez } from "./inputs.js";
import { crearNuevoInputTags, crearAutocompletarUsuariosTL, crearNuevoInputUsuario } from "./dom.js";
import { tagValido } from "./inputs.js";
import { debounce } from "./debounce.js";

function validarTag(e) {
	let mensajeError = "El tag no puede tener espacios";
	comprobarValidez(e.target, tagValido, mensajeError);

	if (e.target.classList.contains("input-valido") && e.target.value.trim() !== "") {
		crearNuevoInputTags(e.target);
	} else if (e.target.classList.contains("input-valido")) {
		if (
			e.target.nextElementSibling.classList.contains("form-control") ||
			e.target.previousElementSibling.classList.contains("form-control")
		) {
			e.target.remove();
		}
	}
}

function autocompletarUsuarioTL(input) {
	input.addEventListener(
		"input",
		debounce((e) => {
			const autocompletar = e.target.nextElementSibling;
			if (e.target.value.trim().length < 2) {
				for (let elem of autocompletar.children) {
					elem.remove();
				}
				autocompletar.classList.remove("mostrar");
				if (autocompletar.nextElementSibling) {
					e.target.remove();
					autocompletar.remove();
				}
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
						const usuariosNoRepetidos = usuarios.filter((usuario) => {
							const elems = e.target.parentElement.children;
							for (let i = 0; i < elems.length; i++) {
								if (elems[i].classList.contains("form-control") && elems[i].value === usuario.nombre)
									return false;
							}
							return true;
						});

						autocompletar.innerHTML = crearAutocompletarUsuariosTL(usuariosNoRepetidos);
						autocompletar.classList.add("mostrar");
						anyadirListenersElemsAutocompletar();
					})
					.catch((error) => {});
			}
		}, 200)
	);
}

function anyadirListenersElemsAutocompletar() {
	const autocompletarElems = document.querySelectorAll(".autocompletar-tl");
	autocompletarElems.forEach((elem) =>
		elem.addEventListener("click", (e) => {
			let texto = e.target.textContent;
			const ulAutocompletar = e.target.parentElement;

			const inputUsuarios = ulAutocompletar.previousElementSibling;
			inputUsuarios.value = texto;

			let mensajeError = "";
			comprobarValidez(inputUsuarios, (valorInput) => valorInput != "", mensajeError);

			if (!ulAutocompletar.nextElementSibling) {
				crearNuevoInputUsuario(e.target.parentElement);
			}

			for (let elem of ulAutocompletar.children) {
				elem.remove();
			}
			ulAutocompletar.classList.remove("mostrar");
		})
	);
}

export { validarTag, autocompletarUsuarioTL };
