const btnSeguir = document.getElementById("btn-seguir");

btnSeguir.addEventListener("click", (e) => {
	let textoBtn = e.target.textContent.trim();

	if (textoBtn === "Seguir") {
		let url = "/api/v1/usuarios/" + e.target.previousElementSibling.textContent + "/seguir";

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
				console.log(resultado);
				if (resultado.estado === "ok") e.target.textContent = "Dejar de seguir";
			})
			.catch((error) => {});
	} else {
		console.log("adiós");
	}
});
