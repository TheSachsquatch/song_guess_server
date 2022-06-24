const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const pg = require('pg');
const port = process.env.PORT || 5000

dotenv.config()

const app = express();

const connectStr = process.env.DATABASE_URL

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pgPool = new pg.Pool({
    connectionString: connectStr,
    ssl: {rejectUnauthorized: false}
})

const query = {
    text: 'CREATE TABLE IF NOT EXISTS "session"'
}

pgPool.query(query, (err, res) =>{
    if(err){
        console.log(err)
    }
    else{
        console.log(res);
    }
})
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(session({secret: process.env.SESSION_SECRET,
    store: new pgSession({
        pool: pgPool,
        tableName: 'session'
    }),
    resave: true, saveUninitialized: true, cookie: {
        maxAge: 2592000000, path: "/", secure: true, sameSite: "none"
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
        req.session.showDialog= true;
        req.session.save();
        console.log(req.session.access_token)
    }
    next();
})

app.use(require("./routes/auth"))

app.listen(port, () =>{
    console.log(`Server started at ${port}`)
})


