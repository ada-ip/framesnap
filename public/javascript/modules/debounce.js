/**
 * Este módulo proporciona una función que mejora el rendimiento de eventos que pueden dispararse en rápida sucesión
 * limitando la frecuencia con la que se ejecutan al posponerlos hasta que pase un cierto tiempo.
 */

/**
 * Devuelve una versión de la función pasada como parámetro que no será invocada hasta que haya pasado un
 * número determinado de milisegundos desde la última vez que se invocó.
 *
 * @param {Function} func 	La función a devolver.
 * @param {number} wait 	El número de milisegundos que deben pasar para que sea invocada la función.
 * @returns {Function} 		La versión de la función con el límite de frecuencia de ejecución.
 */
function debounce(func, wait) {
	let timeout;
	return function (...args) {
		const context = this;
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(context, args), wait);
	};
}

export { debounce };
