const { s3 } = require("../config/aws");

const anyadirSignedUrls = (posts, req) =>
	posts.map((post) => {
		let signedUrl;

		if (req.session.signedUrls && req.session.signedUrls.some((signedUrl) => signedUrl.imagen === post.imagen)) {
			const imagen = req.session.signedUrls.find((signedUrl) => signedUrl.imagen === post.imagen);
			signedUrl = imagen.signedUrl;
		} else {
			const claveImagen = post.imagen.replace(
				`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/`,
				""
			);

			signedUrl = s3.getSignedUrl("getObject", {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: claveImagen,
				Expires: 600
			});

			req.session.signedUrls = (req.session.signedUrls || []).concat([{ imagen: claveImagen, signedUrl: signedUrl }]);
		}

		return { ...post.toObject(), signedUrl };
	});

module.exports = anyadirSignedUrls;
