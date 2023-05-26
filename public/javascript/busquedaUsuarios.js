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
