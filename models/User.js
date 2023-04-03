const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const TlSchema = require("./aux-models/Tl");

const UserSchema = new mongoose.Schema({
	nombre: {
		type: String,
		required: true,
		trim: true,
		minLength: [3, "El nombre tiene que tener al menos 3 caracteres"],
		maxLength: [30, "El nombre no puede tener más de 30 caracteres"],
		unique: [true, "el nombre ya existe"],
		lowercase: true,
		match: [/^[a-z0-9]+$/i, "El nombre tiene que ser alfanumérico"]
	},
	correo: {
		type: String,
		required: true,
		trim: true,
		unique: [true, "el correo ya existe"],
		lowercase: true,
		match: [/^[a-z0-9]([a-z0-9]|\.(?!\.))*@[a-z0-9]+(\.[a-z]+)+$/i, "El nombre tiene que ser alfanumérico"]
	},
	contrasenya: {
		type: String,
		required: true
	},
	fotoPerfil: {
		type: String,
		default: "/images/perfiles/anonymous.jpg"
	},
	seguidos: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}
	],
	seguidores: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}
	],
	tls: {
		type: [TlSchema],
		required: true,
		validate: {
			validator: function (tls) {
				return tls.length > 0;
			},
			message: "Hay que incluir al menos un TL para el usuario"
		}
	}
});

UserSchema.pre("save", async function (next) {
	// Check if the password has been modified
	if (!this.isModified("contrasenya")) {
		return next();
	}

	try {
		// Generate a salt
		const salt = await bcrypt.genSalt(10);

		// Hash the password with the salt
		this.contrasenya = await bcrypt.hash(this.contrasenya, salt);

		// Move to the next middleware
		next();
	} catch (err) {
		next(err);
	}
});

// Method to compare input password with the hashed password
UserSchema.methods.compararPassw = async function (inputPassw) {
	return await bcrypt.compare(inputPassw, this.contrasenya);
};

module.exports = mongoose.model("User", UserSchema);