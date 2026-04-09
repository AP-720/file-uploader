async function getFolder(req, res) {
	res.render("folder", { title: "Folder" });
}

module.exports = { getFolder };
