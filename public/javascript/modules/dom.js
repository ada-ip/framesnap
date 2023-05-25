import { validarTag, autocompletarUsuarioTL, borrarTimeline } from "./listeners.js";
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

	const btnBorrar = document.createElement("input");
	btnBorrar.type = "submit";
	btnBorrar.value = "Borrar Timeline";
	btnBorrar.classList.add("btn");
	btnBorrar.classList.add("btn-primary");
	btnBorrar.classList.add("me-2");
	btnBorrar.addEventListener("click", borrarTimeline);

	const btnGuardar = modalBody.nextElementSibling.lastElementChild;
	btnGuardar.insertAdjacentElement("beforebegin", btnBorrar);
}

function resetearModalTl(modalBody) {
	modalBody.previousElementSibling.firstElementChild.textContent = "Crear nuevo timeline";
	modalBody.nextElementSibling.lastElementChild.value = "Crear";
	modalBody.nextElementSibling.lastElementChild.previousElementSibling.remove();
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
									<span>
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
									<span>${post.numFavs} favorito${post.numFavs !== 1 ? "s" : ""}</span>
									<img
										src="${post.esFavorito ? "/images/fav.png" : "/images/no-fav.png"}"
										alt="haz click para des/favoritear el post"
										class="img-fav"
										width="24"
										height="24"
									/>
								</div>

								<p class="card-text mb-2"></p>
							</div>
						</div>`;

		const palabrasTexto = post.texto.split(" ");
		for (let palabra of palabrasTexto) {
			if (palabra.startsWith("#")) {
				div.firstElementChild.lastElementChild.lastElementChild.innerHTML += `<a
						href="posts?q=${palabra.substring(1)}"
						class="hashtag-post"
						>${palabra}</a
					> `;
			} else {
				div.firstElementChild.lastElementChild.lastElementChild.innerHTML += `${palabra} `;
			}
		}

		if (post.numSeguidores != null) div.firstElementChild.dataset.seguidores = post.numSeguidores;

		const elemFechaPost = div.firstElementChild.firstElementChild.lastElementChild.lastElementChild;
		elemFechaPost.textContent = calcularFechaPost(new Date(), new Date(post.fecha));

		btnCargar.parentElement.insertAdjacentElement("beforebegin", div);
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
};
