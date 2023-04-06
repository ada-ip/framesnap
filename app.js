require("dotenv").config();
const express = require("express");
const session = require("express-session");
const conDB = require("./config/db");
const MongoStore = require("connect-mongo");
const path = require("path");

const routerIndex = require("./routes/index");
const routerAuth = require("./routes/auth");
const routerUsuarios = require("./routes/usuarios");
const routerPosts = require("./routes/posts");

const error404 = require("./middleware/404");
const controlErrores = require("./middleware/control-errores");

const app = express();

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: process.env.MONGO_DB_URI,
			dbName: "framedb",
			ttl: 60 * 60 * 24
		}),
		cookie: {
			maxAge: 1000 * 60 * 60 * 24,
			secure: false,
			httpOnly: true
		}
	})
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname + "/views"));

app.use(express.static(path.join(__dirname + "/public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routerIndex);
app.use("/", routerAuth);
app.use("/", routerUsuarios);
app.use("/api/v1/posts", routerPosts);

// app.use(error404);
// app.use(controlErrores);

const start = async () => {
	try {
		await conDB(process.env.MONGO_DB_URI);
		console.log("DB connected");
		app.listen(process.env.PORT, () => console.log(`Server is listening on port ${process.env.PORT}...`));
	} catch (error) {
		console.log(error);
	}
};

start();
