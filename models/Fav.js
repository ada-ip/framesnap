/**
 * Modelo Mongoose que representa la estructura de los datos de los posts que tiene un número de favoritos superior al límite establecido.
 * Este modelo es un modelo de una colección secundaria que sólo se utiliza en el caso de que un post tenga datos
 * atípicos y no se puedan guardar más favoritos en su documento para evitar una pérdida de eficiencia en las consultas
 * a la base de datos.
 */

// Se importan todos los modelos y módulos necesarios para crear el modelo y sus métodos asociados
const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

// Modelo de documento de la colección secundaria favs
const FavSchema = new mongoose.Schema({
	idPost: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post",
		required: true,
	},
	doc: {
		type: Number,
		default: 1,
	},
	favs: [DenormUserSchema],
});

module.exports = mongoose.model("Fav", FavSchema);
