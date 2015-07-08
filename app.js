(function(){
  "use strict";
}());

var express  = require('express'),
  app = express(), bodyParser = require('body-parser');

//main app
  app.use(express.static(__dirname));
  app.use(bodyParser.json()); // for parsing application/json
  app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//Get Listings
  app.post('/api/getListings', function(req, res) {

    var request = require('request'),
      url = "http://api.placester.com/api/v2.1/listings.json?api_key=3eb444f8869cb88bbc349586573aabbb84a316d7&offset="+req.body.offset;
      console.log("Making a request to " + url);

    request(url, function (error, response, body) {

      if (!error && response.statusCode == 200) {

        res.send(body); //got a good status code and no errors. Lets send back the json value

      }
      else {

        console.log("Unable to connect to placester. " + error); //log error to the console
        res.send({"error" : "Unable to connect to placester."}); //Send generic error message for display
        console.log("fa");
      }
    });

  });

// application
  app.get('*', function(req, res) {

    console.log(__dirname);
    res.sendFile('index.html', { root: __dirname });

  });

// listen (start app with node server.js)
  app.listen(8080, function(err){

    if(err)
      throw err;

    console.log("App listening on port 8080. http://localhost:8080");

  });
