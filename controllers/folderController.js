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
		res.render("folder", { title: "Folder" });
	},
];

const postUploadFile = [
	upload.single("upload"),
	async (req, res) => {
		res.redirect("/folder");
	},
];

module.exports = { getFolder, postUploadFile };
