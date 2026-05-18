const { prisma } = require("../lib/prisma.js");
const { isAuth } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

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

const upload = multer({ storage: storage });

function formatFileSize(fileSize) {
	const number = Number(fileSize);

	if (number < 1e3) {
		return number + "b";
	} else if (number < 1e6) {
		return (number / 1e3).toFixed(1) + "Kb";
	} else if (number < 1e9) {
		return (number / 1e6).toFixed(1) + "Mb";
	} else {
		return (number / 1e9).toFixed(1) + "Gb";
	}
}

const getFolder = [
	isAuth,
	async (req, res) => {
		const userId = req.user.id;
		const folderId = Number(req.params.id);

		try {
			const folder = folderId
				? await prisma.folder.findFirst({
						where: {
							ownerId: userId,
							id: folderId,
						},
						include: { children: true, files: true },
					})
				: await prisma.folder.findFirst({
						where: {
							ownerId: userId,
							isRoot: true,
						},
						include: { children: true, files: true },
					});
			console.log("getFolder:", folder);

			res.render("folder", { title: "Folder", folder, formatFileSize });
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

const postUploadFile = [
	upload.single("upload"),
	async (req, res) => {
		try {
			const file = await prisma.file.create({
				data: {
					name: req.file.filename,
					size: req.file.size,
					url: req.file.path,
					folderId: parseInt(req.body.folderId),
				},
			});
			console.log("postUploadFile:", file);

			res.redirect("/folder");
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

const postCreateFolder = [
	isAuth,
	async (req, res) => {
		try {
			const userId = req.user.id;
			const folder = await prisma.folder.create({
				data: {
					name: req.body.folderName,
					ownerId: userId,
					parentId: parseInt(req.body.parentId),
				},
			});
			console.log("postCreateFolder:", folder);

			res.redirect("/folder");
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

module.exports = { getFolder, postUploadFile, postCreateFolder };
