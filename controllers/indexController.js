require("dotenv").config();

async function getIndex(req, res) {
	res.render("index", { title: "Home" });
}

module.exports = {
	getIndex,
};
