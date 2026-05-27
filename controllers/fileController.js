const { prisma } = require("../lib/prisma.js");
const { isAuth } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "public/files");
	},
	filename: function (req, file, cb) {
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

		cb(null, filename + "-" + timestamp + extension);
	},
});

const upload = multer({ storage: storage, limits: { fileSize: 1e7 } });

const postUploadFile = [
	upload.single("upload"),
	async (req, res) => {
		try {
			const folderId = parseInt(req.body.folderId);

			if (!req.file) return res.redirect(`/folder/${folderId}`);

			await prisma.file.create({
				data: {
					name: req.file.filename,
					size: req.file.size,
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
				select: { url: true, folderId: true },
			});

			if (!file) {
				return res.status(404).send("File not found.");
			}

			await fs.unlink(`${file.url}`);

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
