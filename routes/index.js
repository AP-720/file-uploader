const { Router } = require("express");
const indexController = require("../controllers/indexController");
const passport = require("passport");

const indexRouter = Router();

indexRouter.get("/", indexController.getIndex);
indexRouter.post(
	"/log-in",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/",
	}),
);

module.exports = indexRouter;
