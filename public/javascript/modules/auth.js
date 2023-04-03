function comprobarValidez(input, validador, error, boton) {
	let valor = input.value.trim();
	if (!validador(valor)) {
		input.classList.remove("input-valido");
		input.classList.add("input-no-valido");
		deshabilitarBoton(boton);
		crearMensajeError(input, error);
	} else {
		input.classList.remove("input-no-valido");
		input.classList.add("input-valido");
		borrarMensajeError(input);
	}
}

function comprobarContrasenyas(input1, input2, boton) {
	let pass2 = input2.value.trim();
	let pass1 = input1.value.trim();
	if (pass2 != "" && pass1 != "") {
		if (pass2 === pass1) {
			input2.classList.remove("input-no-valido");
			input2.classList.add("input-valido");
			borrarMensajeError(input2);
		} else {
			input2.classList.remove("input-valido");
			input2.classList.add("input-no-valido");
			deshabilitarBoton(boton);
			let mensajeError = "Las contraseñas no son iguales";
			crearMensajeError(input2, mensajeError);
		}
	}
}

function nombreValido(nombre) {
	let regex = /^[a-z0-9]{3,20}$/i;
	return regex.test(nombre);
}

function correoValido(correo) {
	let regex = /^[a-z0-9]([a-z0-9]|\.(?!\.))*@[a-z0-9]+(\.[a-z]+)+$/i;
	return regex.test(correo);
}

function contrasenyaValida(pass) {
	let regex = /^[a-z0-9@$!%*#?&,;\:\-\_]{6,}$/;
	return regex.test(pass);
}

function habilitarBoton(boton) {
	boton.disabled = false;
}

function deshabilitarBoton(boton) {
	boton.disabled = true;
}

function comprobarInputs(inputs, boton) {
	if (inputs.every((input) => input.classList.contains("input-valido"))) {
		habilitarBoton(boton);
	}
}

function crearMensajeError(input, mensaje) {
	if (!input.nextElementSibling) {
		const p = document.createElement("p");
		p.classList.add("error-input");
		p.textContent = mensaje;
		input.insertAdjacentElement("afterend", p);
	}
}

function borrarMensajeError(input) {
	if (input.nextElementSibling) {
		input.nextElementSibling.remove();
	}
}

export {
	comprobarValidez,
	comprobarContrasenyas,
	nombreValido,
	correoValido,
	contrasenyaValida,
	habilitarBoton,
	deshabilitarBoton,
	comprobarInputs,
	crearMensajeError,
	borrarMensajeError
};
