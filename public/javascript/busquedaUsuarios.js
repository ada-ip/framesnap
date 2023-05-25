import { seguirUsuario } from "./modules/listeners.js";

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
// btnsSeguirUsuario.forEach((btn) =>
// 	btn.addEventListener("click", (e) => {
// 		e.preventDefault();
// 		let textoBtn = e.target.textContent.trim();

// 		let url = "/api/v1/usuarios/" + e.target.parentElement.previousElementSibling.lastElementChild.textContent;
// 		url += textoBtn === "Seguir" ? "/seguir" : "/dejardeseguir";

// 		fetch(url, {
// 			method: "PATCH",
// 		})
// 			.then((response) => {
// 				if (!response.ok) {
// 					throw new Error(`Error status: ${response.status}`);
// 				}
// 				return response.json();
// 			})
// 			.then((resultado) => {
// 				if (resultado.estado === "ok" && textoBtn === "Seguir") {
// 					e.target.textContent = "Dejar de seguir";
// 					const numSeguidores = e.target.parentElement.firstElementChild.firstElementChild;
// 					numSeguidores.textContent = `${parseInt(numSeguidores.textContent) + 1}`;
// 				}
// 				if (resultado.estado === "ok" && textoBtn === "Dejar de seguir") {
// 					e.target.textContent = "Seguir";
// 					const numSeguidores = e.target.parentElement.firstElementChild.firstElementChild;
// 					numSeguidores.textContent = `${parseInt(numSeguidores.textContent) - 1}`;
// 				}
// 			})
// 			.catch((error) => {});
// 	})
// );
