const { prisma } = require("../lib/prisma.js");
const bcrypt = require("bcryptjs");
const { body, validationResult, matchedData } = require("express-validator");

const validateSignup = [
	body("firstName")
		.trim()
		.notEmpty()
		.withMessage(`First name is required`)
		.isAlpha()
		.withMessage(`First name must only contain letters.`),
	body("lastName")
		.trim()
		.notEmpty()
		.withMessage(`Last name is required`)
		.isAlpha()
		.withMessage(`Last name must only contain letters.`),
	body("email")
		.trim()
		.notEmpty()
		.withMessage(`Email is required.`)
		.isEmail()
		.withMessage(`Must be valid e-mail address.`),
	body("password")
		.trim()
		.notEmpty()
		.withMessage(`Password required.`)
		.isStrongPassword({
			minLength: 8,
			minLowercase: 1,
			minUppercase: 1,
			minNumbers: 1,
			minSymbols: 1,
		})
		.withMessage(
			`Password must contain at least 8 characters. Including a minium of one lower case letter, one upper case letter, one number and one symbol.`,
		),
	body("confirmPassword")
		.trim()
		.notEmpty()
		.withMessage(`Confirm password required.`)
		.custom((value, { req }) => {
			return value === req.body.password;
		})
		.withMessage("Passwords do not match. Re-enter and try again."),
];

async function getSignUp(req, res) {
	res.render("signUp", { title: "Sign Up" });
}

const postSignup = [
	validateSignup,
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res
				.status(400)
				.render("signUp", { title: "Sign Up", errors: errors.array() });
		}

		const { firstName, lastName, email, password } = matchedData(req);

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
	},
];

module.exports = { getSignUp, postSignup };
