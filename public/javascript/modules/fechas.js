function calcularFechaPost(fechaActual, fechaPost) {
	let fechaAMostrar;
	if (fechaActual - fechaPost < 1000 * 60) {
		fechaAMostrar = `Hace ${Math.round((fechaActual - fechaPost) / 1000)} segundo${
			Math.round((fechaActual - fechaPost) / 1000) !== 1 ? "s" : ""
		}`;
	} else if (fechaActual - fechaPost < 1000 * 60 * 60) {
		fechaAMostrar = `Hace ${Math.floor((fechaActual - fechaPost) / (1000 * 60))} minuto${
			Math.floor((fechaActual - fechaPost) / (1000 * 60)) !== 1 ? "s" : ""
		}`;
	} else if (fechaActual - fechaPost < 1000 * 60 * 60 * 24) {
		fechaAMostrar = `Hace ${Math.floor((fechaActual - fechaPost) / (1000 * 60 * 60))} hora${
			Math.floor((fechaActual - fechaPost) / (1000 * 60 * 60)) !== 1 ? "s" : ""
		}`;
	} else if (fechaActual - fechaPost < 1000 * 60 * 60 * 24 * 2) {
		fechaAMostrar = "Hace 1 día";
	} else {
		fechaAMostrar = `${fechaPost.getDate()}/${fechaPost.getMonth() + 1}/${fechaPost.getFullYear()}`;
	}

	return fechaAMostrar;
}

export { calcularFechaPost };
