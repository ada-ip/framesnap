const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

const PostSchema = new mongoose.Schema({
	imagen: {
		type: String,
		required: true
	},
	texto: {
		type: String,
		required: true,
		trim: true,
		maxLength: [1000, "el comentario no puede tener más de 1000 caracteres"]
	},
	autor: {
		type: DenormUserSchema,
		required: true
	},
	favs: [DenormUserSchema],
	outlierFavs: {
		type: Boolean,
		default: false
	},
	comentarios: [
		{
			usuario: {
				type: DenormUserSchema,
				required: true
			},
			texto: {
				type: String,
				trim: true,
				required: true
			}
		}
	],
	outlierComentarios: {
		type: Boolean,
		default: false
	},
	tags: [String],
	fecha: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model("Post", PostSchema);
