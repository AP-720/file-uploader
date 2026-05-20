const { Router } = require("express");
const fileController = require("../controllers/fileController");

const fileRouter = Router();

fileRouter.post("/upload", fileController.postUploadFile);

module.exports = fileRouter;
