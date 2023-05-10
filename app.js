/**
 * Archivo principal de la aplicación.
 *
 * Este archivo configura y prepara la aplicación con todos los middlewares y enrutadores necesarios e inicia el servidor
 */

// Se importan los módulos necesarios y las variables de entorno para que la aplicación funcione correctamente
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const conDB = require("./config/db");
const MongoStore = require("connect-mongo");
const path = require("path");

// Se importan los enrutadores que controlarán quién se carga de procesar cada petición
const routerIndex = require("./routes/index");
const routerAuth = require("./routes/auth");
const routerUsuarios = require("./routes/usuarios");
const routerPosts = require("./routes/posts");
const routerTls = require("./routes/tls");

// Se importan los middleware de control de errores
const error404 = require("./middleware/404");
const controlErrores = require("./middleware/control-errores");

// Se crea una aplicación express
const app = express();

// Se configura la sesión de usuario que se almacenará en la base de datos y tendrá una duración máxima de un día
app.use(
	session({
		secret: process.env.SESSION_SECRET, // Conjunto de caracteres que se utilizan para encriptar la sesión
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: process.env.MONGO_DB_URI,
			dbName: "framedb",
			ttl: 60 * 60 * 24,
		}),
		cookie: {
			maxAge: 1000 * 60 * 60 * 24,
			secure: false,
			httpOnly: true,
		},
	})
);

// Se configura la aplicación para que utilice el motor de plantillas ejs y utilice las plantillas guardadas en el directorio views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname + "/views"));

// Se configura que se pueda servir el contenido estático del directorio public
app.use(express.static(path.join(__dirname + "/public")));

// Se permite tratar datos enviados como json o como un formulario HTML
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Se utilizan los enrutadores que controlan quién se encarga de cada petición
app.use("/", routerIndex);
app.use("/", routerAuth);
app.use("/", routerUsuarios);
app.use("/", routerPosts);
app.use("/api/v1/tls/", routerTls);

// Se utilizan los middleware de control de errores
app.use(error404);
app.use(controlErrores);

// Se conecta a la base de datos y se se inicia el servidor
const start = async () => {
	try {
		await conDB(process.env.MONGO_DB_URI);
		console.log("DB connected");
		// Sólo se inicia el servidor si se ha podido conectar con la base de datos
		app.listen(process.env.PORT, () => console.log(`Server is listening on port ${process.env.PORT}...`));
	} catch (error) {
		console.log(error);
	}
};
start();
