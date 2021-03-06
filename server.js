// Sample express web server.  Supports the same features as the provided server,
// and demonstrates a big potential security loophole in express.
"use strict";
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var express = require("express");
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var questions = [];
var passwordHash = require('password-hash')
const helmet = require('helmet');
const https = require('https'), fs = require("fs");

var banned = [];
var backurl;
var loginFail = false;
const dbconfig = require('./Config/initdb');
banUpperCase("./Public/", "");

// Define the sequence of functions to be called for each request.  Make URLs
// lower case, ban upper case filenames, require authorisation for admin.html,
// and deliver static files from ./public.
app.use(lower);
app.use(ban);
app.use("/bootstrap.html", auth);
var options = { setHeaders: deliverXHTML, key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem')};
app.use(express.static(__dirname + "/Public"));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,

}));


var sqlite3 = require('sqlite3').verbose();
let db;
function checkNew(){
try{
    if(fs.existsSync("./Config/testingdb")){
        db = new sqlite3.Database("./Config/testingdb");
    }
    else{
        dbconfig.initThis();
        db = new sqlite3.Database("./Config/testingdb");
    }
}
catch(err){
    console.log(err);

}
}
checkNew();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(helmet());
app.listen((process.env.PORT || 5000), ()=> {console.log('server running on http://localhost:5000/')});

  app.set('view engine', 'ejs');

  app.get('/', function(req, res) {
      res.render('pages/homepage',{login: req.session.loggedin, username:req.session.username});
  });
  app.get('/learnhome', function(req, res) {
      res.render('pages/learnhome',{login: req.session.loggedin, username:req.session.username});
  });
  app.get('/learnbubble', function(req, res) {
      res.render('pages/learnbubble', {login: req.session.loggedin, username:req.session.username});
  });
  app.get('/learnmerge', function(req, res) {
      res.render('pages/learnmerge', {login: req.session.loggedin, username:req.session.username});
  });

  app.get('/learnquick', function(req, res) {
      res.render('pages/learnquick', {login: req.session.loggedin, username:req.session.username});
  });

  app.get('/testhome', async(req, res) =>{

      db.all("SELECT * FROM attempt JOIN user ON attempt.userID = user.id ORDER BY attempt.score DESC ", (err,results)=>{
        if(err){
            console.error(err.message);
        }
        console.log(results);
        res.render('pages/testhome', {login: req.session.loggedin,username:req.session.username,scores: results});
        res.end();
    });
  });

  app.get('/login', function(req, res) {
        res.render('pages/login', {login: req.session.loggedin, username:req.session.username});
  });

  app.get('/signup', function(req, res) {
      res.render('pages/signup', {login: req.session.loggedin, username:req.session.username});
  });




app.get('/result/:testid/:score',(req,res)=>{
    var date = new Date();
    var TIMESTAMP = date.toISOString();


    db.all("Select id FROM user WHERE name = ?", [req.session.username], (err, results)=>{
        const testid = req.params.testid;
        const score = req.params.score;
        const userId = results[0].id;
        console.log(userId +" "+ testid + " " + score);
        db.serialize(function(){
        var stmt = db.prepare("INSERT INTO attempt (userId, testId, score, timeCompleted) VALUES(?,?,?, ?)");
        stmt.run(userId, testid, score, TIMESTAMP);
        stmt.finalize();
        console.log("made it past registering score");
    });
    })

  });

  app.get('/testbubble', function(req,res){
    if(req.session.loggedin){
        res.render('pages/testbubble', {login: req.session.loggedin, username:req.session.username});
    }
    else{
        backurl = req.header('Referer') || '/';
        console.log(backurl);
        console.log("trying the redirect");
        res.redirect('/loginredirect');
    }
  });

  app.get('/testmerge', function(req,res){
    if(req.session.loggedin){
        res.render('pages/testmerge', {login: req.session.loggedin, username:req.session.username});
    }
    else{
        backurl = req.header('Referer') || '/';
        console.log(backurl);
        console.log("trying the redirect");
        res.redirect('/loginredirect');
    }
  });

  app.get('/testquick', function(req,res){
    if(req.session.loggedin){
        res.render('pages/testquick', {login: req.session.loggedin, username:req.session.username});
    }
    else{
        backurl = req.header('Referer') || '/';
        console.log(backurl);
        console.log("trying the redirect");
        res.redirect('/loginredirect');
    }
  });


  app.get('/data/:testID', function(req,res){
    getQuestions(req.params.testID);
    setTimeout(function(){
          console.log("hi" + JSON.stringify(questions));
          res.send(questions);
    }, 100);
  });

  app.get('/report', function(req,res){
        res.render('pages/report',{login: req.session.loggedin, username:req.session.username});
  });

  app.get('/loginredirect', function(req,res){
    var typeOfDirect = false;
    if(loginFail ==  true){
        typeOfDirect = true;
        loginFail = false;
      }
        res.render('pages/login',{login: req.session.loggedin, username:req.session.username, type:typeOfDirect});
  });


  app.get('/account', function(req,res){
      console.log(req.session.username);
      if(req.session.loggedin){

        db.all("SELECT * FROM user  LEFT JOIN attempt ON attempt.userID = user.id WHERE user.name = ?",[req.session.username], (err,results) =>{
            if(err){
                console.error(err.message);
            }
          console.log("through the if");
          console.log(results);
          res.render('pages/account', {login: req.session.loggedin, username:req.session.username, scores: results});
        });
      }
      else{
          backurl = req.header('Referer') || '/';
          console.log(backurl);
          console.log("redirecting");
          res.redirect('/loginredirect');
      }
  });

app.post('/auth', function(request, response) {


    var username = request.body.username;
    var password = request.body.password;

    console.log(username);
    if (username && password) {
        db.all("SELECT * FROM user WHERE name = ?",[username] ,(err,results)=>{
            if(err){
                console.error(err.message);
            }
            console.log(results.length);
            if (results.length > 0) {
                console.log()
                if(passwordHash.verify(password, results[0].pw)){
                    request.session.loggedin = true;
                    request.session.username = username;


                    response.redirect('/');

                }
                else{
                    loginFail = true;
                    response.redirect('/loginredirect')
                }

            } else {
                loginFail = true;
                response.redirect('/loginredirect')
            }
            response.end();
        });
    }
     else {
         loginfail = true;
        response.redirect('/logindirect')
    }
});



app.post('/register', function(request, response){
    var username = request.body.regusername;
    var password = request.body.regpassword;
    var email = request.body.regEmail;
    var firstname = request.body.first;
    var lastname = request.body.reglast;
    if(request.body.regusername == null){

        username = request.body.username2;
        password = request.body.password2;
        email = request.body.email;
        firstname = request.body.first1;
        lastname = request.body.last1;
    }
    console.log(email + firstname + lastname);
    if(username && password && email && firstname && lastname){
        db.all("SELECT * FROM user WHERE name = ?",[username] ,(err,results)=>{
            if(err){
                console.error(err.message);
            }
            console.log(results.length);
            if (results.length > 0) {
                response.redirect("/loginredirect");
            } else {
                db.run("INSERT INTO user (name, pw,email,firstname,lastname) VALUES(?,?,?,?,?)",[username,passwordHash.generate(password), email, firstname, lastname]);
                request.session.username = username;
                request.session.loggedin =  true;
                console.log(request.session.username);
                request.session.userid = db.run("SELECT count(1) FROM user");
                console.log(request.session.userid);
                db.each("SELECT name, firstname, email, pw FROM user", function(err, row){
                    if(err){
                        console.log(err.message);
                    }
                    console.log("User id: " +row.name, row.pw, row.firstname, row.email);
                });
                response.render('pages/learnhome',{login: request.session.loggedin, username:request.session.username});
            }
            response.end();
        });
    }
    else{
        response.send("error receiving username, password and email");
    }
});
app.get('/logout', function(request,response){

    request.session.loggedin = false;
    request.session.username = "";
    response.redirect('/');
});

// Make the URL lower case.
function lower(req, res, next) {
    req.url = req.url.toLowerCase();
    next();
}


// Forbid access to the URLs in the banned list.
function ban(req, res, next) {
    for (var i=0; i<banned.length; i++) {
        var b = banned[i];
        if (req.url.startsWith(b)) {
            res.status(404).send("Filename not lower case");
            return;
        }
    }
    next();
}

// Redirect the browser to the login page.
function auth(req, res, next) {

    res.redirect("/pagetemplate.html");
}

// Called by express.static.  Deliver response as XHTML.
function deliverXHTML(res, path, stat) {
    if (path.endsWith(".html")) {
        res.header("Content-Type", "application/xhtml+xml");
    }
}

// Check a folder for files/subfolders with non-lowercase names.  Add them to
// the banned list so they don't get delivered, making the site case sensitive,
// so that it can be moved from Windows to Linux, for example. Synchronous I/O
// is used because this function is only called during startup.  This avoids
// expensive file system operations during normal execution.  A file with a
// non-lowercase name added while the server is running will get delivered, but
// it will be detected and banned when the server is next restarted.
function banUpperCase(root, folder) {
    var folderBit = 1 << 14;
    var names = fs.readdirSync(root + folder);
    for (var i=0; i<names.length; i++) {
        var name = names[i];
        var file = folder + "/" + name;
        if (name != name.toLowerCase()) banned.push(file.toLowerCase());
        var mode = fs.statSync(root + file).mode;
        if ((mode & folderBit) == 0) continue;
        banUpperCase(root, file);
    }
}



function getQuestions(testID){

    let sql = 'SELECT question, answer1, answer2, answer3, correct FROM questions WHERE test = ?'
    questions = [];
    db.serialize(function(){


     db.all(sql, [testID], (err, rows) =>{
        if(err){
            throw err;
        }
        rows.forEach(row=>
            questions.push({
                'question': row.question,
                'answers':{
                    a: row.answer1,
                    b: row.answer2,
                    c: row.answer3,
                },
                'correctAnswer': row.correct
            })
            )

        console.log(questions.length);
    });
    });
    console.log(questions.length + "bottom of test q's");
}