/**
 * Modelo Mongoose auxiliar que representa una versión simplificada del usuario de la aplicación y que se utiliza para poder
 * optimizar las consultas y reducir la necesidad de consultas de agregación y lookups.
 */

const mongoose = require("mongoose");

const DenormUserSchema = new mongoose.Schema(
	{
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		nombre: {
			type: String,
			required: true,
		},
		fotoPerfil: {
			type: String,
			required: true,
		},
	},
	{
		_id: false,
	}
);

module.exports = DenormUserSchema;
