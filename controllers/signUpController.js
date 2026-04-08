const { prisma } = require("../lib/prisma.js");
const bcrypt = require("bcryptjs");

async function getSignUp(req, res) {
	res.render("signUp", { title: "Sign Up" });
}

async function postSignUp(req, res) {
	console.log(req.body);

	const { firstName, lastName, email, password } = req.body;

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		await prisma.user.create({
			data: { firstName, lastName, email, password: hashedPassword },
		});
		res.redirect("/");
	} catch (err) {
		console.error(err);
		res.status(500).send("Server error");
	}
}
module.exports = { getSignUp, postSignUp };
