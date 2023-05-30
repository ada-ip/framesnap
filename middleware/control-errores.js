const controlErrores = (err, req, res, next) => {
	console.error(err.stack);
	res.status(500).render("errores/500", { error: err });
};

module.exports = controlErrores;
