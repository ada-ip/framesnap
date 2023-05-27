function comprobarValidez(input, validador, error, imagen = false) {
	let valor = !imagen ? input.value.trim() : input.files[0];

	if (!validador(valor)) {
		input.classList.remove("input-valido");
		input.classList.add("input-no-valido");
		crearMensajeError(input, error);
	} else {
		input.classList.remove("input-no-valido");
		input.classList.add("input-valido");
		borrarMensajeError(input);
	}
}

function comprobarValidezFechas(inputs, validador, error, fechaIntroducida = 0) {
	if (!validador(inputs)) {
		inputs[fechaIntroducida].classList.remove("input-valido");
		inputs[fechaIntroducida].classList.add("input-no-valido");
		crearMensajeError(inputs[fechaIntroducida], error);
	} else {
		inputs[fechaIntroducida].classList.remove("input-no-valido");
		inputs[fechaIntroducida].classList.add("input-valido");
		borrarMensajeError(inputs[fechaIntroducida]);
	}
}

function comprobarContrasenyas(input1, input2, boton) {
	let pass2 = input2.value.trim();
	let pass1 = input1.value.trim();
	if (pass2 === pass1) {
		input2.classList.remove("input-no-valido");
		input2.classList.add("input-valido");
		borrarMensajeError(input2);
	} else {
		input2.classList.remove("input-valido");
		input2.classList.add("input-no-valido");
		let mensajeError = "Las contraseñas no son iguales";
		crearMensajeError(input2, mensajeError);
	}
}

function nombreValido(nombre) {
	let regex = /^[a-z0-9]{3,30}$/i;
	return regex.test(nombre);
}

function nombreTLValido(nombre) {
	let regex = /^[a-z0-9\-_]{1,20}$/i;
	return regex.test(nombre);
}

function correoValido(correo) {
	let regex = /^[a-z0-9]([a-z0-9]|\.(?!\.))*@[a-z0-9]+(\.[a-z]+)+$/i;
	return regex.test(correo);
}

function contrasenyaValida(pass) {
	let regex = /^[a-zA-Z0-9@$!%*#?&,;\:\-\_]{6,}$/;
	return regex.test(pass);
}

function imagenValida(imagen) {
	if (!imagen) {
		return false;
	}
	const formatosValidos = ["image/jpeg", "image/jpg", "image/png"];
	if (!formatosValidos.includes(imagen.type)) {
		return false;
	} else {
		return imagen.size <= 10000000;
	}
}

function textoValido(texto) {
	if (texto.length > 0 && texto.length <= 1000) {
		return true;
	} else {
		return false;
	}
}

function fechaValida(fechas) {
	if (fechas[0].value != "" && fechas[1].value != "") {
		const fecha1 = new Date(fechas[0].value);
		const fecha2 = new Date(fechas[1].value);

		if (fecha2 < fecha1) return false;
	}

	if (fechas[0].value == "" && fechas[1].value == "") {
		return false;
	}

	return true;
}

function tagValido(tag) {
	let regex = /^\w*$/;
	return regex.test(tag);
}

function comprobarInputs(inputs) {
	if (inputs.every((input) => input.classList.contains("input-valido"))) {
		return true;
	}
}

function crearMensajeError(input, mensaje) {
	if (
		!input.nextElementSibling ||
		(input.nextElementSibling.textContent !== mensaje && !input.nextElementSibling.classList.contains("error-input"))
	) {
		borrarMensajeError(input);
		const p = document.createElement("p");
		p.classList.add("error-input");
		p.textContent = mensaje;
		input.insertAdjacentElement("afterend", p);
	}
}

function borrarMensajeError(input) {
	if (input.nextElementSibling && input.nextElementSibling.classList.contains("error-input")) {
		input.nextElementSibling.remove();
	}
}

function comprobarUsuariosTl(inputs) {
	let inputsValidos = true;
	for (let i = 0; i < inputs.length; i++) {
		if (!(inputs[i].classList.contains("input-valido") || inputs[i].value === "")) {
			inputsValidos = false;
		}
	}
	return inputsValidos;
}

export {
	comprobarValidez,
	comprobarContrasenyas,
	nombreValido,
	correoValido,
	contrasenyaValida,
	comprobarInputs,
	crearMensajeError,
	borrarMensajeError,
	imagenValida,
	textoValido,
	nombreTLValido,
	fechaValida,
	comprobarValidezFechas,
	tagValido,
	comprobarUsuariosTl,
};
