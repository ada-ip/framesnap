const mongoose = require("mongoose");

const conDB = (url) => {
	return mongoose.connect(url);
};

module.exports = conDB;
