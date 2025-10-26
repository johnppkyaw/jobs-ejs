const express = require("express");
require("express-async-errors");

// extra security packages
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit')

const app = express();

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));
require("dotenv").config(); // to load the .env file into the process.env object

//cookie parser
const cookieParser = require("cookie-parser");
app.use(cookieParser(process.env.SESSION_SECRET || "testsecret"));

//session
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
  mongoURL = process.env.MONGO_URI_TEST;
}

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: mongoURL,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET || "testsecret",
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));

//csrf
const csrf = require("host-csrf");
const csrfMiddleware = csrf.csrf();
app.use(csrfMiddleware);
app.use((req, res, next) => {
  res.locals.csrf = csrf.refreshToken(req,res);
  next();
})

//Passport relies on session
const passport = require("passport");
const passportInit = require("./passport/passportInit");

passportInit();
app.use(passport.initialize());
app.use(passport.session());

//connect-flash
app.use(require("connect-flash")());
app.use(require("./middleware/storeLocals"));

//Testing for Rendered HTML
//n Express, when a page is rendered, it should set the Content-Type response header to be text/html.  But it doesn't.  The second problem is that if Chai receives a response without the Content-Type header, it tries to parse it as JSON, and throws an error if that fails.
app.use((req, res, next) => {
  if (req.path == "/multiply") {
    res.set("Content-Type", "application/json");
  } else {
    res.set("Content-Type", "text/html");
  }
  next();
});


app.get("/", (req, res) => {
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));

app.post("/secretWord", (req, res) => {
  if (req.body.secretWord.toUpperCase()[0] == "P") {
    req.flash("error", "That word won't work!");
    req.flash("error", "You can't use words that start with p.");
  } else {
    req.session.secretWord = req.body.secretWord;
    req.flash("info", "The secret word was changed.");
  }
  res.redirect("/secretWord");
});



// secret word handling
// let secretWord = "syzygy";
const secretWordRouter = require("./routes/secretWord");
const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);

//jobs
const jobsRouter = require('./routes/jobs');
app.use("/jobs", auth, jobsRouter);

//test router
app.get("/multiply", (req, res) => {
  const result = req.query.first * req.query.second;
  if (result.isNaN) {
    result = "NaN";
  } else if (result == null) {
    result = "null";
  }
  res.json({ result: result });
});

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(mongoURL);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

module.exports = { app };
