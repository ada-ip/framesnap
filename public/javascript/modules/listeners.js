/**
 * Este módulo proporciona funciones para permitir que el usuario pueda interactuar con la interfaz de la aplicación.
 *
 * Funciones:
 *
 * - validarTag: listener que verifica la validez de un tag instroducido por el usuario y crea o elimina inputs de tags en
 *               base a dicha validez.
 * - autocompletarUsuarioTL: crea una lista de usuarios autocompletados al intentar añadir un nuevo usuario en un
 *                           timeline personalizado.
 * - anyadirListenersElemsAutocompletar: agrega un listener a los elementos de la lista de autocompletado de usuarios que sustituye
 * 										 el input del usuario por el usuario al que se ha clickado y también vacia la lista de autocompletado.
 * - esconderListasAutocompletar: oculta las listas de autocompletado si se hace click fuera de ellas.
 * - borrarTimeline: envía una petición para borrar el timeline objeto del evento.
 * - seguirUsuario: envía una petición para seguir o dejar de seguir al usuario objeto del evento.
 */

import { comprobarValidez } from "./inputs.js";
import { crearNuevoInputTags, crearAutocompletarUsuariosTL, crearNuevoInputUsuario } from "./dom.js";
import { tagValido } from "./inputs.js";
import { debounce } from "./debounce.js";

function validarTag(e) {
	let mensajeError = "El tag sólo puede tener caracteres alfanuméricos";
	comprobarValidez(e.target, tagValido, mensajeError);

	if (e.target.classList.contains("input-valido") && e.target.value.trim() !== "") {
		if (!e.target.nextElementSibling) crearNuevoInputTags(e.target);
	} else if (e.target.classList.contains("input-valido")) {
		if (
			e.target.nextElementSibling.classList.contains("form-control") ||
			e.target.previousElementSibling.classList.contains("form-control")
		) {
			if (e.target.parentElement.children[1] === e.target) e.target.nextElementSibling.classList.remove("mt-2");
			e.target.remove();
		} else {
			e.target.classList.remove("input-valido");
		}
	}
}

function autocompletarUsuarioTL(input) {
	input.addEventListener(
		"input",
		debounce((e) => {
			const error = document.querySelector("#contUsuariosTl .error-input");
			if (error) {
				error.remove();
				e.target.classList.remove("input-no-valido");
			}
			const autocompletar = e.target.nextElementSibling;
			if (e.target.value.trim().length < 2) {
				for (let elem of autocompletar.children) {
					elem.remove();
				}
				autocompletar.classList.remove("mostrar");
				if (autocompletar.nextElementSibling) {
					if (e.target.parentElement.children[1] === e.target)
						autocompletar.nextElementSibling.classList.remove("mt-2");
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
								if (
									elems[i].classList.contains("form-control") &&
									elems[i].value === usuario.nombre &&
									elems[i].value !== e.target.value
								)
									return false;
							}
							return true;
						});

						autocompletar.innerHTML = crearAutocompletarUsuariosTL(usuariosNoRepetidos);
						if (autocompletar.children.length > 0) {
							autocompletar.classList.add("mostrar");
							anyadirListenersElemsAutocompletar();
						} else {
							autocompletar.classList.remove("mostrar");
						}
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

function esconderListasAutocompletar(e, listas) {
	let clickEnLista = false;
	for (let lista of listas) {
		if (lista.contains(e.target)) {
			clickEnLista = true;
		}
	}

	if (!clickEnLista) {
		listas.forEach((lista) => lista.classList.remove("mostrar"));
	}
}

function borrarTimeline(e) {
	e.preventDefault();

	let timeline = e.target.previousElementSibling.value.trim();

	let url = "/api/v1/tls/" + timeline;
	fetch(url, {
		method: "DELETE",
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Error status: ${response.status}`);
			}
			if (response.status === 204) {
				window.location.href = "/";
			}
		})
		.catch((error) => {});
}

function seguirUsuario(e) {
	e.preventDefault();
	let textoBtn = e.target.textContent.trim();

	let url = "/api/v1/usuarios/" + e.target.dataset.usuario;
	url += textoBtn === "Seguir" ? "/seguir" : "/dejardeseguir";

	fetch(url, {
		method: "PATCH",
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Error status: ${response.status}`);
			}
			return response.json();
		})
		.then((resultado) => {
			if (resultado.estado === "ok" && textoBtn === "Seguir") {
				e.target.textContent = "Dejar de seguir";
				const numSeguidores = e.target.parentElement.querySelector(".num-seguidores");
				numSeguidores.textContent = `${parseInt(numSeguidores.textContent) + 1}`;
			}
			if (resultado.estado === "ok" && textoBtn === "Dejar de seguir") {
				e.target.textContent = "Seguir";
				const numSeguidores = e.target.parentElement.querySelector(".num-seguidores");
				numSeguidores.textContent = `${parseInt(numSeguidores.textContent) - 1}`;
			}
		})
		.catch((error) => {});
}

export { validarTag, autocompletarUsuarioTL, borrarTimeline, seguirUsuario, esconderListasAutocompletar };
