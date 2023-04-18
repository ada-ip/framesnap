const mongoose = require("mongoose");

const FiltroSchema = new mongoose.Schema(
	{
		autor: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User"
			}
		],
		tags: [String],
		fecha: {
			type: mongoose.Schema.Types.Mixed
		}
	},
	{
		_id: false
	}
);

const ConfigSchema = new mongoose.Schema(
	{
		filtro: {
			type: FiltroSchema
		},
		orden: 
			{
				type: String,
				required: true
			}
	},
	{
		_id: false
	}
);

const TlSchema = new mongoose.Schema(
	{
		nombre: {
			type: String,
			trim: true,
			required: true,
			maxLength: [20, "El nombre no puede tener más de 20 caracteres"],
			match: [/^[a-z0-9\-_]+$/i, "El nombre sólo puede contener letras, números y - o _"]
		},
		config: {
			type: ConfigSchema,
			required: true
		}
	},
	{
		_id: false
	}
);

module.exports = TlSchema;
