var mongoose = require('mongoose');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;


//BEGIN VALIDATORS

//Validates a given URL
//Validates for exploits?

function validateUrl (v) {
	return v.match( /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/ );
};


//Validates if a given string is greater than 2, or less than 11, and is alphanumeric
//ToDo: Validate for no unqiueness, simplify validation into one regexp 

function validateLength (v) {
       console.log(v.length > 2 && v.length < 11);
       return v.length > 2 && v.length < 11 && v.match( /^[a-zA-Z0-9_]+$/ );
};


//Validates if the string is greater than 0 or less than 100
function validateDesc (v) {
       console.log(v.length > 0 && v.length < 101);     
       return v.length > 0 && v.length < 101;
};


//BEGIN PIVOT
//ToDo: Ensure pivots are not unique across params due to unique indices
var Pivot = new Schema({
    value       : {type: String, validate: [validateLength, 'length error'] } 
  , destination : {type: String, validate: [validateUrl, 'url error'] } 
  , counter     : {type: Number, default: 0 }
 });



//BEGIN PARAM
var Param = new Schema({
    title      : {type: String, validate: [validateLength, 'length error'] } 
  , desc       : {type: String, validate: [validateDesc, 'length error'] }
  , defaultUrl : {type: String, validate: [validateUrl, 'url error']  } 
  , counter    : {type: Number, default: 0 }
  , pivots     : [Pivot]
});

Param.method('findPivot', function(req ){
      //We are using a traditional find, consider using a faster algorithm
      for (var i=0; i < this.pivots.length; i++){
         if (this.pivots[i].value == req.param('value')){return this.pivots[i];}
         else {
            console.log('Failed to find a pivot'); 
            return null;
         }
      }     
});



mongoose.model('Param', Param);
