import { anyadirPosts } from "./modules/dom.js";
import { calcularFechaPost } from "./modules/fechas.js";

const spansFechaPosts = document.querySelectorAll(".span-fecha-post");
spansFechaPosts.forEach((span) => {
	span.textContent = calcularFechaPost(new Date(), new Date(span.dataset.fecha));
	delete span.dataset.fecha;
});

const favImgs = document.querySelectorAll(".img-fav");

favImgs.forEach((img) => anyadirEventoFavoritear(img));

const btnCargarPosts = document.getElementById("cargarPosts");
if (btnCargarPosts) {
	btnCargarPosts.addEventListener("click", (e) => {
		let timeline = document.getElementById("timelineActual");

		// const ultimoPost =
		// 	document.getElementById("cont-posts").lastElementChild.previousElementSibling.firstElementChild;
		const posts = document.querySelectorAll("#cont-posts .card");
		const ultimoPost = posts[posts.length - 1];
		console.log(ultimoPost);
		const datosUltimoPost = {
			fecha: ultimoPost.dataset.fecha,
			timeline: timeline.textContent.trim(),
		};

		if (datosUltimoPost.timeline !== "Timeline") {
			datosUltimoPost.ordenTl = timeline.dataset.orden;
			if (datosUltimoPost.ordenTl === "numFavs" || datosUltimoPost.ordenTl === "-numFavs") {
				// const elemNumFavs = ultimoPost.lastElementChild.firstElementChild.firstElementChild;
				const elemNumFavs = ultimoPost.querySelector(".num-favs");
				datosUltimoPost.dato = elemNumFavs.textContent.substring(0, elemNumFavs.textContent.indexOf(" "));
			} else if (datosUltimoPost.ordenTl === "numSeguidores" || datosUltimoPost.ordenTl === "-numSeguidores") {
				datosUltimoPost.dato = ultimoPost.dataset.seguidores;
			}
		}

		let url = "/api/v1/posts/cargarmasposts";

		fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(datosUltimoPost),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((posts) => {
				if (posts.length === 0) {
					e.target.textContent = "Parece que no hay más posts";
					e.target.disabled = true;
				} else {
					anyadirPosts(posts, e.target);
					document.querySelectorAll(".img-fav").forEach((img) => anyadirEventoFavoritear(img));
				}
			})
			.catch((error) => {
				//
			});
	});
}

const btnCargarPostsUsuario = document.getElementById("cargarPostsUsuario");
if (btnCargarPostsUsuario) {
	btnCargarPostsUsuario.addEventListener("click", (e) => {
		const datosUltimoPost = {
			fechaPost: e.target.parentElement.previousElementSibling.firstElementChild.dataset.fecha,
		};

		let url = "/api/v1/posts/" + e.target.parentElement.parentElement.dataset.usuario + "/cargarmasposts";

		fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(datosUltimoPost),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((posts) => {
				if (posts.length === 0) {
					e.target.textContent = "Parece que no hay más posts";
					e.target.disabled = true;
				} else {
					anyadirPosts(posts, e.target);
					document.querySelectorAll(".img-fav").forEach((img) => anyadirEventoFavoritear(img));
				}
			})
			.catch((error) => {
				//
			});
	});
}

const btnCargarPostsTag = document.getElementById("cargarPostsTag");
if (btnCargarPostsTag) {
	btnCargarPostsTag.addEventListener("click", (e) => {
		const query = window.location.search.substring(1).split("&");
		const fechaPosts = query.length > 1 ? query[0].substring(query[0].indexOf("=") + 1) : "mes";
		const tag =
			query.length > 1 ? query[1].substring(query[1].indexOf("=") + 1) : query[0].substring(query[0].indexOf("=") + 1);

		const ultimoPost =
			document.getElementById("posts").firstElementChild.lastElementChild.previousElementSibling.firstElementChild;
		const elemNumFavs = ultimoPost.lastElementChild.firstElementChild.firstElementChild;

		const datosUltimoPost = {
			fechaUltimoPost: ultimoPost.dataset.fecha,
			numFavs: elemNumFavs.textContent.substring(0, elemNumFavs.textContent.indexOf(" ")),
			fechaPosts: fechaPosts,
			q: tag,
		};

		let url = "/posts";

		fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(datosUltimoPost),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((posts) => {
				if (posts.length === 0) {
					e.target.textContent = "Parece que no hay más posts";
					e.target.disabled = true;
				} else {
					anyadirPosts(posts, e.target);
					document.querySelectorAll(".img-fav").forEach((img) => anyadirEventoFavoritear(img));
				}
			})
			.catch((error) => {
				//
			});
	});
}

function anyadirEventoFavoritear(img) {
	img.addEventListener("click", (e) => {
		const idPost = e.target.parentElement.parentElement.id.replace("post", "");

		let url = `/api/v1/posts/${idPost}`;
		url += e.target.src.includes("no-fav.png") ? "/fav" : "/desfav";

		fetch(url, { method: "PATCH" })
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((resultado) => {
				const elemNumFavoritos = e.target.previousElementSibling;
				let numFavoritos = parseInt(elemNumFavoritos.textContent.substring(0, elemNumFavoritos.textContent.indexOf(" ")));
				if (e.target.src.includes("no-fav.png")) {
					elemNumFavoritos.textContent = `${numFavoritos + 1} favorito`;
					if (numFavoritos + 1 !== 1) elemNumFavoritos.textContent += "s";
				} else {
					elemNumFavoritos.textContent = `${numFavoritos - 1} favorito`;
					if (numFavoritos - 1 !== 1) elemNumFavoritos.textContent += "s";
				}
				e.target.src = e.target.src.includes("no-fav.png") ? "/images/fav.png" : "/images/no-fav.png";
			})
			.catch((error) => {});
	});
}
