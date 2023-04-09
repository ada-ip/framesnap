const mongoose = require("mongoose");
const DenormUserSchema = require("./aux-models/DenormUser");

const CommentSchema = new mongoose.Schema({
	usuario: {
		type: DenormUserSchema,
		required: true
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
