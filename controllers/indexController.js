async function getIndex(req, res) {
	res.render("index", { title: "Home" });
}

async function getLogOut(req, res, next) {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		res.redirect("/");
	});
}

module.exports = {
	getIndex,
	getLogOut,
};
