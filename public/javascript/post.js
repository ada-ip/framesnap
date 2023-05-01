import { anyadirPosts } from "./modules/dom.js";

const favImgs = document.querySelectorAll(".img-fav");

favImgs.forEach((img) => anyadirEventoFavoritear(img));

const btnCargarPosts = document.getElementById("cargarPosts");
if (btnCargarPosts) {
	btnCargarPosts.addEventListener("click", (e) => {
		let timeline = document.getElementById("timelines").firstElementChild.firstElementChild.firstElementChild.textContent;
		let datoUltimoPost = "";
		if (timeline === "Timeline") {
			datoUltimoPost =
				document.getElementById("posts").firstElementChild.lastElementChild.previousElementSibling.firstElementChild
					.dataset.fecha;
		}

		let url = "/api/v1/posts/?datoPost=" + datoUltimoPost;
		if (timeline !== "Timeline") url += "&timeline=" + timeline;

		console.log(url);

		fetch(url)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((posts) => {
				anyadirPosts(posts, e.target);
				document.querySelectorAll(".img-fav").forEach((img) => anyadirEventoFavoritear(img));
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
