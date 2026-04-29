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
			console.log(rootFolder);

			res.render("folder", { title: "Folder", rootFolder });
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
			console.log(file);
			
			res.redirect("/folder");
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

module.exports = { getFolder, postUploadFile };
