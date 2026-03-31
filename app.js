require("dotenv").config();
const express = require("express");
const path = require("node:path");

const app = express();
const PORT = process.env.PORT || 3000;

// Static files
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

// ejs
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Session store

// Middleware

app.use(express.urlencoded({ extended: false }));



// Routers



app.listen(PORT, (error) => {
	if (error) {
		throw error;
	}
	console.log(`Listening on port:${PORT}`);
});