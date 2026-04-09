const { isAuth } = require("../middleware/authMiddleware");

const getFolder = [
	isAuth,
	async (req, res) => {
		res.render("folder", { title: "Folder" });
	},
];

module.exports = { getFolder };
