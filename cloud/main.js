/*
 * Stocks
 */
var stock=require("./stock.js");

function getStockInfo(param, callback) {
  return stock.getStockInfo(param.name, callback);
}

/*
 * Payment
 */ 
function payment(params,callback) {
  var cardType   = params.cardType;
  var cardNumber = params.cardNumber;
  var url = "http://www.webservicex.net/CreditCard.asmx/ValidateCardNumber?cardType=" + cardType + "&cardNumber=" + cardNumber;

  $fh.web({
    url: url,
    method: 'GET'
  },function(err,res){
    callback(err,res);
  });
}

/*
 * Twitter
 */
function getTweets(params,callback) {
  var username   = 'DellintheClouds';
  var num_tweets = 10;
  var url        = 'http://search.twitter.com/search.json?q=' + username;

  var response = $fh.web({
    url: url,
    method: 'GET',
    allowSelfSignedCert: true
  },function(err,response){
    var rtn={'data': $fh.parse(response.body).results};
    callback(err,rtn);
  });
}

/*
 * Maps
 */
// Cache points for 30 seconds
var CACHE_TIME = 30;
var MARKERS = {
  locations: [
    {
      lat: '36.12242',
      lon: '-115.16975'
    },
    {
      lat: '36.12442',
      lon: '-115.17175'
    }
  ]
};

function getMarkers(params) {
  // Default to markers around Las Vegas
  var res = MARKERS;
  if( params.lat && params.lon ) {
    res = {};
    res.locations = [];
    var markerLat1 = params.lat - 0.002;
    var markerLon1 = params.lon - 0.002;
    res.locations.push({'lat' : markerLat1, 'lon': markerLon1});
    
    var markerLat2 = params.lat + 0.002;
    var markerLon2 = params.lon + 0.002;
    res.locations.push({'lat' : markerLat2, 'lon': markerLon2});
  }
  
  return res;
}

function getCachedPoints(params,callback) {
  $fh.cache({
    "act": "load",
    "key": "points"
  },function(err,res){
    callback(err,res);
  });
  
}

function cachePoints(hash, data) {
  var obj = {
    "hash": hash,
    "data": data,
    "cached": true
  };
  $fh.cache({
    "act": "save",
    "key": "points",
    "value": JSON.stringify(obj),
    "expire": CACHE_TIME
  }, function(err, res) {
    console.log('cachePoints :: err = ', err, ' :: res = ', res);
  });
}

function getPoints(params,callback) {
  
  var response = {};
  getCachedPoints({}, function(err, res) {
    console.log('getCachedPoints :: err = ', err, ' :: res = ', res);
    if( res ) {
      console.log('getPoints - cached response = ', res);
      // Parse the cached data
      var cache = JSON.parse(res);

      if( params.hash && params.hash === cache.hash ) {
        console.log('Hash check matches - Client data is up to date');
        response = {'hash':params.hash, 'cached':true};
      } else {
        // Hash value from client missing or incorrect, return cached cloud data
        response = cache;
      }      
    }
    else {
      var data = getMarkers(params);
      var crypto=require("crypto");
      var md5=crypto.createHash("md5");
      var hash=md5.update(JSON.stringify(data)).digest("hex");
      // Cache the data
      cachePoints(hash, data);
  
      // Build the response
      response = {'data': data, 'hash':hash, 'cached':false};
    } 
    callback(null, response);
  });
}

module.exports={
  getStockInfo:getStockInfo,
  payment:payment,
  getTweets:getTweets,
  getCachedPoints:getCachedPoints,
  getPoints:getPoints
};