import {
	nombreValido,
	imagenValida,
	comprobarValidez,
	comprobarInputs,
	nombreTLValido,
	crearMensajeError,
	fechaValida,
	comprobarValidezFechas,
} from "./modules/inputs.js";
import { debounce } from "./modules/debounce.js";
import { crearAutocompletarUsuariosTL, crearNuevoInputUsuario, crearNuevoInputTags, crearModalConfigTl } from "./modules/dom.js";
import { validarTag, autocompletarUsuarioTL } from "./modules/listeners.js";

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

const inputNombreTL = document.getElementById("nombreTl");
const inputUsuariosTL = document.getElementsByName("usuariosTl[]");
const inputTagsTL = document.getElementsByName("tagsTl[]");
const inputFechaTL = document.getElementById("fechaTl");
const contRangoFechas = document.getElementById("rango-fechas-tl");
const inputFechaDesde = document.getElementById("desdeTl");
const inputFechaHasta = document.getElementById("hastaTl");
const inputOrdenTL = document.getElementById("ordenTl");
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

inputUsuariosTL.forEach((input) => autocompletarUsuarioTL(input));

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

	if (comprobarInputs([inputNombreTL, inputFechaTL, inputFechaDesde, inputFechaHasta, inputOrdenTL])) {
		e.target.submit();
	} else {
		if (!inputNombreTL.classList.contains("input-no-valido") && !inputNombreTL.classList.contains("input-valido")) {
			let mensajeError = "Tienes que escribir el nombre del timeline";
			comprobarValidez(inputNombreTL, (valor) => valor != "", mensajeError);
		} else if (
			inputFechaTL.value != "elegir" ||
			inputFechaDesde.classList.contains("input-valido") ||
			inputFechaHasta.classList.contains("input-valido")
		) {
			e.target.submit();
		} else {
			let mensajeError = "Tienes que rellenar una de las dos fechas";
			comprobarValidez(inputFechaDesde, (valor) => valor != "", mensajeError);
			mensajeError = "Tienes que rellenar una de las dos fechas";
			comprobarValidez(inputFechaHasta, (valor) => valor != "", mensajeError);
		}
	}
});

const btnsConfigTls = document.querySelectorAll("#timelines i.fa-gear");

btnsConfigTls.forEach((btn) =>
	btn.addEventListener("click", (e) => {
		e.preventDefault();

		let url = "";

		crearModalConfigTl();
	})
);

function getScrollbarWidth() {
	const outer = document.createElement("div");
	outer.style.visibility = "hidden";
	outer.style.overflow = "scroll";
	document.body.appendChild(outer);

	const inner = document.createElement("div");
	outer.appendChild(inner);

	const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

	outer.parentNode.removeChild(outer);

	return scrollbarWidth;
}

document.addEventListener("DOMContentLoaded", () => {
	const scrollbarWidth = getScrollbarWidth();
	console.log(scrollbarWidth);

	document.body.addEventListener("show.bs.modal", () => {
		const navbar = document.querySelector("nav.fixed-top");
		if (navbar) {
			let pixels = scrollbarWidth + 15;
			navbar.style.paddingRight = `${pixels}px`;
			console.log(`calc(${scrollbarWidth}px + 15px)`);
		}
	});

	document.body.addEventListener("hide.bs.modal", () => {
		const navbar = document.querySelector("nav.fixed-top");
		if (navbar) {
			navbar.style.paddingRight = "";
		}
	});
});
