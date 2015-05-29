
/*
 * GET home page.
 */
var express = require('express');
var redis=require('redis')
var proxis=require('geo-proximity');
var db;

var cloudant;

var fileToUpload;

var dbCredentials = {
	dbName : 'fishdb'
};

function loadItems2(res)
{
	res.status(200).json({ a : 1});
}
function loadItems(res){
	
}
exports.index = function(req, res,next){
	loadItems(res);
	next();
};
exports.myfishall = function(req, res){
	console.log("WWWWWin myfish all");
	
	addmyfish(req,res);
	
};
exports.redisnow = function(req, res){
	console.log("WWWWWin redisnow");
	
	redisnow(req,res);
	
};


exports.species = function(req, res){
	  res.send("respond with a species!!! resource");
	//next();
	};
exports.speciesall = function(req, res,next){
		 
		next();
		};
function addmyfish(req,res){
	console.log("s!!! started addmyfish!!!!");
	
	
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.cloudantNoSQLDB) {
			dbCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
			dbCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
			dbCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
			dbCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
			dbCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
		}
		console.log('VCAP Services: '+JSON.stringify(process.env.VCAP_SERVICES));
	}
	
	cloudant = require('cloudant')(dbCredentials.url);
	
	//check if DB exists if not create
	/*cloudant.db.create(dbCredentials.dbName, function (err, res) {
		if (err) { console.log('could not create db ', err); }
    });*/
	db = cloudant.use(dbCredentials.dbName);
	
	var fmyfish=cloudant.use("myfish");
	
	var pp=req.body;
	console.log(req.body);
	var len=pp.length;
	console.log("req body length is "+len);
	var i=0;var jj=0;
	for(i=0;i<len-1;i++){
		jj=randomInt(0,100);
		console.log("WWWWWWbefore insert ");
		fmyfish.insert({
			value:pp[i]
			
		},'doc'+i+jj.toString(),
				function(err, body, header) {
	       // if (err)
	         // return console.log('[myfish.insert] ', err.message)

	        console.log('you have inserted a doc into species.')
	        
	      });
	
	}
	console.log("end inserting myfish....");
	res.send("success inserting myfish");
	
	
	
	
	
	//res.send("WWWWposting myfish");
}
function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
function redisnow(req,res){
	console.log("!!! started redisnow!!!!");
	var credentials;
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		
		
		 credentials = vcapServices['redis-2.6'][0]['credentials'];
	} else {
	   credentials = {"host":"50.23.230.140", "port":5218, "username":name,
	    "password":password}
		console.log('VCAP Services: '+JSON.stringify(process.env.VCAP_SERVICES));
	}
	
	
	var client = redis.createClient(credentials.port, credentials.host);
	  if (credentials.password != '') {
	    client.auth(credentials.password);
	  }
	  
		
	
	var proximity=require('geo-proximity').initialize(client);

	//look for all locations within 5000m of a given location
	var pp=req.body;
	console.log("latitude is ")
	console.log(pp[0].lat)
	console.log(pp[0].long)
	console.log("after getting body")
	console.log("EEEEEE before getting proximityEEEEE")
	var ppeffl,pplocs;
	var proximity2 = proxis.initialize(client, {
	  zset: 'peffluents',
	  cache: false
	})
	proximity2.nearby(pp[0].lat, pp[0].long, 5000, function(err, locations1){
	    	  if(err) console.error(err)
	    	  else {
	    		  console.log('nearby effluents:', locations1)
	    		 
	    		  res.send(locations1);
	    		  
	    	  }
	    	  
	    	})
	 
	    	
	   
	
	console.log("end redisnow");
	
	
}

		
