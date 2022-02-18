const urlModel = require("../models/url-short");
const shortId = require("shortid");
const { response } = require("express");

const redis = require("redis");

const { promisify } = require("util");

const redisClient = redis.createClient (
    12845,
    "redis-12845.us-east-1-3.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("sndjndjnJNJNJNnjjndj", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to redis...");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC= promisify(redisClient.GET).bind(redisClient);

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
};

const shortenUrl = async function (req, res) {
    try {
        const requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameters. Please provide URL details"
            });
        }
        let longUrl = req.body.longUrl;
        if (!isValid(longUrl)) {
            return res
            .status(400)
            .send({
                status: false,
                message: "Please provide Long URL"
            });
        }
        if (
            !/(ftp|http|https|HTTP|HTTPS):\/\/(w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/.test(
                longUrl
            )
        ) {
            return res 
            .status(400)
            .send({
                status: false,
                message: "Invalid URL. Please provide correct URL",
            });
        }
        if (
            !/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(
                longurl
            )
        ) {
            return res.status(400).send({
                status: false,
                message: "Invalid URL. Please provide correct URL"
            });
        }
        const urlTrim = longUrl.trim();
        const urlval = urlTrim.split("")
        .map((a) => a.trim())
        .join("");
        
        const findInCache = await GET_ASYNC(`${urlval}`);
        if (findInCache) {
            let data = JSON.parse(findInCache);
            return res
            .status(200)
            .send({
                status: true, 
                message: "Entry from cache", data: data
            });
        }
        const isAlreadyReg = await urlModel
        .findOne({ longUrl })
        .select({ createdAt: 0, updatedAt: 0, _v: 0});
        if (isAlreadyReg) {
            await SET_ASYNC(`${urlval}`, JSON.stringify(isAlradyReg));
            res
            .status(200)
            .send({
                status: true,
                message: "URL already generated",
                data: isAlreadyReg
            });
        } else {
            function makeid(length) {
                let result = "";
                let characters = "abcdefghijklmnopqrstuvwxyz";
                var charactersLength = characters.length;
                for(let i = 0; i < length; i++) {
                    result += characters.charAt(
                        Math.floor(Math.random() * charactersLength)
                    );
                }
                return result;
            }
            let urlCode = makeid(9);
            let checkUrlCode = await urlModel.findOne({ urlCode: urlCode });
            if (checkUrlCode) {
                urlCode = makeid(9);
            }
            const shortUrl = `http://localhost:3000/$(urlCode)`;
            const data {};
            data["longUrl"] = urlval;
            data["shortUrl"] = shortUrl;
            data["urlCode"] = urlCode;

            let profile = await urlModel.create(data);
            await SET_ASYNC(`${urlval}`, JSON.stringify(profile));
            await SET_ASYNC(`urlCode`, JSON.stringify(profile));
            res.status(201).send({ data: profile});
        }


    } catch (err) {
        console.log(err.message);
        res.status(500).send({
            message: "Some error occured"
        })
    }
};

const redirectUrl = async function (req, res) {
    try {
        const urlData = req.params.urlCode;

        const urlCode = urlData
        .split("")
        .map((a) => a.trim())
        .join("");

        let cachedUrlDataTwo = await GET_ASYNC(`${urlCode}`);
        let cachedUrlDataThree = JSON.parse(cachedUrlDataTwo);
        if (cachedUrlDataThree) {
            res.redirect(307, cachedUrlThree["longUrl"]);
        } else {
            let validData = await urlModel
            .findOne({ urlCode: urlCode})
            .select({ longUrl: 1});

            if (!validData) {
                return res
                .status(400)
                .send({
                    status:false,
                    message: "Please provide a valid URL code"
                });
            }
            await SET_ASYNC(`${urlCode}`, JSON.stringify(validData));
            res.redirect(307, validData.longUrl);

        }

    } catch (err) {
        res.status(500).send({
            status: false,
            message: err.message
        });
    }
};
module.exports.shortenUrl = shortenUrl;
module.exports.redirectUrl = redirectUrl;