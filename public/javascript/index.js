/**
 * Este módulo gestiona la interacción del usuario con la página de index permitiéndole interactuar con el formulario
 * de creación y modificación de timelines personalizados y con el formulario de crear post de la página index.
 *
 * Se verifica la validez de los inputs introducidos por el usuario, muestra mensajes de error si dichos inputs son erróneos, y
 * también controla la recarga de la página mediante el botón de recargar página en ordenador, y mediante el scroll hacia arriba
 * en móvil/tablet.
 */

import {
	imagenValida,
	textoValido,
	comprobarValidez,
	comprobarInputs,
	nombreTLValido,
	crearMensajeError,
	fechaValida,
	comprobarValidezFechas,
	comprobarUsuariosTl,
} from "./modules/inputs.js";
import { rellenarModalConfigTl, resetearModalTl } from "./modules/dom.js";
import { validarTag, autocompletarUsuarioTL, esconderListasAutocompletar } from "./modules/listeners.js";

const inputImagen = document.getElementById("imagenASubir");
const inputTexto = document.getElementById("texto");
const formImagen = document.getElementById("form-subir-foto");

inputImagen.addEventListener("change", (e) => {
	let mensajeError = "La imagen no puede superar los 10MB y tiene que tener uno de los siguientes formatos: jpg, jpeg, png";
	comprobarValidez(e.target, imagenValida, mensajeError, true);
});

inputTexto.addEventListener("change", (e) => {
	let mensajeError = "El pie de foto tiene que tener entre 1 y 1000 caracteres";
	comprobarValidez(e.target, textoValido, mensajeError);
});

formImagen.addEventListener("submit", (e) => {
	e.preventDefault();

	if (comprobarInputs([inputImagen, inputTexto])) {
		e.target.submit();
	} else {
		if (!inputImagen.classList.contains("input-no-valido")) {
			let mensajeError = "La imagen tiene que tener uno de los siguientes formatos: jpg, jpeg, png";
			comprobarValidez(inputImagen, imagenValida, mensajeError, true);
		}

		if (!inputTexto.classList.contains("input-no-valido")) {
			let mensajeError = "El pie de foto tiene que tener entre 1 y 1000 caracteres";
			comprobarValidez(inputTexto, textoValido, mensajeError);
		}
	}
});

const inputNombreTL = document.getElementById("nombreTl");
const inputUsuariosTL = document.getElementsByName("usuariosTl[]");
const inputTagsTL = document.getElementsByName("tagsTl[]");
const inputFechaTL = document.getElementById("fechaTl");
const contRangoFechas = document.getElementById("rango-fechas-tl");
const inputFechaDesde = document.getElementById("desdeTl");
const inputFechaHasta = document.getElementById("hastaTl");
const inputOrdenTL = document.getElementById("ordenTl");
const formTimeline = document.getElementById("form-timeline");
const btnCerrarModal = formTimeline.firstElementChild.lastElementChild;

inputNombreTL.addEventListener("change", (e) => {
	let mensajeError = "El nombre tiene que tener entre 1 y 20 caracteres alfanuméricos o guiones";
	comprobarValidez(e.target, nombreTLValido, mensajeError);
});

inputNombreTL.addEventListener("change", (e) => {
	const nombreTl = e.target.getAttribute("data-value");
	if (e.target.classList.contains("input-valido") && nombreTl !== e.target.value) {
		const url = "/api/v1/tls/" + e.target.value.trim() + "/validez";
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

inputUsuariosTL.forEach((input) => autocompletarUsuarioTL(input));
formTimeline.addEventListener("click", (e) => {
	const listasAutocompletar = formTimeline.querySelectorAll("#form-timeline .autocompletar-tl-ul");
	esconderListasAutocompletar(e, listasAutocompletar);
});
formTimeline.addEventListener("touchend", (e) => {
	const listasAutocompletar = formTimeline.querySelectorAll("#form-timeline .autocompletar-tl-ul");
	esconderListasAutocompletar(e, listasAutocompletar);
});

inputTagsTL.forEach((input) => input.addEventListener("change", validarTag));

inputFechaTL.addEventListener("change", (e) => {
	if (e.target.value === "elegir") {
		contRangoFechas.classList.remove("ocultar");
	} else {
		inputFechaDesde.value = "";
		inputFechaHasta.value = "";
		contRangoFechas.classList.add("ocultar");
	}
});

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

	const usuarios = document.getElementsByName("usuariosTl[]");

	if (
		comprobarInputs([inputNombreTL, inputFechaTL, inputFechaDesde, inputFechaHasta, inputOrdenTL]) &&
		comprobarUsuariosTl(usuarios)
	) {
		e.target.submit();
	} else {
		if (!comprobarUsuariosTl(usuarios)) {
			let mensajeError = "Todos los usuarios tienen que ser válidos";
			comprobarValidez(usuarios[usuarios.length - 1], (valor) => false, mensajeError);
		} else if (
			inputNombreTL.classList.contains("input-valido") &&
			(inputFechaTL.value !== "elegir" ||
				inputFechaDesde.classList.contains("input-valido") ||
				inputFechaHasta.classList.contains("input-valido"))
		) {
			e.target.submit();
		}

		if (inputFechaTL.value === "elegir" && inputFechaDesde.value === "" && inputFechaHasta.value === "") {
			let mensajeError = "Tienes que rellenar una de las dos fechas";
			comprobarValidez(inputFechaDesde, (valor) => valor != "", mensajeError);
			mensajeError = "Tienes que rellenar una de las dos fechas";
			comprobarValidez(inputFechaHasta, (valor) => valor != "", mensajeError);
		}
		if (inputNombreTL.value.trim() === "") {
			let mensajeError = "El nombre tiene que tener entre 1 y 20 caracteres alfanuméricos o guiones";
			comprobarValidez(inputNombreTL, (valor) => valor != "", mensajeError);
		}
	}
});

btnCerrarModal.addEventListener("click", (e) => {
	setTimeout(resetearModalTl, 500, e.target.parentElement.nextElementSibling);
});

const btnsConfigTls = document.querySelectorAll("#timelines img.conf-icon");
btnsConfigTls.forEach((btn) =>
	btn.addEventListener("click", (e) => {
		e.preventDefault();

		formTimeline.querySelector("#crearTLModalLabel").textContent = "Modificar timeline";
		formTimeline.querySelector("#crearTLModalBtn").value = "Guardar";
		formTimeline.querySelector("input[name=metodo]").value = "patch";
		formTimeline.querySelector("input[name=anteriorNombre]").value = e.target.previousElementSibling.textContent.trim();

		let url = "/api/v1/tls/" + e.target.previousElementSibling.textContent.trim();

		fetch(url)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((tl) => {
				rellenarModalConfigTl(tl, formTimeline.children[1]);
				const modal = formTimeline.parentElement.parentElement;
				const bootstrapModal = new bootstrap.Modal(modal);
				bootstrapModal.show();
			})
			.catch((error) => {});
	})
);

window.addEventListener("touchmove", (e) => {
	if (window.pageYOffset === 0 && e.changedTouches[0].clientY < e.touches[0].clientY) {
		location.reload();
	}
});

const btnRecargarPagina = document.getElementById("recargar-pagina");
btnRecargarPagina.addEventListener("click", (e) => {
	location.reload();
});
