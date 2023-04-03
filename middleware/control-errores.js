const controlErrores = (err, req, res, next) => {
	res.status(err.status || 500).json({
		error: {
			mensaje: err.message || "Internal Server Error"
		}
	});
};

module.exports = controlErrores;
