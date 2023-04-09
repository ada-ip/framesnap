const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

const FollowSchema = new mongoose.Schema({
	usuario: {
		type: DenormUserSchema,
		required: true
	},
	seguidos: [DenormUserSchema]
});

module.exports = mongoose.model("Follow", FollowSchema);
