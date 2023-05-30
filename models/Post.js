const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

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
