/**
 * Module dependencies.
 */

require ('knj-plugin');
require ('loganalysis');
var fs = require('fs');
var parse = require('csv-parse');
var transform=require('stream-transform');
var redis = require('redis');
//require('gopher')
//var twilio=require('twilio')

var proxis=require('geo-proximity');
var password="280618aa-5976-4a37-8394-aec788fcf721"
var name="db8d7ee2-d984-41a4-8aff-d00110673dc5"

//var parse = require('csv-parse');
//var transform = require('stream-transform');
var express = require('express'), routes = require('./routes'), user = require('./routes/user'), http = require('http'), path = require('path'), fs = require('fs');

var app = express();


var db;

var cloudant;

var fileToUpload;

var dbCredentials = {
	dbName : 'fishdb'
};
//for parsing
var speciesJSON={"otRiverSpecies":{}};

var credentials ;
var client;



// all environments
app.set('port', process.env.PORT || 3000);
app.set('uploads',__dirname+ '/uploads');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.multipart());
app.use(express.methodOverride());
app.use(app.router);
//app.use('/species',species);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}



function initDBConnection() {
	
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.cloudantNoSQLDB) {
			dbCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
			dbCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
			dbCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
			dbCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
			dbCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
		}
		
		 credentials = vcapServices['redis-2.6'][0]['credentials'];
	} else {
	   credentials = {"host":"50.23.230.140", "port":5218, "username":name,
	    "password":password}
		console.log('VCAP Services: '+JSON.stringify(process.env.VCAP_SERVICES));
	}
	
	
	cloudant = require('cloudant')(dbCredentials.url);
	
	//check if DB exists if not create
	cloudant.db.create(dbCredentials.dbName, function (err, res) {
		if (err) { /*console.log('could not create db ', err);*/ }
    });
	db = cloudant.use(dbCredentials.dbName);
	}

function parseSpecies(){
	
	//var parse = require('csv-parse');
	//var transform=require('stream-transform');
	
	var parser = parse({delimiter: ','}, function(err, data){
	  //console.log(data);
	});
	
	
	//read the columns
	// Using the first line of the CSV data to discover the column names
	var rs = fs.createReadStream(__dirname+'/public/uploads/fishspecies86.csv');
	//console.log("PPPP after creating read stream");
	 
	parser = parse({columns: true}, function(err, data){
		//console.log("in functionPPPP");
		if(err)
			return console.log("error in parse");
	  //console.log(data);
	  //now save in database as individual docs
	  insertSpecies(data);
	});
	console.log("PPPP after parsing columns");
	rs.pipe(parser);
	

	//transform the record
	
	/*console.log("PPPPP before transform");
	var transformer = transform(function(record, callback){
		  setTimeout(function(){
		    callback(null, function(record){
		    	console.log("record is ");
		    	console.log(record);
		    //if record[yy]=='Exists'
		    	//take record[yy] position pp 
		    	//create object, stringify and to json
		    	//speciesName={'species':'item'}
		    	//speciesJSON.otRiverSpecies.push(speciesName)
		    	
		    });
		  }, 500);
		}, {parallel: 10});
		rs.pipe(parser).pipe(transformer).pipe(process.stdout);*/
}
function parseEffluents(){
	
	//var parse = require('csv-parse');
	//var transform=require('stream-transform');
	
	var parser = parse({delimiter: ','}, function(err, data){
	  //console.log(data);
	});
	
	
	//read the columns
	// Using the first line of the CSV data to discover the column names
	var rs = fs.createReadStream(__dirname+'/public/uploads/2013_municipal_private_sewage_csv2.csv');
	//console.log("PPPP after creating read stream");
	 
	parser = parse({columns: true}, function(err, data){
		//console.log("in functionPPPP");
		if(err)
			return console.log("error in parse");
	  //console.log(data);
	  //now save in database as individual docs
	  insertEffluents(data);
	});
	//console.log("PPPP after parsing columns");
	rs.pipe(parser);
	
}
function insertEffluents(data){
	
	//console.log("EEEEE in insert effluents");
	var i=0;
	/*cloudant.db.destroy("effluents",function(error,res){
		
	});*/
	//console.log("EEEEE in insert species#2");
	
	
	var feffluents=cloudant.use("effluents");
	//console.log("PPPPdata length "+data.length);
	for (i=0;i<data.length;i++)
	{
		
		feffluents.insert({
			value:data[i]
			
		},'doc'+i,
				function(err, body, header) {
	        if (err)
	          return console.log('[effluents.insert] ', err.message)

	        //console.log('you have inserted doc into effluents.')
	       
	      });

		
	}

}


function insertSpecies(data){
	
	//console.log("EEEEE in insert species");
	var i=0;
	/*cloudant.db.destroy("species",function(error,res){
		
	});*/
	//console.log("EEEEE in insert species#2");
	
	
	var fspecies=cloudant.use("species");
	//console.log("PPPPdata length "+data.length);
	for (i=0;i<data.length;i++)
	{
		
		fspecies.insert({
			value:data[i]
			
		},'doc'+i,
				function(err, body, header) {
	        if (err)
	          return console.log('[species.insert] ', err.message)

	       // console.log('you have inserted doc into species.')
	       // console.log(body)
	      });

		
	}

}
function checkSpeciesPopulated(){
	//console.log("!!!checking species");
	var species=cloudant.use('species');
	species.list(function(err, body) {
		//console.log("!!!listing species");
		if (!err) {
			//console.log("NNNNNnot error!!!");
			var len = body.rows.length;
			//console.log("PPPPP!!! num of rows "+len);
			if(len==0)
				parseSpecies();
		
		}
		else{
			//console.log("EEEE error listing species",err);
			cloudant.db.create("species", 
					
					function(error,res){
						console.log("RRRRR error creating species table RRRRRRR ");
					});
			parseSpecies();
		}
	});
	
	//console.log("!!!!!!end of check species");
	return;

}
function checkEffluentsPopulated(){
	//console.log("!!!checking species");
	var effluents=cloudant.use('effluents');
	effluents.list(function(err, body) {
		//console.log("!!!listing species");
		if (!err) {
			console.log("NNNNNnot error!!!");
			var len = body.rows.length;
			console.log("PPPPP!!! num of rows "+len);
			if(len==0)
				parseEffluents();
		
		}
		else{
			//console.log("EEEE error listing species",err);
			cloudant.db.create("effluents", 
					
					function(error,res){
						console.log("RRRRR creating effluents table RRRRRRR ");
					});
			parseEffluents();
		}
	});
	
	console.log("!!!!!!end of check effluents");
	return;

}

function initProximity(){
	
		
	 client = redis.createClient(credentials.port, credentials.host);
	  if (credentials.password != '') {
	    client.auth(credentials.password);
	  }
	  
	var proximity=proxis.initialize(client);
	
	  
		
	var proximity2 = proxis.initialize(client, {
		  zset: 'peffluents',
		  cache: false
		}) 		
	
	//var location=[45.447116,-75.346587,  'Biochemical Ottawa'];
	//proximity.addLocation(lat,long,'name',function(err,reply(){}));
	//set of effluents by geocords
	var peffluents=[[45.447116,-75.346587, 'Biochemical#Ottawa'],
	                 [45.486784,-76.074965, 'Suspended solids#Ottawa'],
	                 [46.527165,-80.988509, 'Sewage#Sudbury'],
	                 [44.646182,-75.691577, 'Carbonaceous Biochemical#Brockville'],
	                 [44.646182,-75.691577,  'Nitrate#Brockville'],
	                 [44.646182,-75.691577,  'Suspended solids#Brockville'],
	                 [44.646182,-75.691577,  'Suspended solids#Brockville'],
	                 [45.368021,-75.7669024, 'Sewage#Arnprior' ],
	                 [48.481141,-81.353201, 'Biochemical#Cochrane Timmins'],
	                 [48.481141,-81.353201, 'Phosphorus#Cochrane Timmins' ],
	                 
	                 [45.611800,-74.596968, 'Escheria Coli#Hawkesbury'],
	                 [45.611800,-74.596968, 'Sewage#Hawkesbury'],
	                 [48.481357,-81.353647, 'Phosphorus#Hearst Timmins'],
	                 [48.481357,-81.353647, 'Sewage#Hearst Timmins'],
	                 [48.739424,-80.671332, 'Sewage#Iroquois Falls' ],
	                 [48.739424,-80.671332, 'Escheria Coli#Iroquois Falls'],
	                 [49.420233,-82.471151, 'Sewage#Kapuskasing'],
	                 [45.826421,-76.905692,  'Phosphorus#Petawawa'],
	
	                 [48.542150,-80.483967, 'Phosphorus#Black River Matheson'],
	                 [47.360502,-68.302046, 'Sewage#Madawaska Valley'],
	                 [47.360502,-68.302046, 'Phosphorus#Madawaska Valley'],
	                 [48.495791,-81.360017,  'Phosphorus#McGarry'],
					[45.374813,-75.795833,  'Coliforms#Brittania Ottawa'],
					[45.518591,-75.435867,  'Unknown#Cumberland'],
					[45.550783,-75.309363,  'Unknown#Clarence Rockland'],
					[45.597379,-75.243630,  'Unknown#Thurso'],
	[46.713820,-79.121199,  'Unknown#Tapiscaming'],
	[46.647199,-79.084539,  'Unknown#Eldee'],
	[46.318127,-78.719243,  'Unknown#Mattawa'],
	[46.290805,-78.503524,  'Unknown#Klock'],
	[46.249322,-78.320434,  'Unknown#Deux-Rivieres'],
	[46.232355,-78.090284,  'Unknown#Bissett Creek'],
	[46.214303,-77.878797,  'Unknown#Stonecliffe'],
	[46.176279,-77.801893,  'Unknown#Mackey'],
	[46.197195,-77.703016,  'Unknown#Rapides-des-Joachims'],
	[46.167720,-77.709882,  'Unknown#Rolphton'],
	[46.134422,-77.569807,  'Unknown#Point Alexander'],
	[45.854883,-77.141340,  'Unknown#Pembroke'],
	[45.870185,-76.712873,  'Unknown#Fort-Coulonge'],
	[45.485013,-76.426116,  'Unknown#Sand Point'],
	[45.519663,-76.232482,  'Unknown#Quron'],
	[45.485494,-75.960570,  'Unknown#Breckenridge'],
	[45.606756,-75.113381,  'Unknown#Plainsance'],
	[45.617323,-75.032357,  'Unknown#Papineauville'],
	[45.649972,-74.949959,  'Unknown#Montebello'],
	[45.637971,-74.901894,  'Unknown#Lefaivre'],
	[45.644212,-74.865502,  'Unknown#Fassett'],
	[45.619725,-74.694527,  'Unknown#L-Orignal'],
	[45.647812,-74.646805,  'Unknown#Calumet'],
	[45.587538,-74.488533,  'Unknown#Chute-a-Blondeau'],
	[45.584175,-74.373864,  'Unknown#Lile-aux-Chats'],
	[45.567833,-74.378670,  'Unknown#Carillon'],
	[45.561584,-74.373864,  'Unknown#Pointe Fortune'],
	[45.497608,-74.161004,  'Unknown#Pointe-aux-Anglais'],
	[45.459573,-74.147271,  'Unknown#Hudson'],
	[45.465833,-74.082726,  'Unknown#Oka']
	
	]
	
	
	
	
	//proximity.deleteSet('locations',function(err,result){});
	//proximity.deleteSet('locations2',function(err,result){});
	//proximity2.deleteSet(peffluents,function(err,result){});
	
	//bulk
	/*var locations2 = [[45.447116,-75.346587, {'effluent': 'Biochemical','location':'Ottawa'}],
	                 [45.486784,-76.074965,  {'effluent': 'Suspended solids','location':'Ottawa'}],
	                 [46.527165,-80.988509, {'effluent':'Sewage','location':'Sudbury'}],
	                 [44.646182,-75.691577, {'effluent':'Carbonaceous Biochemical','location':'Brockville'}],
	                 [44.646182,-75.691577,  {'effluent':'Nitrate','location':'Brockville'}],
	                 [44.646182,-75.691577,  {'effluent':'Suspended solids','location':'Brockville'}],
	                 [44.646182,-75.691577,  {'effluent':'Suspended solids','location':'Brockville'}],
	                 [45.368021,-75.7669024, {'effluent':'Sewage','location':'Arnprior'} ],
	                 [48.481141,-81.353201, {'effluent':'Biochemical','location':'Cochrane Timmins'}],
	                 [48.481141,-81.353201, {'effluent':'Phosphorus','location':'Cochrane Timmins'} ],
	
	  [45.611800,-74.596968, {'effluent':'Escheria Coli','location':'Hawkesbury'}],
      [45.611800,-74.596968, {'effluent':'Sewage','location':'Hawkesbury'}],
      [48.481357,-81.353647, {'effluent':'Phosphorus','location':'Hearst Timmins'}],
      [48.481357,-81.353647,  {'effluent':'Sewage','location':'Hearst Timmins'}],
      [48.739424,-80.671332, {'effluent':'Sewage','location':'Iroquois Falls'} ],
      [48.739424,-80.671332, {'effluent':'Escheria Coli','location':'Iroquois Falls'}],
      [49.420233,-82.471151, {'effluent':'Sewage','location':'Kapuskasing'}],
      [45.826421,-76.905692,  {'effluent':'Phosphorus','location':'Petawawa'}],
	
	[48.542150,-80.483967, {'effluent':'Phosphorus','location':'Black River Matheson'}],
    [47.360502,-68.302046, {'effluent':'Sewage','location':'Madawaska Valley'}],
    [47.360502,-68.302046, {'effluent':'Phosphorus','location':'Madawaska Valley'}],
    [48.495791,-81.360017,  {'effluent':'Phosphorus','location':'McGarry'}]
 	]*/
	console.log("before adding peffluentsWWWWWWWW")
	console.log(peffluents)
	proximity2.addLocations(peffluents,function(err,reply){
		if(err) console.error(err)
		  else console.log('added peffluents:', reply)

	})
	
	
	//look for all locations within 5000m of a given location
    
	
}

function initTwilio(){
	// Pull in Twilio config from the BlueMix environment
	// The VCAP_SERVICES environment variable contains a JSON string with all your
	// BlueMix environment data
	///var config = JSON.parse(process.env.VCAP_SERVICES);
	 
	// Loop through user-provided config info and pull out our Twilio credentials
	/*var twilioSid, twilioToken;
	config['user-provided'].forEach(function(service) {
	    if (service.name == 'Twilio') {
	        twilioSid = service.credentials.accountSID;
	        twilioToken = service.credentials.authToken;
	    }
	});*/
	 
}

initDBConnection();
initProximity();
checkSpeciesPopulated();
checkEffluentsPopulated();
//initTwilio();


app.get('/', routes.index);

app.post('/myfish/redisnow', routes.redisnow);
app.post('/myfish/_bulk_docs', routes.myfishall);
app.get('/species', routes.species);
app.get('/species/_all_docs', routes.speciesall);
app.get('/species/_all_docs', function (req, res) {

	console.log("#1:Get method invoked.. ")
	
	db = cloudant.use(dbCredentials.dbName);
	var docList = [];
	var i = 0;
	var species=cloudant.use('species');
	species.list(function(err, body) {
		console.log("#2:in db list. ")
		if (!err) {
			var len = body.rows.length;
			console.log('#3:total # of docs -> '+len);
			if(len == 0) {
				//no documents to return
				console.log("no documents to return ")
			}
			else {
				console.log("#4:len>0 "+len)
				body.rows.forEach(function(document) {
					species.get(document.id, { revs_info: true }, function(err, doc) {
						if (!err)
							if(doc['_attachments']) {
								
							}//if doc attachments
							else {
								/*console.log("#5:BBBBB in else NEW");
								console.log(document.id);
								console.log(JSON.stringify(document.value));
								console.log(JSON.stringify(document.value.fishNameE));
								
								console.log(document.attributes);
								
								console.log("#6:END BBBBB in else NEW");*/
								
								var responseData = createResponseData(
										doc._id,
										doc.name,
										doc.value,
										[]);
							}//if doc attachments
						console.log("before push into response data");
						console.log(responseData);
						docList.push(responseData);
						i++;
						if(i >= len) {
							console.log("in response write");
							res.write(JSON.stringify(docList));
							console.log('ending response...');
							res.end();
						}
					});//db.get
					
				}); //body.rows for each
				
			}//else if len>0
			
		}//if !err
		else {
			console.log(err);
		}
		
	});//db list
	
	
});	

/*app.get('/', function (req, res) {

	console.log("Get method invoked.. ")
	
	db = cloudant.use(dbCredentials.dbName);
	var docList = [];
	var i = 0;
	db.list(function(err, body) {
		console.log("XXXXXin db list. ")
		if (!err) {
			var len = body.rows.length;
			console.log('XXXXXtotal # of docs -> '+len);
			if(len == 0) {
				//no documents to return
				console.log("no documents to return ")
			}
			else {
				console.log("len>0 "+len)
				body.rows.forEach(function(document) {
					db.get(document.id, { revs_info: true }, function(err, doc) {
						if (!err)
							if(doc['_attachments']) {
								var attachments = [];
								for(var attribute in doc['_attachments']){
									if(doc['_attachments'][attribute] && doc['_attachments'][attribute]['content_type']) {
										attachments.push({"key": attribute, "type": doc['_attachments'][attribute]['content_type']});
									}//if doc attachments
								    console.log(attribute+": "+JSON.stringify(doc['_attachments'][attribute]));	
								}//for att in attachments
								console.log("AAAA ");
								console.log(doc._id);
								console.log(doc.name);
								console.log(doc.value);
								console.log("END AAAA ");
								var responseData = createResponseData(
										doc._id,
										doc.name,
										doc.value,
										attachments);
							}//if doc attachments
							else {
								console.log("BBBBB in else");
								console.log(doc._id);
								console.log(doc.name);
								console.log(doc.value);
								console.log("END BBBBB in else");
								var responseData = createResponseData(
										doc._id,
										doc.name,
										doc.value,
										[]);
							}//if doc attachments
						console.log("before push into response data");
						docList.push(responseData);
						i++;
						if(i >= len) {
							console.log("in response write");
							res.write(JSON.stringify(docList));
							console.log('ending response...');
							res.end();
						}
					});//db.get
					
				}); //body.rows for each
				
			}//else if len>0
			
		}//if !err
		else {
			console.log(err);
		}
		
	});//db list
	
	
});	*/

	// POST method route
/*app.post('/', function (req, res) {
	  res.send('POST request to the homepage');
	});*/


function createResponseData(id, name, value, attachments) {

	
	var responseData = {
		"speciesNameE" : value.speciesNameE,
		//"fishNameF" : value.fishNameF,
	
	};
	
	 
	/*attachments.forEach (function(item, index) {
		console.log("CCCCCDDD in create response data");
		
		console.log(item.type);
		console.log(item.key);
		console.log(item.url);
		
		console.log("CCCCCDDD END in create response data");
		var attachmentData = {
			content_type : item.type,
			key : item.key,
			url : 'http://' + dbCredentials.user + ":" + dbCredentials.password
					+ '@' + dbCredentials.host + '/' + dbCredentials.dbName
					+ "/" + id + '/' + item.key
		};
		responseData.attachements.push(attachmentData);
		
	});*/
	return responseData;
}


var saveDocument = function(id, name, value, response) {
	
	if(id === undefined) {
		//Generated random id
		id = '';
	}
	
	db.insert({
		name : name,
		value : value
	}, id, function(err, doc) {
		if(err) {
			console.log(err);
			response.send(500);
		} else
			response.send(200);
		response.end();
	});
	
}


app.post('/api/favorites/attach', function(request, response) {

	console.log("Upload File Invoked..");
	console.log('Request: ' + JSON.stringify(request.headers));
	
	var id;
	
	db.get(request.query.id, function(err, existingdoc) {
		
		
		var isExistingDoc = false;
		if (!existingdoc) {
			id = '-1';
		} else {
			id = existingdoc.id;
			isExistingDoc = true;
		}

		var name = request.query.name;
		var value = request.query.value;

		var file = request.files.file;
		var newPath = './public/uploads/'
				+ file.name;
		
		
		var insertAttachment = function(file, id, rev, name, value, response) {
			
			fs.readFile(file.path, function(err, data) {
				  if (!err) {
				    
					  if(file) {
						  
						  db.attachment.insert(id, /*value*/file.name, data, file.type,
						      {rev: rev}, function(err, document) {
						        if (!err) {
						        	console.log('Attachment saved successfully.. ');
	
									db.get(document.id, function(err, doc) {
										console.log('Attachements from server --> ' + JSON.stringify(doc._attachments));
										
										var attachements = [];
										var attachData;
										for(var attachment in doc._attachments) {
//											console.log('Attachement from server --> ' + JSON.stringify(attachment));
											if(attachment == value) {
												attachData = {"key": attachment, "type": file.type};
											} else {
												attachData = {"key": attachment, "type": doc._attachments[attachment]['content_type']};
											}
											attachements.push(attachData);
										}
										var responseData = createResponseData(
												id,
												name,
												value,
												attachements);
										console.log('Response after attachment: \n'+JSON.stringify(responseData));
										response.write(JSON.stringify(responseData));
										response.end();
										return;
									});
						        } else {
						        	console.log(err);
						        }
						    });
					  }
					  

				  }
				});
		}

		if (!isExistingDoc) {
			existingdoc = {
				name : name,
				value : value,
				create_date : new Date()
			};
			
			// save doc
			db.insert({
				name : name,
				value : value
			}, '', function(err, doc) {
				if(err) {
					console.log(err);
				} else {
					
					existingdoc = doc;
					console.log("New doc created ..");
					console.log(existingdoc);
					insertAttachment(file, existingdoc.id, existingdoc.rev, name, value, response);
					
				}
			});
			
		} else {
			console.log('Adding attachment to existing doc.');
			console.log(existingdoc);
			insertAttachment(file, existingdoc._id, existingdoc._rev, name, value, response);
		}
		
	});

});

app.post('/api/favorites', function(request, response) {

	console.log("Create Invoked..");
	console.log("Name: " + request.body.name);
	console.log("Value: " + request.body.value);
	
	//var id = request.body.id;
	var name = request.body.name;
	var value = request.body.value;
	
	saveDocument(null, name, value, response);

});

app.del('/api/favorites', function(request, response) {

	console.log("Delete Invoked..");
	var id = request.query.id;
	// var rev = request.query.rev; // Rev can be fetched from request. if needed, send the rev from client
	console.log("Removing document of ID: " + id);
	console.log('Request Query: '+JSON.stringify(request.query));
	
	db.get(id, { revs_info: true }, function(err, doc) {
		if (!err) {
			db.destroy(doc._id, doc._rev, function (err, res) {
			     // Handle response
				 if(err) {
					 console.log(err);
					 response.send(500);
				 } else {
					 response.send(200);
				 }
			});
		}
	});

});

app.put('/api/favorites', function(request, response) {

	console.log("Update Invoked..");
	
	var id = request.body.id;
	var name = request.body.name;
	var value = request.body.value;
	
	console.log("ID: " + id);
	
	db.get(id, { revs_info: true }, function(err, doc) {
		if (!err) {
			console.log(doc);
			doc.name = name;
			doc.value = value;
			db.insert(doc, doc.id, function(err, doc) {
				if(err) {
					console.log('Error inserting data\n'+err);
					return 500;
				}
				return 200;
			});
		}
	});
});

app.get('/api/favorites', function(request, response) {

	console.log("Get method invoked.. ")
	
	db = cloudant.use(dbCredentials.dbName);
	var docList = [];
	var i = 0;
	db.list(function(err, body) {
		if (!err) {
			var len = body.rows.length;
			console.log('total # of docs -> '+len);
			if(len == 0) {
				//push sample data
				// save doc
				var docName = 'sample_doc';
				var docDesc = 'A sample Document';
				db.insert({
					name : docName,
					value : 'A sample Document'
				}, '', function(err, doc) {
					if(err) {
						console.log(err);
					} else {
						
						console.log('Document : '+JSON.stringify(doc));
						var responseData = createResponseData(
							doc.id,
							docName,
							docDesc,
							[]);
						docList.push(responseData);
						response.write(JSON.stringify(docList));
						console.log(JSON.stringify(docList));
						console.log('ending response...');
						response.end();
					}
				});
			} else {

				body.rows.forEach(function(document) {
					
					db.get(document.id, { revs_info: true }, function(err, doc) {
					if (!err)
						if(doc['_attachments']) {
							
							var attachments = [];
							for(var attribute in doc['_attachments']){
								
								if(doc['_attachments'][attribute] && doc['_attachments'][attribute]['content_type']) {
									attachments.push({"key": attribute, "type": doc['_attachments'][attribute]['content_type']});
								}
							    console.log(attribute+": "+JSON.stringify(doc['_attachments'][attribute]));
							}
							var responseData = createResponseData(
									doc._id,
									doc.name,
									doc.value,
									attachments);
							
						} else {
							var responseData = createResponseData(
									doc._id,
									doc.name,
									doc.value,
									[]);
						}
						
						docList.push(responseData);
						i++;
						if(i >= len) {
							response.write(JSON.stringify(docList));
							console.log('ending response...');
							response.end();
						}
					});
					
				});
			}
			
		} else {
			console.log(err);
		}
	});

});

//twilio
//Define a URL that will send a message, and display the message ID in the
//browser. View the numbers you own and can text from here:
//https://www.twilio.com/user/account/phone-numbers/incoming
/*app.get('/', function(request, response) {
 var client = new twilio.RestClient(twilioSid, twilioToken);

 client.sendMessage({
     to:'your cell phone',
     from:'a Twilio number you own',
     body:'go big blue!'
 }, function(err, message) {
     response.send('Message sent! ID: '+message.sid);
 });
});*/


http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
	
	
});

