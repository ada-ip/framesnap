/**
 * Este módulo proporciona controladores para gestionar los timelines personalizados creados por los usuarios de la aplicación.
 *
 * El modelo User es neceario para manipular los datos correspondientes de la base de datos.
 *
 * Controladores:
 * - esTlRepetido: Comprueba si el usuario conectado ya había utilizado un nombre determinado para llamar a un timeline
 * 				   personalizado y devuelve el resultado.
 * - crearTl: Crea un nuevo timeline personalizado del usuario conectado con un nombre, un conjunto de usuarios, un conjunto
 * 			  de tags, un límite de antigüedad y un orden.
 * - obtenerTl: Devuelve la configuración de un timeline personalizado determinado.
 * - borrarTl: Elimina un timeline personalizado determinado de la lista de timelines del usuario conectado.
 *
 */

// Se importan los modelos de Mongoose necesarios
const User = require("../models/User");
// Se importan las funciones necesarias para procesar los datos
const { formatearFechaTl } = require("../utils/consultas");

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

		if (metodo === "post") {
			await User.updateOne(
				{ _id: req.session.idUsuario },
				{
					$push: {
						tls: paramsNuevoTl,
					},
				}
			);
		} else if (req.body.anteriorNombre) {
			await User.updateOne(
				{ _id: req.session.idUsuario, "tls.nombre": req.body.anteriorNombre },
				{
					$set: {
						"tls.$": paramsNuevoTl,
					},
				}
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
				as: "tls.autor",
			})
			.project({
				_id: 0,
				nombre: "$tls.nombre",
				autor: "$tls.autor.nombre",
				tags: "$tls.config.filtro.tags",
				fecha: "$tls.config.filtro.fecha",
				orden: "$tls.config.orden",
			});

		res.status(200).json({ ...tl[0], fechaFormateada: formatearFechaTl(tl[0].fecha) });
	} catch (error) {
		next(error);
	}
};

const borrarTl = async (req, res, next) => {
	try {
		const { nombreTl } = req.params;
		await User.updateOne({ _id: req.session.idUsuario }, { $pull: { tls: { nombre: nombreTl } } });
		res.status(204).end();
	} catch (error) {
		next(error);
	}
};

module.exports = {
	esTlRepetido,
	crearTl,
	obtenerTl,
	borrarTl,
};
