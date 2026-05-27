const { Router } = require("express");
const fileController = require("../controllers/fileController");

const fileRouter = Router();

fileRouter.post("/upload", fileController.postUploadFile);
fileRouter.post("/delete/:id", fileController.postDeleteFile)
fileRouter.get("/download/:id", fileController.getDownloadFile)

module.exports = fileRouter;
