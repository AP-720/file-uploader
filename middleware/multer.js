const path = require("path");

const multer = require("multer");

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../lib/cloudinary");

const storage = new CloudinaryStorage({
	cloudinary,

	params: async (req, file) => {
		const now = new Date();

		const pad = (n, size = 2) => String(n).padStart(size, "0");

		const timestamp = [
			now.getFullYear(),
			pad(now.getMonth() + 1),
			pad(now.getDate()),
			pad(now.getHours()),
			pad(now.getMinutes()),
			pad(now.getSeconds()),
			pad(now.getMilliseconds(), 3),
		].join("");

		const extension = path.extname(file.originalname);

		const filename = path.basename(file.originalname, extension);

		const safeFilename = filename
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-_]/g, "");

		return {
			folder: "file-uploader",
			resource_type: "auto",
			public_id: `${safeFilename}-${timestamp}`,
		};
	},
});

const upload = multer({
	storage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB
	},
});

module.exports = upload;
