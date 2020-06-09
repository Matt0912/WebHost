
var sqlite3 = require('sqlite3').verbose();
let db;
var path = "./testingdb";
console.log("inside initthis");


async function initThis(){
        db = new sqlite3.Database(path);
        
        db.serialize(function(){
        
            db.run("DROP TABLE IF EXISTS user");
            console.log("why");
            db.run("CREATE TABLE user ( name TEXT PRIMARY KEY, pw TEXT NOT NULL)");
            console.log("why 2");
            var stmt = db.prepare("INSERT INTO user(name, pw) VALUES(?,?)");
            stmt.run("tiasssssss", "m");
            stmt.finalize();
            db.each("SELECT name, pw FROM user", function(err, row){
                if(err){
                    console.log(err.message);
                }
                console.log("User id: " +row.name, row.pw);
            });
        db.serialize( async function(){
            var date = new Date();
            var TIMESTAMP = date.toISOString();
            db.run("DROP TABLE IF EXISTS test");
            db.run("DROP TABLE IF EXISTS questions");
            db.run("DROP TABLE IF EXISTS attempt");
            db.run("CREATE TABLE test(ID INTEGER PRIMARY KEY autoincrement, setby INT NOT NULL, FOREIGN KEY(setby) REFERENCES user(id))")
             db.run("CREATE TABLE questions (id INTEGER PRIMARY KEY autoincrement, question TEXT, answer1 TEXT, answer2 TEXT, answer3 TEXT, correct TEXT, test INT)");
             db.run("CREATE TABLE attempt (id INTEGER PRIMARY KEY autoincrement, userID TEXT, testID INTEGER NOT NULL, score INTEGER NOT NULL, timeCompleted DATETIME, FOREIGN KEY(userID) REFERENCES user(name), FOREIGN KEY (testID) REFERENCES test(ID))");
            
            var stmt = db.prepare("INSERT INTO test (setby) VALUES(?)");
            stmt.run(1);
            stmt.finalize;
            var stmt = db.prepare("INSERT INTO questions (question, answer1,answer2,answer3,correct, test) VALUES(?,?,?,?,?,?)");
            
            stmt.run("What is the complexity of a bubble sort?", "hi", "no", "yes", "a", 1);
            stmt.run("What step is comparing the second and third values in a bubblesort?","hi", "no", "yes", "a", 1);
            stmt.run("placeholder", "hi", "no", "yes","b", 1);
            stmt.finalize();
            var stmt = db.prepare("INSERT INTO attempt (userID, testID, score, timeCompleted) VALUES(?,?,?, ?)");
            stmt.run("tias",1,1, TIMESTAMP);
            stmt.finalize;
            console.log("hi");
            db.each("SELECT id, question, answer1, test FROM questions", (err,row)=>{
                if(err){
                    console.error(err.message);
                }
                console.log(row.id + "\t" + row.question + "\t" + row.answer);
            });
             db.each("SELECT userID, testID, score FROM attempt", (err,row)=>{
                if(err){
                    console.error(err.message);
                }
                console.log(row.userID + "\t" + row.testID + "\t" + row.score);
            });
        });
        
        
        });
   
        
}




function close(){
    db.close;
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

module.exports = {
    getQuestions,
    initThis,
    close
};