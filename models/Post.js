const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
	imagen: {
		type: String,
		required: true
	},
	contenido: {
		type: String,
		required: true,
		trim: true,
		maxLength: [1000, "el comentario no puede tener más de 1000 caracteres"]
	},
	autor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	favs: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true
		}
	],
	comentarios: [
		{
			usuario: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true
			},
			texto: {
				type: String,
				trim: true,
				required: true
			}
		}
	],
	tags: [String],
	fecha: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model("Post", PostSchema);
