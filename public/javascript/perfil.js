/**
 * Este modulo gestiona la interacción del usuario con la página de perfil de usuario.
 * La página permite a los usuarios elegir una foto de perfil desde la página de perfil, y también les permite
 * seguir y dejar de seguir a otro usuario.
 */

import { imagenValida, comprobarValidez, comprobarInputs } from "./modules/inputs.js";

if (document.getElementById("btn-seguir")) {
	const btnSeguir = document.getElementById("btn-seguir");

	btnSeguir.addEventListener("click", (e) => {
		let textoBtn = e.target.textContent.trim();

		let url = "/api/v1/usuarios/" + e.target.parentElement.previousElementSibling.children[1].textContent;
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
				const numSeguidores = document.getElementById("num-seguidores");
				const numTimelines = document.getElementById("num-timelines");
				if (resultado.estado === "ok" && textoBtn === "Seguir") {
					e.target.textContent = "Dejar de seguir";
					numSeguidores.textContent = `${parseInt(numSeguidores.textContent) + 1}`;
					numTimelines.textContent = `${parseInt(numTimelines.textContent) + 1}`;
				}
				if (resultado.estado === "ok" && textoBtn === "Dejar de seguir") {
					e.target.textContent = "Seguir";
					numSeguidores.textContent = `${parseInt(numSeguidores.textContent) - 1}`;
					numTimelines.textContent = `${parseInt(numTimelines.textContent) - 1}`;
				}
				if (numTimelines.textContent !== "1") {
					numTimelines.parentElement.nextElementSibling.textContent = "timelines";
				} else {
					numTimelines.parentElement.nextElementSibling.textContent = "timeline";
				}
			})
			.catch((error) => {});
	});
}

const inputImagen = document.getElementById("imagenElegida");
const formImagen = document.getElementById("form-editar-foto-perfil");

inputImagen.addEventListener("change", (e) => {
	let mensajeError = "La imagen no puede superar los 10MB y tiene que tener uno de los siguientes formatos: jpg, jpeg, png";
	comprobarValidez(inputImagen, imagenValida, mensajeError, true);
});

formImagen.addEventListener("submit", (e) => {
	e.preventDefault();

	if (comprobarInputs([inputImagen])) {
		e.target.submit();
	} else {
		if (!inputImagen.classList.contains("input-no-valido")) {
			let mensajeError = "La imagen tiene que tener uno de los siguientes formatos: jpg, jpeg, png";
			comprobarValidez(inputImagen, imagenValida, mensajeError, true);
		}
	}
});
