const controlErrores = (err, req, res, next) => {
	// res.status(err.status || 500).json({
	// 	error: {
	// 		mensaje: err.message || "Internal Server Error"
	// 	}
	// });

	console.error(err.stack);
	res.status(500).render("errores/500", { error: err });
};

module.exports = controlErrores;
