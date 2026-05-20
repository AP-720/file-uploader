const { prisma } = require("../lib/prisma.js");
const { isAuth } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const { body, validationResult, matchedData } = require("express-validator");
const { name } = require("ejs");
const { log } = require("console");

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

const validateFolderName = [
	body("updatedName").trim().notEmpty().withMessage("Name is required."),
];

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
						include: {
							children: true,
							files: true,
							parent: { select: { name: true } },
						},
					})
				: await prisma.folder.findFirst({
						where: {
							ownerId: userId,
							isRoot: true,
						},
						include: { children: true, files: true },
					});
			// console.log("getFolder:", folder);

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
			const folderId = parseInt(req.body.folderId);
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
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

const postCreateFolder = [
	isAuth,
	async (req, res) => {
		try {
			const parentId = parseInt(req.body.parentId);
			const userId = req.user.id;
			await prisma.folder.create({
				data: {
					name: req.body.folderName,
					ownerId: userId,
					parentId: parentId,
				},
			});

			res.redirect(`/folder/${parentId}`);
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

const getUpdateFolder = [
	isAuth,
	async (req, res) => {
		try {
			const userId = req.user.id;
			const folderId = Number(req.params.id);

			const folder = await prisma.folder.findFirst({
				where: {
					ownerId: userId,
					id: folderId,
				},
				select: { id: true, name: true },
			});

			if (!folder) {
				return res.status(404).send("Folder not found.");
			}

			res.render("updateFolder", { title: "Update", folder });
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];
const postUpdateFolder = [
	isAuth,
	validateFolderName,
	async (req, res) => {
		const userId = req.user.id;
		const folderId = Number(req.params.id);

		try {
			// Query first to verify the folder exists and belongs to the current user (IDOR protection).
			// Also gives the current name for re-rendering on validation failure,
			// and parentId for the redirect without needing a second query after update.
			const folder = await prisma.folder.findFirst({
				where: { id: folderId, ownerId: userId },
				select: { id: true, name: true, parentId: true },
			});

			if (!folder) {
				return res.status(404).send("Folder not found.");
			}

			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).render("updateFolder", {
					title: "Update",
					folder,
					errors: errors.array(),
				});
			}

			const { updatedName } = matchedData(req);

			await prisma.folder.update({
				where: { id: folderId, ownerId: userId },
				data: { name: updatedName },
			});

			res.redirect(`/folder/${folder.parentId}`);
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

const postDeleteFolder = [
	isAuth,
	async (req, res) => {
		const userId = req.user.id;
		const folderId = Number(req.params.id);

		try {
			const folder = await prisma.folder.findFirst({
				where: { id: folderId, ownerId: userId },
				select: { parentId: true },
			});

			if (!folder) {
				return res.status(404).send("Folder not found.");
			}

			await prisma.folder.delete({
				where: { id: folderId, ownerId: userId },
			});
			res.redirect(`/folder/${folder.parentId}`);
		} catch (error) {
			console.error(error);
			res.status(500).send("Server error");
		}
	},
];

module.exports = {
	getFolder,
	postUploadFile,
	postCreateFolder,
	getUpdateFolder,
	postUpdateFolder,
	postDeleteFolder,
};
