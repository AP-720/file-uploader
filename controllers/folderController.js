const { prisma } = require("../lib/prisma.js");
const { isAuth } = require("../middleware/authMiddleware");
const { body, validationResult, matchedData } = require("express-validator");
const cloudinary = require("../lib/cloudinary.js");

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

			res.render("folder", { title: "Folder", folder, formatFileSize });
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

async function getAllPublicIds(folderId) {
	let publicIds = [];

	const result = await prisma.folder.findFirst({
		where: { id: folderId },
		select: {
			children: { select: { id: true } },
			files: { select: { publicId: true } },
		},
	});

	result.files.forEach((file) => {
		publicIds.push(file.publicId);
	});

	// Needed to us map as forEach doesn't work with async
	const promises = result.children.map(async (folder) => {
		publicIds.push(...(await getAllPublicIds(folder.id)));
	});

	await Promise.all(promises);

	return publicIds;
}

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

			const publicIds = await getAllPublicIds(folderId);

			const promises = publicIds.map((publicId) =>
				cloudinary.uploader.destroy(publicId),
			);

			await Promise.all(promises);

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
	postCreateFolder,
	getUpdateFolder,
	postUpdateFolder,
	postDeleteFolder,
};
