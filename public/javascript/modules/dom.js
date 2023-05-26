import { validarTag, autocompletarUsuarioTL, borrarTimeline, seguirUsuario } from "./listeners.js";
import { calcularFechaPost } from "./fechas.js";

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
	nuevoInput.classList.add("mt-2");
	autocompletarUsuarioTL(nuevoInput);
	contenedorUsuarios.append(nuevoInput);

	const nuevaUl = document.createElement("ul");
	nuevaUl.classList.add("dropdown-menu");
	nuevaUl.classList.add("text-small");
	nuevaUl.classList.add("autocompletar-tl-ul");
	contenedorUsuarios.append(nuevaUl);
}

function crearNuevoInputTags(ultimoTag) {
	const contenedorTags = ultimoTag.parentElement;

	const nuevoInput = document.createElement("input");
	nuevoInput.type = "text";
	nuevoInput.name = "tagsTl[]";
	nuevoInput.classList.add("form-control");
	nuevoInput.classList.add("mt-2");
	nuevoInput.addEventListener("change", validarTag);
	contenedorTags.append(nuevoInput);
}

function rellenarModalConfigTl(datosTl, modalBody) {
	const nombre = modalBody.querySelector("#nombreTl");
	nombre.value = datosTl.nombre;
	nombre.classList.add("input-valido");
	nombre.setAttribute("data-value", datosTl.nombre);

	const usuarios = modalBody.querySelector("#contUsuariosTl");
	datosTl.autor.forEach((autor) => {
		usuarios.lastElementChild.previousElementSibling.value = autor;
		usuarios.lastElementChild.previousElementSibling.classList.add("input-valido");
		crearNuevoInputUsuario(usuarios.lastElementChild);
	});

	const tags = modalBody.querySelector("#contTagsTl");
	datosTl.tags.forEach((tag) => {
		tags.lastElementChild.value = tag;
		tags.lastElementChild.classList.add("input-valido");
		crearNuevoInputTags(tags.lastElementChild);
	});

	const fecha = modalBody.querySelector("#fechaTl");
	for (let option of fecha) {
		if (option.value === datosTl.fechaFormateada.opcion) option.selected = true;
	}

	if (datosTl.fechaFormateada.opcion === "elegir") {
		const contenedorFechas = modalBody.querySelector("#rango-fechas-tl");
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

	const orden = modalBody.querySelector("#ordenTl");
	for (let option of orden) {
		if (option.value === datosTl.orden) option.selected = true;
	}

	const btnBorrar = document.createElement("input");
	btnBorrar.type = "submit";
	btnBorrar.value = "Borrar Timeline";
	btnBorrar.id = "borrarTLModalBtn";
	btnBorrar.classList.add("btn");
	btnBorrar.classList.add("btn-primary");
	btnBorrar.classList.add("me-2");
	btnBorrar.addEventListener("click", borrarTimeline);

	const btnGuardar = modalBody.parentElement.querySelector("#crearTLModalBtn");
	btnGuardar.insertAdjacentElement("beforebegin", btnBorrar);
}

function resetearModalTl(modalBody) {
	modalBody.parentElement.querySelector("#crearTLModalLabel").value = "Crear nuevo timeline";
	modalBody.parentElement.querySelector("#crearTLModalBtn").value = "Crear";
	const btnBorrarTl = modalBody.parentElement.querySelector("#borrarTLModalBtn");
	if (btnBorrarTl) btnBorrarTl.remove();
	modalBody.parentElement.querySelector("input[name=metodo]").value = "post";
	modalBody.parentElement.querySelector("input[name=anteriorNombre]").value = "Timeline";

	const errores = document.querySelectorAll(".error-input");
	errores.forEach((error) => error.remove());

	const nombre = modalBody.querySelector("#nombreTl");
	nombre.value = "";
	nombre.classList.remove("input-valido");
	nombre.classList.remove("input-no-valido");
	nombre.setAttribute("data-value", "");

	const usuarios = modalBody.querySelector("#contUsuariosTl");
	usuarios.children[1].value = "";
	usuarios.children[1].classList.remove("input-valido");
	usuarios.children[1].classList.remove("input-no-valido");
	for (let i = usuarios.children.length - 1; i > 2; i--) {
		usuarios.children[i].remove();
	}

	const tags = modalBody.querySelector("#contTagsTl");
	tags.children[1].value = "";
	tags.children[1].classList.remove("input-valido");
	tags.children[1].classList.remove("input-no-valido");
	for (let i = tags.children.length - 1; i > 1; i--) {
		tags.children[i].remove();
	}

	const fecha = modalBody.querySelector("#fechaTl");
	for (let option of fecha) {
		if (option.value === "dia") option.selected = true;
	}

	const contenedorFechas = modalBody.querySelector("#rango-fechas-tl");
	contenedorFechas.classList.add("ocultar");
	contenedorFechas.firstElementChild.lastElementChild.value = "";
	contenedorFechas.firstElementChild.lastElementChild.classList.remove("input-valido");
	contenedorFechas.firstElementChild.lastElementChild.classList.remove("input-no-valido");
	contenedorFechas.lastElementChild.lastElementChild.value = "";
	contenedorFechas.lastElementChild.lastElementChild.classList.remove("input-valido");
	contenedorFechas.lastElementChild.lastElementChild.classList.remove("input-no-valido");

	const orden = modalBody.querySelector("#ordenTl");
	for (let option of orden) {
		if (option.value === "-fecha") option.selected = true;
	}

	const elemsAutocompletar = document.querySelectorAll(".autocompletar-tl-ul");
	elemsAutocompletar.forEach((elem) => {
		for (let child of elem.children) {
			child.remove();
		}

		elem.classList.remove("mostrar");
	});
}

function anyadirPosts(posts, btnCargar) {
	posts.forEach((post) => {
		const div = document.createElement("div");
		div.classList.add("col");
		div.innerHTML = `<div class="card shadow-sm" data-fecha="${post.fecha}" >
							<div class="card-title pt-2 px-2 d-flex align-items-center gap-2">
								<a href="/usuarios/${post.autor.nombre}"
									><img
										src="${post.signedUrlAutor}"
										alt="foto de perfil de ${post.autor.nombre}"
										width="60"
										height="60"
										class="rounded-circle foto-perfil-nav"
										loading="lazy"
								/></a>

								<div class="cont-text-cabecera-post d-flex flex-wrap align-items-center gap-2">
									<a href="/usuarios/${post.autor.nombre}">${post.autor.nombre}</a>
									<div class="vr mx-1"></div>
									<span id="fecha${post._id}">
									</span>
								</div>
							</div>
							<img
								src="${post.signedUrlPost}"
								alt=""
								width="100%"
								class="bd-placeholder-img card-img-top post-img mt-1"
								preserveAspectRatio="xMidYMid slice"
								loading="lazy"
							/>
							<div class="card-body" id="post${post._id}">
								<div class="d-flex justify-content-between align-items-center mb-4">
									<span class="num-favs fw-semibold">${post.numFavs} favorito${post.numFavs !== 1 ? "s" : ""}</span>
									<img
										src="${post.esFavorito ? "/images/fav.png" : "/images/no-fav.png"}"
										alt="haz click para des/favoritear el post"
										class="img-fav"
										width="24"
										height="24"
									/>
								</div>

								<p id="textoPost${post._id}" class="card-text mb-2"></p>
							</div>
						</div>`;

		btnCargar.parentElement.insertAdjacentElement("beforebegin", div);

		const textoPost = document.getElementById(`textoPost${post._id}`);
		const palabrasTexto = post.texto.split(" ");
		for (let palabra of palabrasTexto) {
			if (palabra.startsWith("#")) {
				textoPost.innerHTML += `<a
						href="/posts?q=${palabra.substring(1)}"
						class="hashtag-post"
						>${palabra}</a
					> `;
			} else {
				textoPost.innerHTML += `${palabra} `;
			}
		}

		if (post.numSeguidores != null) div.firstElementChild.dataset.seguidores = post.numSeguidores;

		const elemFechaPost = document.getElementById(`fecha${post._id}`);
		elemFechaPost.textContent = calcularFechaPost(new Date(), new Date(post.fecha));
	});
}

function anyadirUsuarios(usuarios, btnCargar) {
	usuarios.forEach((usuario) => {
		const div = document.createElement("div");
		div.classList.add("col");
		div.innerHTML = `<div class="card shadow-sm">
							<a href="/usuarios/${usuario.nombre}">
								<div
									class="card-body tarjeta-usuario d-flex flex-wrap flex-sm-nowrap justify-content-center justify-content-sm-between gap-sm-5"
								>
									<div class="contenedor-foto-perfil mb-3 mb-sm-0">
										<img
											src="${usuario.signedUrlUsuario}"
											alt="foto de perfil de ${usuario.nombre}"
											width="80"
											height="80"
											class="rounded-circle foto-perfil-nav"
											loading="lazy"
										/>
										<p class="mt-2 mb-0">${usuario.nombre}</p>
									</div>
									<div
										class="d-flex flex-column justify-content-around flex-grow-1 gap-4 gap-sm-2 pt-2 pt-sm-0"
									>
										<div
											class="contenedor-num-perfil d-flex flex-wrap justify-content-around align-items-center gap-4"
										>
											<p class="mb-0 d-flex flex-column align-items-center">
												<span class="num-seguidores">${usuario.numSeguidores}</span>
												<span>seguidores</span>
											</p>
											<p class="mb-0 d-flex flex-column align-items-center">
												${usuario.numSeguidos} <span>seguidos</span>
											</p>
											<p class="mb-0 d-flex flex-column align-items-center">
												${usuario.numPosts}
												<span>post${usuario.numPosts !== 1 ? "s" : ""}</span>
											</p>
										</div>
										<button
											type="button"
											class="btn btn-primary btn-seguir align-self-center"
											data-usuario="${usuario.nombre}"
										>
											${usuario.esSeguidor ? "Dejar de seguir" : "Seguir"}
										</button>
									</div>
								</div>
							</a>
						</div>`;

		btnCargar.parentElement.insertAdjacentElement("beforebegin", div);

		const btnSeguir = document.getElementById(`btnSeguir${usuario._id}`);
		btnSeguir.addEventListener("click", seguirUsuario);
	});
}

export {
	crearElemAutocompletar,
	crearAutocompletarUsuariosTL,
	crearNuevoInputUsuario,
	crearNuevoInputTags,
	rellenarModalConfigTl,
	resetearModalTl,
	anyadirPosts,
	anyadirUsuarios,
};
