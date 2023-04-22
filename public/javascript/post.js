const favImgs = document.querySelectorAll(".img-fav");

favImgs.forEach((img) => anyadirEventoFavoritear(img));

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
