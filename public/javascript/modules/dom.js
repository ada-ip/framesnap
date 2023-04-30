import { validarTag, autocompletarUsuarioTL } from "./listeners.js";

function crearElemAutocompletar(elementos) {
	let texto = "";
	elementos.forEach((elem) => {
		texto += "<li>";
		texto += `<a class="dropdown-item" href="/usuarios/${elem.nombre}">${elem.nombre}</a>`;
		texto += "</li>";
	});

	texto += "<hr class='dropdown-divider' />";
	texto += "<li><input class='dropdown-item' type='submit' value='Buscar usuarios'></li>";
	texto += "<li><input class='dropdown-item' formaction='/posts' type='submit' value='Buscar posts'></li>";

	console.log(texto);
	return texto;
}

function crearAutocompletarUsuariosTL(elementos) {
	let texto = "";
	elementos.forEach((elem) => {
		texto += `<li class="dropdown-item autocompletar-tl">${elem.nombre}</li>`;
	});
	return texto;
}

function crearNuevoInputUsuario(elemAutocompletar) {
	const contenedorUsuarios = elemAutocompletar.parentElement;

	const nuevoInput = document.createElement("input");
	nuevoInput.type = "text";
	nuevoInput.name = "usuariosTl[]";
	nuevoInput.classList.add("form-control");
	autocompletarUsuarioTL(nuevoInput);
	contenedorUsuarios.append(nuevoInput);

	const nuevaUl = document.createElement("ul");
	nuevaUl.classList.add("dropdown-menu");
	nuevaUl.classList.add("text-small");
	contenedorUsuarios.append(nuevaUl);
}

function crearNuevoInputTags(ultimoTag) {
	const contenedorTags = ultimoTag.parentElement;

	const nuevoInput = document.createElement("input");
	nuevoInput.type = "text";
	nuevoInput.name = "tagsTl[]";
	nuevoInput.classList.add("form-control");
	nuevoInput.addEventListener("change", validarTag);
	contenedorTags.append(nuevoInput);
}

function rellenarModalConfigTl(datosTl, modalBody) {
	const nombre = modalBody.firstElementChild.lastElementChild;
	nombre.value = datosTl.nombre;
	nombre.classList.add("input-valido");
	nombre.setAttribute("data-value", datosTl.nombre);

	const usuarios = modalBody.children[1].firstElementChild;
	datosTl.autor.forEach((autor) => {
		usuarios.lastElementChild.previousElementSibling.value = autor;
		usuarios.lastElementChild.previousElementSibling.classList.add("input-valido");
		crearNuevoInputUsuario(usuarios.lastElementChild);
	});

	const tags = modalBody.children[1].lastElementChild;
	datosTl.tags.forEach((tag) => {
		tags.lastElementChild.value = tag;
		tags.lastElementChild.classList.add("input-valido");
		crearNuevoInputTags(tags.lastElementChild);
	});

	const fecha = modalBody.children[2].lastElementChild;
	for (let option of fecha) {
		if (option.value === datosTl.fechaFormateada.opcion) option.selected = true;
	}

	if (datosTl.fechaFormateada.opcion === "elegir") {
		const contenedorFechas = modalBody.children[3];
		contenedorFechas.classList.remove("ocultar");

		const fechaDesde = new Date(datosTl.fechaFormateada.$gte);
		contenedorFechas.firstElementChild.lastElementChild.value = `${fechaDesde.getFullYear()}-${(fechaDesde.getMonth() + 1)
			.toString()
			.padStart(2, "0")}-${fechaDesde.getDate().toString().padStart(2, "0")}`;

		contenedorFechas.firstElementChild.lastElementChild.classList.add("input-valido");

		if (datosTl.fechaFormateada.$lte) {
			const fechaHasta = new Date(datosTl.fechaFormateada.$lte);
			contenedorFechas.lastElementChild.lastElementChild.value = `${fechaHasta.getFullYear()}-${(fechaHasta.getMonth() + 1)
				.toString()
				.padStart(2, "0")}-${fechaHasta.getDate().toString().padStart(2, "0")}`;

			contenedorFechas.lastElementChild.lastElementChild.classList.add("input-valido");
		}
	}

	const orden = modalBody.lastElementChild.lastElementChild;
	for (let option of orden) {
		if (option.value === datosTl.orden) option.selected = true;
	}
}

function resetearModalTl(modalBody) {
	modalBody.previousElementSibling.firstElementChild.textContent = "Crear nuevo timeline";
	modalBody.nextElementSibling.lastElementChild.value = "Crear";
	modalBody.nextElementSibling.firstElementChild.value = "post";
	modalBody.nextElementSibling.children[1].value = "Timeline";

	const errores = document.querySelectorAll(".error-input");
	errores.forEach((error) => error.remove());

	const nombre = modalBody.firstElementChild.lastElementChild;
	nombre.value = "";
	nombre.classList.remove("input-valido");
	nombre.classList.remove("input-no-valido");
	nombre.setAttribute("data-value", "");

	const usuarios = modalBody.children[1].firstElementChild;
	usuarios.children[1].value = "";
	usuarios.children[1].classList.remove("input-valido");
	usuarios.children[1].classList.remove("input-no-valido");
	for (let i = usuarios.children.length - 1; i > 2; i--) {
		usuarios.children[i].remove();
	}

	const tags = modalBody.children[1].lastElementChild;
	tags.children[1].value = "";
	tags.children[1].classList.remove("input-valido");
	tags.children[1].classList.remove("input-no-valido");
	for (let i = tags.children.length - 1; i > 1; i--) {
		tags.children[i].remove();
	}

	const fecha = modalBody.children[2].lastElementChild;
	for (let option of fecha) {
		if (option.value === "dia") option.selected = true;
	}

	const contenedorFechas = modalBody.children[3];
	contenedorFechas.classList.add("ocultar");
	contenedorFechas.firstElementChild.lastElementChild.value = "";
	contenedorFechas.firstElementChild.lastElementChild.classList.remove("input-valido");
	contenedorFechas.firstElementChild.lastElementChild.classList.remove("input-no-valido");
	contenedorFechas.lastElementChild.lastElementChild.value = "";
	contenedorFechas.lastElementChild.lastElementChild.classList.remove("input-valido");
	contenedorFechas.lastElementChild.lastElementChild.classList.remove("input-no-valido");

	const orden = modalBody.lastElementChild.lastElementChild;
	for (let option of orden) {
		if (option.value === "-fecha") option.selected = true;
	}
}

export {
	crearElemAutocompletar,
	crearAutocompletarUsuariosTL,
	crearNuevoInputUsuario,
	crearNuevoInputTags,
	rellenarModalConfigTl,
	resetearModalTl,
};
