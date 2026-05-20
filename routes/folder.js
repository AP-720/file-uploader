const { Router } = require("express");
const folderController = require("../controllers/folderController");

const folderRouter = Router();

folderRouter.get("/", folderController.getFolder);
folderRouter.get("/:id", folderController.getFolder);
folderRouter.post("/upload", folderController.postUploadFile);
folderRouter.post("/create", folderController.postCreateFolder);
folderRouter.get("/update/:id", folderController.getUpdateFolder);
folderRouter.post("/update/:id", folderController.postUpdateFolder);

module.exports = folderRouter;
