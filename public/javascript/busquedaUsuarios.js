let clicksCargarMasUsuarios = 0;

const btnCargarTarjetasUsuarios = document.getElementById("cargarTarjetasUsuarios");
if (btnCargarTarjetasUsuarios) {
	btnCargarTarjetasUsuarios.addEventListener("click", (e) => {
		clicksCargarMasUsuarios += 15;

		let url = window.location.href + `&skip=${clicksCargarMasUsuarios}`;

		fetch(url)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Error status: ${response.status}`);
				}
				return response.json();
			})
			.then((respuesta) => {
				if (respuesta.usuarios.length === 0) {
					e.target.textContent = "Parece que no hay más usuarios";
					e.target.disabled = true;
				} else {
					console.log(respuesta.usuarios);
					// anyadirPosts(posts, e.target);
					// document.querySelectorAll(".img-fav").forEach((img) => anyadirEventoFavoritear(img));
				}
			})
			.catch((error) => {
				console.log(error);
			});
	});
}
