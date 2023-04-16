import {
	nombreValido,
	imagenValida,
	comprobarValidez,
	comprobarInputs,
	nombreTLValido,
	crearMensajeError,
	fechaValida,
	comprobarValidezFechas
} from "./modules/inputs.js";
import { debounce } from "./modules/debounce.js";
import { crearAutocompletarUsuariosTL, crearNuevoInputUsuario } from "./modules/dom.js";

const inputImagen = document.getElementById("imagenASubir");
const inputTexto = document.getElementById("texto");
const formImagen = document.getElementById("form-subir-foto");

inputImagen.addEventListener("change", (e) => {
	let mensajeError = "La imagen tiene que tener uno de los siguientes formatos: jpg, jpeg";
	comprobarValidez(inputImagen, imagenValida, mensajeError, true);
});

inputTexto.addEventListener("change", (e) => {
	let mensajeError = "Tienes que escribir un pie de foto";
	comprobarValidez(e.target, () => e.target.value.trim() != "", mensajeError);
});

formImagen.addEventListener("submit", (e) => {
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

const inputNombreTL = document.getElementById("nombre-tl");
const inputUsuariosTL = document.getElementsByName("usuarios-tl[]");
const inputTagsTL = document.getElementsByName("tags-tl[]");
const inputFechaDesde = document.getElementById("desde-tl");
const inputFechaHasta = document.getElementById("hasta-tl");
const inputOrden = document.getElementById("orden-tl");
const formTimeline = document.getElementById("form-timeline");

inputNombreTL.addEventListener("change", (e) => {
	let mensajeError = "El nombre tiene que tener entre 1 y 20 caracteres alfanuméricos/guiones";
	comprobarValidez(e.target, nombreTLValido, mensajeError);
});

inputNombreTL.addEventListener("change", (e) => {
	if (e.target.classList.contains("input-valido")) {
		const url = "/api/v1/usuarios/tls/" + e.target.value.trim();

		fetch(url)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((tl) => {
				if (tl.esRepetido === true) {
					e.target.classList.remove("input-valido");
					e.target.classList.add("input-no-valido");
					crearMensajeError(e.target, "Este timeline ya existe");
				}
			})
			.catch((error) => {});
	}
});

inputUsuariosTL.forEach((input) =>
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
					autocompletar.nextElementSibling.nextElementSibling.remove();
					autocompletar.nextElementSibling.remove();
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
						autocompletar.innerHTML = crearAutocompletarUsuariosTL(usuarios);
						autocompletar.classList.add("mostrar");
						anyadirListenerAutocompletarTL();
					})
					.catch((error) => {});
			}
		}, 200)
	)
);

function anyadirListenerAutocompletarTL() {
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
				crearNuevoInputUsuario(e.target);
			}

			for (let elem of ulAutocompletar.children) {
				elem.remove();
			}
			ulAutocompletar.classList.remove("mostrar");
		})
	);
}

inputTagsTL.forEach((input) =>
	input.addEventListener("change", (e) => {
		let mensajeError = "";
		comprobarValidez(e.target, (valor) => true, mensajeError);
	})
);

inputFechaDesde.addEventListener("change", (e) => {
	let mensajeError = "La fecha tiene que ser anterior a la de hasta";
	comprobarValidezFechas([e.target, inputFechaHasta], fechaValida, mensajeError);
	mensajeError = "La fecha tiene que ser posterior a la de desde";
	comprobarValidezFechas([e.target, inputFechaHasta], fechaValida, mensajeError, 1);
});

inputFechaHasta.addEventListener("change", (e) => {
	let mensajeError = "La fecha tiene que ser posterior a la de desde";
	comprobarValidezFechas([inputFechaDesde, e.target], fechaValida, mensajeError, 1);
	mensajeError = "La fecha tiene que ser anterior a la de hasta";
	comprobarValidezFechas([inputFechaDesde, e.target], fechaValida, mensajeError);
});

formTimeline.addEventListener("submit", (e) => {
	e.preventDefault();

	if (comprobarInputs([inputNombreTL, inputFechaDesde, inputFechaHasta, inputOrden])) {
		e.target.submit();
	} else {
		if (!inputNombreTL.classList.contains("input-no-valido") && !inputNombreTL.classList.contains("input-valido")) {
			let mensajeError = "Tiene que escribir el nombre del timeline";
			comprobarValidez(inputNombreTL, (valor) => valor != "", mensajeError);
		} else if (
			!inputFechaDesde.classList.contains("input-no-valido") ||
			!inputFechaHasta.classList.contains("input-no-valido")
		) {
			e.target.submit();
		}
	}
});
