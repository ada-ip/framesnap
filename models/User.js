/**
 * Modelo Mongoose que representa la estructura de datos de un usuario en la base de datos MongoDB.
 */

// Se importan todos los modelos y módulos necesarios para crear el modelo y sus métodos asociados
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const TlSchema = require("./aux-models/Tl");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const DenormUserSchema = require("./aux-models/DenormUser");

// Modelo de usuario
const UserSchema = new mongoose.Schema({
	nombre: {
		type: String,
		required: true,
		trim: true,
		minLength: [3, "El nombre tiene que tener al menos 3 caracteres"],
		maxLength: [30, "El nombre no puede tener más de 30 caracteres"],
		unique: [true, "el nombre ya existe"],
		lowercase: true,
		match: [/^[a-z0-9]+$/i, "El nombre tiene que ser alfanumérico"],
	},
	correo: {
		type: String,
		required: true,
		trim: true,
		unique: [true, "el correo ya existe"],
		lowercase: true,
		match: [/^[a-z0-9]([a-z0-9]|\.(?!\.))*@[a-z0-9]+(\.[a-z]+)+$/i, "El nombre tiene que ser alfanumérico"],
	},
	contrasenya: {
		type: String,
		required: true,
	},
	fotoPerfil: {
		type: String,
		required: true,
	},
	seguidos: [DenormUserSchema],
	outlierSeguidos: {
		type: Boolean,
		default: false,
	},
	numSeguidos: {
		type: Number,
		default: 0,
	},
	seguidores: [DenormUserSchema],
	outlierSeguidores: {
		type: Boolean,
		default: false,
	},
	numSeguidores: {
		type: Number,
		default: 0,
	},
	tls: {
		type: [TlSchema],
		required: true,
		validate: {
			validator: function (tls) {
				return tls.length > 0;
			},
			message: "Hay que incluir al menos un TL para el usuario",
		},
	},
});

/**
 * Middleware que encripta la contraseña de un usuario cuando se crea el usuario y cuando el usuario cambia su contraseña.
 */
UserSchema.pre("save", async function (next) {
	if (!this.isModified("contrasenya")) {
		return next();
	}
	try {
		const salt = await bcrypt.genSalt(10);
		this.contrasenya = await bcrypt.hash(this.contrasenya, salt);
		next();
	} catch (err) {
		next(err);
	}
});

/**
 * Middleware que se ejecuta antes de guardar un usuario en la base de datos por primera vez y que añade al propio usuario
 * a la lista de usuarios del timeline estándar.
 */
UserSchema.pre("save", function (next) {
	if (this.isNew) {
		this.tls[0].config.filtro.autor = [this._id];
	}
	next();
});

/**
 * Método que compara una contraseña introducida por el usuario con la contraseña encriptada guardada en la base de datos.
 * @async
 * @function compararPassw
 * @param {string} inputPassw 	La contraseña introducida por el usuario.
 * @returns {Boolean} 			Devuelve true si las contraseñas coinciden y false si no coinciden.
 */
UserSchema.methods.compararPassw = async function (inputPassw) {
	return await bcrypt.compare(inputPassw, this.contrasenya);
};

/**
 * Método que devuelve los posts del timeline estándar del usuario.
 * @async
 * @function obtenerPostsTimeline
 * @param {Date} [datoPost=new Date()] 	La fecha desde la cual obtener los posts.
 * @returns {Array<Object>} 			Devuelve los posts más recientes del timeline estándar o los posts siguientes
 * 										a los ya mostrados en el navegador del usuario.
 */
UserSchema.methods.obtenerPostsTimeline = async function (datoPost = new Date()) {
	const usuariosSeguidos = [this._id];
	this.seguidos.forEach((us) => usuariosSeguidos.push(us.id));

	if (this.outlierSeguidos) {
		const usuariosOutlier = await Follow.find({ "usuario.id": this._id }).select("seguidos");
		usuariosOutlier.forEach((doc) => {
			doc.seguidos.forEach((us) => usuariosSeguidos.push(us.id));
		});
	}

	const postsUsuarios = await Post.find({ "autor.id": { $in: usuariosSeguidos }, fecha: { $lt: datoPost } })
		.select("-favs -outlierComentarios -tags")
		.sort("-fecha")
		.limit(10);

	return postsUsuarios;
};

module.exports = mongoose.model("User", UserSchema);
