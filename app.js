require("dotenv").config();
const express = require("express");
const path = require("node:path");
const session = require("express-session");
const passport = require("passport");
require("./config/passport");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { prisma } = require("./lib/prisma.js");
const indexRouter = require("./routes/index");
const signUpRouter = require("./routes/signUp");
const folderRouter = require("./routes/folder");

const app = express();
const PORT = process.env.PORT || 3000;

// Static files
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

// ejs
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middleware
app.use(express.urlencoded({ extended: false }));
const sessionStore = new PrismaSessionStore(prisma, {
	checkPeriod: 2 * 60 * 1000,
	dbRecordIdIsSessionId: true,
	dbRecordIdFunction: undefined,
});
app.use(
	session({
		store: sessionStore,
		secret: process.env.COOKIE_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24, // Equals 1 day (1 day * 24 hr/1 day * 60 min/1 hr * 60 sec/1 min * 1000 ms / 1 sec)
		},
	}),
);
app.use(passport.session());
app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	next();
});

// Routes
app.use("/", indexRouter);
app.use("/sign-up", signUpRouter);
app.use("/folder", folderRouter);

app.listen(PORT, (error) => {
	if (error) {
		throw error;
	}
	console.log(`Listening on port:${PORT}`);
});
