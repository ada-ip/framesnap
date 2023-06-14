/**
 * Este módulo controla la interacción del usuario con la página de búsqueda de usuarios.
 * Esta página le permite a los usuarios interactuar con los botones de Seguir usuario y Cargar más usuarios de la página.
 * Los usuarios se cargan de manera paginada en bloques de 15 cada vez que se hace click en el botón Cargar más usuarios.
 */

import { seguirUsuario, anyadirUsuarios } from "./modules/listeners.js";

let clicksCargarMasUsuarios = 0;

const btnCargarTarjetasUsuarios = document.getElementById("cargarTarjetasUsuarios");
if (btnCargarTarjetasUsuarios) {
	btnCargarTarjetasUsuarios.addEventListener("click", (e) => {
		clicksCargarMasUsuarios += 15;

		let url = window.location.href + `&skip=${clicksCargarMasUsuarios}`;

		fetch(url)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((usuarios) => {
				if (usuarios.length === 0) {
					e.target.textContent = "Parece que no hay más usuarios";
					e.target.disabled = true;
				} else {
					anyadirUsuarios(usuarios, e.target);
				}
			})
			.catch((error) => {
				//
			});
	});
}

const btnsSeguirUsuario = document.querySelectorAll(".btn-seguir");
btnsSeguirUsuario.forEach((btn) => btn.addEventListener("click", seguirUsuario));
