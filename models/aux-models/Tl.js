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

const OrdenSchema = new mongoose.Schema(
	{
		favs: Number,
		fecha: Number
	},
	{
		_id: false
	}
);

OrdenSchema.virtual("oFavsOFecha")
	.get(function () {
		return this.favs || this.fecha;
	})
	.set(function () {});

OrdenSchema.path("favs").validate(function () {
	return this.oFavsOFecha !== null;
}, "Hay que incluir un campo por el que ordenar");

OrdenSchema.path("fecha").validate(function () {
	return this.oFavsOFecha !== null;
}, "Hay que incluir un campo por el que ordenar");

const ConfigSchema = new mongoose.Schema(
	{
		filtro: {
			type: FiltroSchema
		},
		orden: {
			type: OrdenSchema,
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
