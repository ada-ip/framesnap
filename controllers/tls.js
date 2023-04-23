const User = require("../models/User");
const { formatearFechaTl } = require("../utils/metodosConsultas");

const esTlRepetido = async (req, res, next) => {
	const { nombreTl } = req.params;
	try {
		const tl = await User.findOne({ _id: req.session.idUsuario, "tls.nombre": nombreTl }).select("_id");

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
		const { nombreTl, usuariosTl, tagsTl, fechaTl, desdeTl, hastaTl, ordenTl, metodo } = req.body;

		if (nombreTl === "" || fechaTl === "" || ordenTl === "") throw new Error("No se han rellenado los campos obligatorios.");

		const paramsNuevoTl = {
			nombre: nombreTl,
			config: {
				filtro: {
					autor: [],
					tags: tagsTl.filter((tag) => tag !== ""),
					fecha: {}
				},
				orden: ordenTl
			}
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
				smes: 6 * 30
			};

			paramsNuevoTl.config.filtro.fecha["$gte"] = 24 * 60 * 60 * 1000 * tiempo[fechaTl];
		}

		if (metodo === "post") {
			const usuario = await User.updateOne(
				{ _id: req.session.idUsuario },
				{
					$push: {
						tls: paramsNuevoTl
					}
				}
			);
		} else if (req.body.anteriorNombre) {
			const tl = await User.updateOne(
				{ _id: req.session.idUsuario, "tls.nombre": req.body.anteriorNombre },
				{
					$set: {
						"tls.$": paramsNuevoTl
					}
				},
				{ new: true }
			);
		}
		res.redirect("/?timeline=" + paramsNuevoTl.nombre);
	} catch (error) {
		next(error);
	}
};

const obtenerTl = async (req, res, next) => {
	try {
		const { nombreTl } = req.params;

		const tl = await User.aggregate()
			.unwind("$tls")
			.match({ nombre: req.session.usuario, "tls.nombre": nombreTl })
			.lookup({
				from: "users",
				localField: "tls.config.filtro.autor",
				foreignField: "_id",
				as: "tls.autor"
			})
			.project({
				_id: 0,
				nombre: "$tls.nombre",
				autor: "$tls.autor.nombre",
				tags: "$tls.config.filtro.tags",
				fecha: "$tls.config.filtro.fecha",
				orden: "$tls.config.orden"
			});

		res.status(200).json({ ...tl[0], fechaFormateada: formatearFechaTl(tl[0].fecha) });
	} catch (error) {
		next(error);
	}
};

const modificarTl = async (req, res, next) => {
	try {
		const { nombreTl } = req.params;
		const { nombreTl: nuevoNombre, usuariosTl, tagsTl, fechaTl, desdeTl, hastaTl, ordenTl } = req.body;

		if (nuevoNombre === "" || fechaTl === "" || ordenTl === "")
			throw new Error("No se han rellenado los campos obligatorios.");

		const nuevosParamsTl = {
			nombre: nuevoNombre,
			config: {
				filtro: {
					fecha: {}
				},
				orden: ordenTl
			}
		};

		// const idUsuarios = await User.find({ nombre: { $in: usuariosTl.filter((usuario) => usuario !== "") } }).select("_id");
		// paramsNuevoTl.config.filtro.autor = idUsuarios.map((usuario) => usuario._id);

		if (fechaTl === "elegir" && desdeTl !== "") {
			nuevosParamsTl.config.filtro.fecha["$gte"] = new Date(desdeTl).toISOString();
		}
		if (fechaTl === "elegir" && hastaTl !== "") {
			nuevosParamsTl.config.filtro.fecha["$lte"] = new Date(hastaTl).toISOString();
		}
		if (fechaTl !== "elegir") {
			const tiempo = {
				dia: 1,
				semana: 7,
				mes: 30,
				smes: 6 * 30
			};

			nuevosParamsTl.config.filtro.fecha["$gte"] = 24 * 60 * 60 * 1000 * tiempo[fechaTl];
		}

		const tl = await User.findOneAndUpdate(
			{ _id: req.session.idUsuario, "tls.nombre": nombreTl },
			{
				$set: {
					"tls.$": nuevosParamsTl
				}
			},
			{ new: true }
		);

		console.log(tl);

		res.json({ estado: "ok" });
	} catch (error) {
		next(error);
	}
};

module.exports = {
	esTlRepetido,
	crearTl,
	obtenerTl
};
