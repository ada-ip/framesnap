const btnSeguir = document.getElementById("btn-seguir");

btnSeguir.addEventListener("click", (e) => {
	let textoBtn = e.target.textContent.trim();

	let url = "/api/v1/usuarios/" + e.target.previousElementSibling.textContent;
	url += textoBtn === "Seguir" ? "/seguir" : "/dejardeseguir";

	fetch(url, {
		method: "PATCH"
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Error status: ${response.status}`);
			}
			return response.json();
		})
		.then((resultado) => {
			if (resultado.estado === "ok" && textoBtn === "Seguir") e.target.textContent = "Dejar de seguir";
			if (resultado.estado === "ok" && textoBtn === "Dejar de seguir") e.target.textContent = "Seguir";
		})
		.catch((error) => {});
});
