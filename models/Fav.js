const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

const FavSchema = new mongoose.Schema({
	idPost: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post",
		required: true
	},
	favs: [DenormUserSchema]
});

module.exports = mongoose.model("Fav", FavSchema);
