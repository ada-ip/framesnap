function crearElemAutocompletar(elementos) {
	let texto = "";
	elementos.forEach((elem) => {
		texto += "<li>";
		texto += `<a class="dropdown-item" href="/usuarios/${elem.nombre}">${elem.nombre}</a>`;
		texto += "</li>";
	});

	texto += "<li><input type='submit' value='Buscar usuarios'></li>";
	texto += "<li><input formaction='/posts' type='submit' value='Buscar por tags'></li>";

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
	const contenedorUsuarios = elemAutocompletar.parentElement.parentElement;

	const nuevoInput = document.createElement("input");
	nuevoInput.type = "text";
	nuevoInput.name = "usuarios-tl[]";
	nuevoInput.classList.add("form-control");
	contenedorUsuarios.append(nuevoInput);

	const nuevaUl = document.createElement("ul");
	nuevaUl.classList.add("dropdown-menu");
	nuevaUl.classList.add("text-small");
	contenedorUsuarios.append(nuevaUl);
}

export { crearElemAutocompletar, crearAutocompletarUsuariosTL, crearNuevoInputUsuario };
