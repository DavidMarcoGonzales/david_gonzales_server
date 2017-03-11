var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');

/* pull in mongoose and connect to mlab mongo database*/
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var db = mongoose.connect(process.env.mongodb_books);

/* Create our express routing app */
var app = express();


/* Add Generic Middleware */
/* set port */
app.set('port', (process.env.PORT || 3000));

/*
 * https://expressjs.com/en/starter/static-files.html
 * Serve static files from this directory
 * app.use = middleware
 */
app.use(express.static('build'));


/* parses body of incoming json */
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

/* API handler sends message and displays on screen */
app.get('/', function (req, res) {
    res.send('Welcome to my API, said Dave');
});

/* Pull in book model and genericRoute and pass models to genericRoute*/
var Book = require('./models/bookModel');
var bookRouter = require('./Routes/genericRoute')(Book);

/* Apply middleware bookRoute to app with the route /api/books */
app.use('/api/books', bookRouter);
//app.use('/api/authors', authorRouter);


/* have app listen on port */
app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});


