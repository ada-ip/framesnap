const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

const FollowerSchema = new mongoose.Schema({
	usuario: {
		type: DenormUserSchema,
		required: true
	},
	seguidores: [DenormUserSchema]
});

module.exports = mongoose.model("Follower", FollowerSchema);
