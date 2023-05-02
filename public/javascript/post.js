import { anyadirPosts } from "./modules/dom.js";

const favImgs = document.querySelectorAll(".img-fav");

favImgs.forEach((img) => anyadirEventoFavoritear(img));

const btnCargarPosts = document.getElementById("cargarPosts");
if (btnCargarPosts) {
	btnCargarPosts.addEventListener("click", (e) => {
		let timeline = document.getElementById("timelines").firstElementChild.firstElementChild.firstElementChild;

		const ultimoPost =
			document.getElementById("posts").firstElementChild.lastElementChild.previousElementSibling.firstElementChild;
		const datosUltimoPost = {
			fecha: ultimoPost.dataset.fecha,
		};

		if (timeline.textContent.trim() !== "Timeline") {
			datosUltimoPost.orden = timeline.dataset.orden;
			if (datosUltimoPost.orden === "numFavs" || datosUltimoPost.orden === "-numFavs") {
				const elemNumFavs = ultimoPost.lastElementChild.firstElementChild.firstElementChild;
				datosUltimoPost.dato = elemNumFavs.textContent.substring(0, elemNumFavs.textContent.indexOf(" "));
			} else if (datosUltimoPost.orden === "numSeguidores" || datosUltimoPost.orden === "-numSeguidores") {
				datosUltimoPost.dato = ultimoPost.dataset.seguidores;
			}
		}

		let url = "/api/v1/posts/?fechaPost=" + datosUltimoPost.fecha;
		if (timeline.textContent.trim() !== "Timeline")
			url +=
				"&datoPost=" +
				datosUltimoPost.dato +
				"&ordenTl=" +
				datosUltimoPost.orden +
				"&timeline=" +
				timeline.textContent.trim();

		fetch(url)
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
				console.log(error);
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
