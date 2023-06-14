/**
 * Modelo Mongoose que representa la estructura de los datos de los usuarios a los que sigue un usuario con un número de usuarios
 * seguidos superior al límite establecido.
 * Este modelo es un modelo de una colección secundaria que sólo se utiliza en el caso de que un usuario tenga datos
 * atípicos y no se puedan guardar más usuarios seguidos en su documento para evitar una pérdida de eficiencia en las consultas
 * a la base de datos.
 */

// Se importan todos los modelos y módulos necesarios para crear el modelo y sus métodos asociados
const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

// Modelo de documento de la colección secundaria follows
const FollowSchema = new mongoose.Schema({
	usuario: {
		type: DenormUserSchema,
		required: true,
	},
	doc: {
		type: Number,
		default: 1,
	},
	seguidos: [DenormUserSchema],
});

module.exports = mongoose.model("Follow", FollowSchema);
