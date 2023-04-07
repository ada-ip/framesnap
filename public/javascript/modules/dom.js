function crearElemAutocompletar(elementos) {
	let texto = "";
	elementos.forEach((elem) => {
		texto += "<li>";
		texto += `<a class="dropdown-item" href="/usuarios/${elem.nombre}">${elem.nombre}</a>`;
		texto += "</li>";
	});

	texto += "<li><input type='submit' value='Buscar usuarios'></li>";
	texto += "<li><input formaction='/posts' type='submit' value='Buscar por tags'></li>";

	return texto;
}

export { crearElemAutocompletar };
