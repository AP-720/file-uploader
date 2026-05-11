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

		try {
			const rootFolder = await prisma.folder.findFirst({
				where: {
					ownerId: userId,
					isRoot: true,
				},
				include: { files: true },
			});
			console.log("getFolder:", rootFolder);

			res.render("folder", { title: "Folder", rootFolder, formatFileSize });
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
			console.log("postUpdateFile:", file);

			res.redirect("/folder");
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

module.exports = { getFolder, postUploadFile };
