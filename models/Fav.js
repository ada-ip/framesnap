const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

const FavSchema = new mongoose.Schema({
	idPost: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post",
		required: true
	},
	doc: {
		type: Number,
		default: 1
	},
	favs: [DenormUserSchema]
});

module.exports = mongoose.model("Fav", FavSchema);
