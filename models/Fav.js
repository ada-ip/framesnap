const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

const FavSchema = new mongoose.Schema({
	usuario: {
		type: DenormUserSchema,
		required: true
	},
	favs: [DenormUserSchema]
});

module.exports = mongoose.model("Fav", FavSchema);
