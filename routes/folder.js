const { Router } = require("express");
const folderController = require("../controllers/folderController");

const folderRouter = Router();

folderRouter.get("/", folderController.getFolder);
folderRouter.post("/upload", folderController.postUploadFile);

module.exports = folderRouter;
