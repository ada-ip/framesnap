const mongoose = require("mongoose");

const DenormUserSchema = new mongoose.Schema(
	{
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true
		},
		nombre: {
			type: String,
			required: true
		},
		fotoPerfil: {
			type: String,
			required: true
		}
	},
	{
		_id: false
	}
);

module.exports = DenormUserSchema;
