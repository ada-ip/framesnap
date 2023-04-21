import { validarTag, autocompletarUsuarioTL } from "./listeners.js";

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

function crearModalConfigTl() {
	const modal = document.createElement("div");
	modal.classList.add("modal");
	modal.classList.add("fade");
	modal.classList.add("show");
	modal.id = "config-timeline";
	modal.setAttribute("tabindex", "-1");
	modal.setAttribute("aria-labelledby", "ConfigurarTimeline");
	modal.setAttribute("aria-modal", true);
	modal.setAttribute("role", "dialog");
	modal.setAttribute("style", "display:block;");
	modal.innerHTML = `<div class="modal-dialog">
							<form action="/api/v1/usuarios/tls" method="POST" class="modal-content">
								<div class="modal-header">
									<h1 class="modal-title fs-5" id="crearTLModalLabel">Crear nuevo timeline</h1>
									<button
										type="button"
										class="btn-close"
										data-bs-dismiss="modal"
										aria-label="Close"
									></button>
								</div>
								<div class="modal-body">
									<div class="mb-3">
										<label for="nombreTl" class="col-form-label">Nombre:</label>
										<input type="text" class="form-control" id="nombreTl" name="nombreTl" />
									</div>
									<div class="row mb-3">
										<div class="column col-6">
											<label for="usuariosTl" class="col-form-label">Añadir usuarios:</label>
											<input type="text" class="form-control" name="usuariosTl[]" />
											<ul class="dropdown-menu text-small autocompletar-tl-ul"></ul>
										</div>
										<div class="column col-6">
											<label for="tagsTl" class="col-form-label">Añadir tags:</label>
											<input type="text" class="form-control" name="tagsTl[]" />
										</div>
									</div>
									<div class="mb-3">
										<label for="fechaTl" class="col-form-label">Fecha de subida:</label>
										<select class="form-select input-valido" id="fechaTl" name="fechaTl">
											<option value="dia" selected>Hoy</option>
											<option value="semana">Esta semana</option>
											<option value="mes">Este mes</option>
											<option value="smes">Desde hace 6 meses</option>
											<option value="elegir">Elegir fecha</option>
										</select>
									</div>
									<div class="row mb-3 ocultar" id="rango-fechas-tl">
										<div class="column col-6">
											<label for="desdeTl" class="col-form-label">Desde:</label>
											<input type="date" class="form-control" id="desdeTl" name="desdeTl" />
										</div>
										<div class="column col-6">
											<label for="hastaTl" class="col-form-label">Hasta:</label>
											<input type="date" class="form-control" id="hastaTl" name="hastaTl" />
										</div>
									</div>
									<div class="mb-3">
										<label for="ordenTl" class="col-form-label">Orden:</label>
										<select class="form-select input-valido" id="ordenTl" name="ordenTl">
											<option value="-fecha" selected>Más reciente</option>
											<option value="fecha">Más antiguo</option>
											<option value="-numFavs">Mayor número de favoritos</option>
											<option value="numFavs">Menor número de favoritos</option>
											<option value="-numSeguidores">Mayor número de seguidores</option>
											<option value="numSeguidores">Menor número de seguidores</option>
										</select>
									</div>
								</div>
								<div class="modal-footer">
									<input type="submit" class="btn btn-primary" value="Crear" />
								</div>
							</form>
						</div>`;

	modal.firstElementChild.firstElementChild.firstElementChild.children[1].addEventListener("click", (e) =>
		e.target.parentElement.parentElement.parentElement.parentElement.remove()
	);

	document.body.append(modal);
}

export { crearElemAutocompletar, crearAutocompletarUsuariosTL, crearNuevoInputUsuario, crearNuevoInputTags, crearModalConfigTl };
