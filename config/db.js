/**
 * Este módulo exporta una conexión Mongoose con un cluster de MongoDB.
 */

const mongoose = require("mongoose");

const conDB = (url) => {
	return mongoose.connect(url);
};

module.exports = conDB;
