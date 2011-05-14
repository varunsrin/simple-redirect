
//Module dependencies
var express = require('express'),
    mongoose = require('mongoose'),

    Param,
    db,
    //Server + Models
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



// Default Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout:true});
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  Param = mongoose.model('Param');
});






// Routes
app.get('/', function(req, res){
   res.render('index.jade');
});



/*
 *  This Part deals with Error Handling
 */

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
    throw new Error('keyboard cat');
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



// Server Parameters [app.params]

app.param('title', function(req,res, next){
    Param.findOne({"title":req.param('title')}, function(err, record){
        if (err) return next(err);
        if (!record) return next (new Error('Parameter Not Found') ); 
        req.record = record;
        next();
    });         
}); 


app.param('value', function(req,res, next){
        req.pivot = req.record.findPivot(req);
        if (!req.pivot) return next (new Error('Pivot Not Found') ); 
        next();
}); 










/*
 *  This Part deals with Parametersaa
 */





//List Parameters
app.get('/params', function(req, res){
   Param.find({}, function(err,records){   
     res.render('params/index.jade', {locals: {records: records}});
   });
});




//Create Parameter
app.get('/params/new', function(req, res){
   res.render('params/new.jade', {title:'New Parameter'});
});

app.post('/params/new', function (req, res){
   console.log(req.body.param);
    var newParam = new Param();
    newParam.title = req.body.param.title;
    newParam.desc = req.body.param.desc;
    newParam.defaultUrl = req.body.param.defaultUrl;
    newParam.save(function(err){
          res.redirect('/params/');
    });
});



//View Parameter & List Pivots
app.get('/params/:title', function(req, res, next){
    res.render('params/show.jade', {locals: {record: req.record}});
});



//Update Parameter
app.get('/params/:title/edit', function(req,res, next){
    res.render('params/edit.jade', {locals: {record: req.record}});
});


app.put('/params/:title', function(req,res, next){
        req.record.title = req.body.param.title;
        req.record.desc = req.body.param.desc;
        req.record.defaultUrl = req.body.param.defaultUrl;
        req.record.save();
        res.redirect('/params/');
});


//Delete Parameter
app.get('/params/:title/delete', function(req,res, next){
        req.record.remove();
        res.redirect('/params/');
});





/*
 *  This Part deals with Pivots
 */


// Create Pivot
app.post('/params/:title', function(req,res, next){
        req.record.pivots.push({
                            value: req.body.pivot.value 
                          , destination: req.body.pivot.destination
                          });
        req.record.save();
        res.redirect('/params/' + req.record.title);
});


//udpate Pivot
app.get('/params/:title/:value/edit', function(req, res, next){
          res.render('pivots/edit.jade', {locals: {pivot: req.pivot,  record: req.record} }); 
});



app.put('/params/:title/:value', function(req,res, next){
    req.pivot.destination = req.body.pivot.destination;
    req.pivot.value = req.body.pivot.value;
    req.record.save();
    res.redirect('/params/' + req.param('title'));
});




//Delete Pivot
app.get('/params/:title/:value/delete', function(req, res, next){
    req.pivot.remove();
    req.record.save();
    res.redirect('/params/' + req.record.title);
});






/*
 *      This Next Part deals with redirecting incoming URLs by matching to appropriate parameters & pivots
 */

//This grabs the base case
app.get('/redirect/:title', function(req, res, next){
    req.record.counter++;
    req.record.save();
    res.redirect(req.record.defaultUrl);      
});


//This redirect works for all param cases with a value
app.get('/redirect/:title/:value', function(req, res, next){
    req.pivot.counter++;
    req.record.save();
    res.redirect(req.pivot.destination);
});



//Catch all for 404
app.get('*', function(req, res, next){
    res.render('404.jade');
});



// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
