const express = require("express");
const shortId = require("shortid");
const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const path = require("path");
const ShortUrl = require("./models/url");
require("dotenv").config();

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose.set("strictQuery", true);
mongoose
    .connect(process.env.MONGO_URL, {
        dbName: "url-shortener",
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log(":: Connected to database"))
    .catch((error) => console.log("!! Error connecting to database"));

app.set("view engine", "ejs");

app.get("/", async (req, res, next) => {
    res.render("index");
});

app.post("/", async (req, res, next) => {
    try {
        const { url } = req.body;
        if (!url) {
            throw createHttpError.BadRequest("PLEASE ENTER URL!");
        }
        const UrlExists = await ShortUrl.findOne({ url });
        if (UrlExists) {
            res.render("index", {
                // short_url: `http://localhost:7200/${UrlExists.shortId}`,
                short_url: `https://${req.hostname}/${UrlExists.shortId}`,
            });
            return;
        }
        const shortUrl = new ShortUrl({
            url: url,
            shortId: shortId.generate(),
        });
        const result = await shortUrl.save();
        res.render("index", {
            // short_url: `http://localhost:7200/${result.shortId}`,
            short_url: `https://${req.hostname}/${result.shortId}`,
        });
    } catch (error) {
        next(error);
    }
});

app.get("/:shortId", async (req, res, next) => {
    try {
        const { shortId } = req.params;
        const result = await ShortUrl.findOne({ shortId });
        if (!result) {
            throw createHttpError.NotFound("ShortUrl not found");
        }
        res.redirect(result.url);
    } catch (error) {
        next(error);
    }
});

app.use((req, res, next) => {
    next(createHttpError.NotFound());
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render("index", { error: err.message });
});

app.listen(process.env.PORT || 7200, () => {
    console.log(`:: Server listening on port [${process.env.PORT}]`);
});
