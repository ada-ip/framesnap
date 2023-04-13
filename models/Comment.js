const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

const CommentSchema = new mongoose.Schema({
	idPost: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post",
		required: true
	},
	doc: {
		type: Number,
		default: 1
	},
	comentarios: [
		{
			usuario: {
				type: DenormUserSchema,
				required: true
			},
			texto: {
				type: String,
				trim: true,
				required: true
			}
		}
	]
});

module.exports = mongoose.model("Comment", CommentSchema);
