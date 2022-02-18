const express = require("express");
const bodyParser = require("body-parser");

const route = require("./routes/route.js");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

const mongoose = require("mongoose");

mongoose.connect('mongodb://localhost:27017/myapp')
.then(() => console.log('database connected'))
.catch(err => console.log(err));

app.use('/', route);

app.listen(process.env.PORT || 3000, function() {
    console.log('app is running on port' + (process.env.PORT  || 3000))
});