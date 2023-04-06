require("dotenv").config();
const AWS = require("aws-sdk");
const fs = require("fs");

AWS.config.update({
	accessKeyId: process.env.AWS_ACCESS_KEY,
	secretAccessKey: process.env.AWS_SECRET_KEY,
	region: process.env.AWS_BUCKET_REGION
});

const s3 = new AWS.S3();
const filePath = "./public/images/posts/IMG-20230403-WA0010.jpg"; // Replace with the path to a local image file

const fileStream = fs.createReadStream(filePath);
fileStream.on("error", (err) => {
	console.log("File Error:", err);
});

const uploadParams = {
	Bucket: process.env.AWS_BUCKET_NAME,
	Key: `test-uploads/${Date.now().toString()}-test-image.jpg`,
	Body: fileStream
};

s3.upload(uploadParams, (err, data) => {
	if (err) {
		console.log("Error", err);
	}
	if (data) {
		console.log("Upload Success", data.Location);
	}
});
