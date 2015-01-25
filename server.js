
//Module dependencies
var express = require('express'),
    mongoose = require('mongoose'),

    Redirect,
    db,
    app = module.exports = express.createServer(),
    models = require('./models');


//Development Config
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  db = mongoose.connect('mongodb://localhost/test');
});


//Production Config
app.configure('production', function(){
  app.use(express.errorHandler()); 
  db = mongoose.connect(process.env['DUOSTACK_DB_MONGODB']);
});


// Default Config
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout:true});
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  Redirect = mongoose.model('Redirect');
});


/*
 *  Core Routes
 */

app.get('/', function(req, res){
   res.render('index.jade');
});

function NotFound(msg) {
    this.name = 'notFound';
    Error.call(this, msg);
    Error.captureStackTrace (this, arguments.callee);
}

NotFound.prototype.__proto__ = Error.prototype;

app.get('/404', function(req,res){
    throw new NotFound;
}); 

app.get('/500', function(req,res){
    throw new Error('SimpleRedir - Error type 500 occured');
}); 

app.error(function(err, req, res, next){
    if (err instanceof NotFound){
       res.render('404.jade');
    } else {
       next (err);
    }
});

app.error(function(err, req, res){
    res.render('500.jade', {locals: {error: err }});
});

app.param('title', function(req,res, next){
    Redirect.findOne({"title":req.param('title')}, function(err, redirect){
        if (err) return next(err);
        if (!redirect) return next (new Error('Parameter Not Found') ); 
        req.redirect = redirect;
        next();
    });         
}); 

app.param('value', function(req,res, next){
        req.pivot = req.redirect.findPivot(req.param('value'));
        if (!req.pivot) return next (new Error('Pivot Not Found') ); 
        next();
}); 


/*
 *  Parameter
 */

// List
app.get('/redirects', function(req, res){
   Redirect.find({}, function(err, redirects){   
     res.render('redirects/index.jade', {locals: {redirects: redirects}});
   });
});


//Create
app.get('/redirects/new', function(req, res){
   res.render('redirects/new.jade', {title:'New Parameter'});
});

app.post('/redirects/new', function (req, res){
    var newRedirect = new Redirect();
    newRedirect.title = req.body.redirect.title;
    newRedirect.desc = req.body.redirect.desc;
    newRedirect.defaultUrl = req.body.redirect.defaultUrl;
    newRedirect.save(function(err){
          res.redirect('/redirects/');
    });
});


//View, List Pivots
app.get('/redirects/:title', function(req, res, next){
    res.render('redirects/show.jade', {locals: {redirect: req.redirect}});
});


//Update
app.get('/redirects/:title/edit', function(req,res, next){
    res.render('redirects/edit.jade', {locals: {redirect: req.redirect}});
});

app.put('/redirects/:title', function(req,res, next){
        req.redirect.desc = req.body.redirect.desc;
        req.redirect.defaultUrl = req.body.redirect.defaultUrl;
        req.redirect.save(function(err) {
            res.redirect('/redirects/');
        });
        
});


//Delete
app.get('/redirects/:title/delete', function(req,res, next){
        req.redirect.remove( function() {
           res.redirect('/redirects/');
        });
        
});


/*
 *  Pivot
 */

// Create
app.post('/redirects/:title', function(req,res, next){
        req.redirect.pivots.push({
                            value: req.body.pivot.value 
                          , destination: req.body.pivot.destination
                          });
        req.redirect.save( function() {
           res.redirect('/redirects/' + req.redirect.title);
        });
});


//Read
app.get('/redirects/:title/:value/edit', function(req, res, next){
          res.render('pivots/edit.jade', {locals: {pivot: req.pivot,  redirect: req.redirect} }); 
});


//Update
app.put('/redirects/:title/:value', function(req,res, next){
    req.pivot.destination = req.body.pivot.destination;
    req.pivot.value = req.body.pivot.value;
    req.redirect.save( function() {
       res.redirect('/redirects/' + req.param('title'));
    });
});

//Delete
app.get('/redirects/:title/:value/delete', function(req, res, next){
    req.pivot.remove();
    req.redirect.save(function () {
       res.redirect('/redirects/' + req.redirect.title);
    });
    
});



/*
 *      Redirect API Routes
 */

app.get('/r/:title', function(req, res, next){
    req.redirect.paramcounter++;
    req.redirect.save(function () {
       res.redirect(req.redirect.defaultUrl);
    });
          
});

app.get('/r/:title/:value', function(req, res, next){
    req.pivot.pivotcounter++;
    req.redirect.save( function() {
       res.redirect(req.pivot.destination);
    });
});


// Execute

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
