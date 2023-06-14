/**
 * Esté módulo ofrece una función que transforma la fecha de un post almacenado en la base de datos a una cadena de texto legible
 * y al huso horario del cliente.
 *
 * Funciones:
 * - calcularFechaPost: Calcula la cantidad de tiempo que ha pasado entre una fecha de publicación y la fecha actual y devuelve una
 * 						cadena de texto legible que representa ese periodo de tiempo.
 */

/**
 * Calcula la cantidad de tiempo que ha pasado entre una fecha de publicación y la fecha actual y devuelve una
 * cadena de texto legible que representa ese periodo de tiempo.
 *
 * @param {Date} fechaActual 	La fecha actual.
 * @param {Date} fechaPost 		La fecha en la que se publicó el post.
 *
 * @returns {string} 			Una cadena de texto que representa la cantidad de tiempo que ha pasado desde la fecha de
 *								publicación hasta la fecha actual.
 * 								El formato de la cadena devuelta varía según el intervalo de tiempo: puede indicar los segundos que
 *								han pasado, o los minutos, horas o días. Si han pasado dos o más días, la función devuelve la fecha
 *								exacta de publicación.
 */
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
