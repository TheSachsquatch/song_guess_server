const express = require("express")

const auth = express.Router();

const request = require('request')

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const app_url = process.env.APP_URL;
const server_url = process.env.SERVER_URL;
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

function refreshTok (req){
    let options = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
            'Content-Type' : 'application/x-www-form-urlencoded'
        },
        client_id: client_id,
        form: {
          grant_type: 'refresh_token',
          refresh_token: req.session.refresh_token
        },
        json: true
    };

    request.post(options, function(error, response, body){
        if(!error && response.statusCode===200){
            console.log(body)
            req.session.access_token = body.access_token;
            req.session.save();
            if(req.session.timer!==-1){
                setTimeout(() => refreshTok(req), req.session.timer);
            }
        }
    })
}

auth.route('/auth/login').get((req,res)=>{
    var scope = "streaming \
               user-read-email \
               user-read-private \
               user-modify-playback-state \
               user-read-playback-state \
               playlist-read-collaborative \
               playlist-read-private" 
    var state = generateRandomString(16);
    console.log(req.session);
    var auth_query_parameters = new URLSearchParams({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: `${server_url}/auth/callback`,
        show_dialog: req.session.showDialog,
        state: state
    })

    res.redirect('https://accounts.spotify.com/authorize/?' + auth_query_parameters.toString());
})

auth.route('/auth/callback').get((req, res)=>{
    var code = req.query.code;

    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
        code: code,
        redirect_uri: `${server_url}/auth/callback`,
        grant_type: 'authorization_code'
        },
        headers: {
        'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
        'Content-Type' : 'application/x-www-form-urlencoded'
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if(error){
            console.log(error)
        }
        if (!error && response.statusCode === 200) {
            res.redirect(app_url)
            req.session.access_token = body.access_token;
            req.session.refresh_token = body.refresh_token;
            console.log(req.sessionID);
            console.log(req.session);
            req.session.timer = 3400000;
            setTimeout(() => refreshTok(req), 3400000);
            req.session.save();
        }
    });
})

auth.route('/auth/token').get((req, res) =>{
    console.log(req.session)
    console.log(req.sessionID)
    res.json(
        {
            access_token: req.session.access_token,
        })
})

auth.route('/auth/logout').get((req,res) =>{
    access_token = "";
    req.session.access_token = "";
    req.session.refresh_token = "";
    req.session.showDialog = true;
    req.session.timer = -1;
    req.session.save();
    console.log("logged out");
    console.log(req.session);
})

module.exports = auth;