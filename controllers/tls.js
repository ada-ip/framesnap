const User = require("../models/User");

const esTlRepetido = async (req, res, next) => {
	const { nombreTL } = req.params;
	try {
		const tl = await User.findOne({ _id: req.session.idUsuario, "tls.nombre": nombreTL }).select("_id");

		if (tl) {
			res.status(200).json({ esRepetido: true });
		} else {
			res.status(200).json({ esRepetido: false });
		}
	} catch (error) {
		next(error);
	}
};

const crearTl = async (req, res, next) => {
	try {
		const { nombreTl, usuariosTl, tagsTl, fechaTl, desdeTl, hastaTl, ordenTl } = req.body;

		if (nombreTl === "" || fechaTl === "" || ordenTl === "") throw new Error("No se han rellenado los campos obligatorios.");

		const paramsNuevoTl = {
			nombre: nombreTl,
			config: {
				filtro: {
					autor: [],
					tags: tagsTl.filter((tag) => tag !== ""),
					fecha: {},
				},
				orden: ordenTl,
			},
		};

		const idUsuarios = await User.find({ nombre: { $in: usuariosTl.filter((usuario) => usuario !== "") } }).select("_id");
		paramsNuevoTl.config.filtro.autor = idUsuarios.map((usuario) => usuario._id);

		if (fechaTl === "elegir" && desdeTl !== "") {
			paramsNuevoTl.config.filtro.fecha["$gte"] = new Date(desdeTl).toISOString();
		}
		if (fechaTl === "elegir" && hastaTl !== "") {
			paramsNuevoTl.config.filtro.fecha["$lte"] = new Date(hastaTl).toISOString();
		}
		if (fechaTl !== "elegir") {
			const tiempo = {
				dia: 1,
				semana: 7,
				mes: 30,
				smes: 6 * 30,
			};

			paramsNuevoTl.config.filtro.fecha["$gte"] = 24 * 60 * 60 * 1000 * tiempo[fechaTl];
		}

		const usuario = await User.findByIdAndUpdate(req.session.idUsuario, {
			$push: {
				tls: paramsNuevoTl,
			},
		});

		res.redirect("/?timeline=" + paramsNuevoTl.nombre);
	} catch (error) {
		next(error);
	}
};

module.exports = {
	esTlRepetido,
	crearTl,
};
