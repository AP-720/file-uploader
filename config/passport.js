const bcrypt = require("bcryptjs");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { prisma } = require("./lib/prisma.js");

passport.use(
	new LocalStrategy(async (email, password, done) => {
		try {
			const result = await prisma.user.findUnique({
				where: {
					email: email,
				},
			});

			if (!result) {
				return done(null, false, { message: "Incorrect e-mail" });
			}

			const match = await bcrypt.compare(password, result.password);

			if (!match) {
				return done(null, false, { message: "Incorrect password" });
			}
			return done(null, result);
		} catch (err) {
			return done(err);
		}
	}),
);

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		const result = await prisma.user.findUnique({
			where: {
				id: id,
			},
		});

		done(null, result);
	} catch (err) {
		done(err);
	}
});
