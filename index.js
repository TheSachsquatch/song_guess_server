const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const sqlite = require("better-sqlite3");

const SqLiteStore = require("better-sqlite3-session-store")(session)
const db = new sqlite("sessions.db", {});

const port = process.env.PORT || 5000

dotenv.config()

const app = express();

app.use(cookieParser());
app.use(session({secret: process.env.SESSION_SECRET,
    store: new SqLiteStore({
        client:db,
        expires:{
            clear:true,
            intervalMs: 2592000000
        }
    }),
    resave: true, saveUninitialized: true, cookie: {
        maxAge: 2592000000, path: "/", secure: false,
    }}));
app.use(cors({
    origin: ["http://localhost:3000", "https://song-guess.netlify.app"],
    methods: ["GET", "HEAD",  "POST", "PUT", "DELETE"],
    credentials: true
}))

app.use((req,res, next)=>{
    if(!req.session.initialized){
        req.session.access_token = "";
        req.session.refresh_token = "";
        req.session.initialized = true;
        req.session.showDialog= false;
        req.session.save();
        console.log(req.session.access_token)
    }
    next();
})

app.use(require("./routes/auth"))

app.listen(port, () =>{
    console.log(`Server started at ${port}`)
})


