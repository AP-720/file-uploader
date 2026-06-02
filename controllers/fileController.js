const path = require("path");

const multer = require("multer");

const { prisma } = require("../lib/prisma.js");
const { isAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer.js");
const cloudinary = require("../lib/cloudinary.js");

const postUploadFile = [
	upload.single("upload"),
	async (req, res) => {
		try {
			const folderId = parseInt(req.body.folderId);

			if (!req.file) return res.redirect(`/folder/${folderId}`);

			await prisma.file.create({
				data: {
					name: path.basename(req.file.filename),
					size: req.file.size,
					publicId: req.file.filename,
					url: req.file.path,
					folderId: folderId,
				},
			});

			res.redirect(`/folder/${folderId}`);
		} catch (error) {
			if (error instanceof multer.MulterError) {
				console.error(error);
				res.status(400).send("File size to big.");
			} else {
				console.error(error);
				res.status(500).send("Server error");
			}
		}
	},
];

const postDeleteFile = [
	isAuth,
	async (req, res) => {
		const userId = req.user.id;
		const fileId = Number(req.params.id);

		try {
			const file = await prisma.file.findFirst({
				where: { id: fileId, folder: { ownerId: userId } },
				select: { url: true, publicId: true, folderId: true },
			});

			if (!file) {
				return res.status(404).send("File not found.");
			}

			await cloudinary.uploader.destroy(file.publicId);

			await prisma.file.delete({
				where: { id: fileId, folderId: file.folderId },
			});

			res.redirect(`/folder/${file.folderId}`);
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

const getDownloadFile = [
	isAuth,
	async (req, res) => {
		const userId = req.user.id;
		const fileId = Number(req.params.id);

		try {
			const file = await prisma.file.findFirst({
				where: { id: fileId, folder: { ownerId: userId } },
				select: { url: true },
			});

			if (!file) {
				return res.status(404).send("File not found.");
			}

			const filePath = path.join(__dirname, "..", file.url);

			res.download(filePath);
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

module.exports = {
	postUploadFile,
	postDeleteFile,
	getDownloadFile,
};
