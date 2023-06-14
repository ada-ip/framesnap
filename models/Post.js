/**
 * Modelo Mongoose que representa la estructura de datos de un post de un usuario en la base de datos MongoDB.
 */

// Se importan todos los modelos y módulos necesarios para crear el modelo y sus métodos asociados
const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

// Modelo de post
const PostSchema = new mongoose.Schema({
	imagen: {
		type: String,
		required: true,
	},
	texto: {
		type: String,
		required: true,
		trim: true,
		maxLength: [1000, "el comentario no puede tener más de 1000 caracteres"],
	},
	autor: {
		type: DenormUserSchema,
		required: true,
	},
	favs: [DenormUserSchema],
	outlierFavs: {
		type: Boolean,
		default: false,
	},
	numFavs: {
		type: Number,
		default: 0,
	},
	tags: [String],
	fecha: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Post", PostSchema);
