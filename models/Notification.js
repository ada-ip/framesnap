const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
	tipo: {
		type: String,
		enum: {
			values: ["seguidor", "comentario", "like"],
			message: "{VALUE} no es un tipo válido"
		},
		default: "seguidor"
	},
	usuario: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	post: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post"
	},
	autor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true
	},
	visto: {
		type: Boolean,
		default: false
	},
	fecha: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model("Notification", NotificationSchema);
