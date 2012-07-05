/**
 * Mash multiple business apis returned data.
 * Stock Symble lookup: Using YAHOO API. JSONP
 * Stock Info lookup: Using WebServiceX API . SOAP
 *
 */
var stock = {
  //YAHOO finance api for looking up stock symbol with a company name. It is a JSONP service.
	yahooApi : "http://d.yimg.com/autoc.finance.yahoo.com/autoc?query={0}&callback=YAHOO.Finance.SymbolSuggest.ssCallback",
	//WebServiceX API (Open API). It returns stock details with specific stock symbol.
	webServiceXApi : "http://www.webservicex.net/stockquote.asmx",
	/**
	 * The function will look for stock symbol based on "name" param, and return stock info from WebServiceX
	 *
	 * Return stock information.
	 */
	getStockInfo : function(name, callback) {
		//Compose request url using user input.
		var yahooApiUrl = stock.yahooApi.replace("{0}", name);
		/*
		 * Perform Webcall
		 * Raw response from YAHOO JSONP api which contains stock symbol as well as other information we do not want.
		 *
		 */
		$fh.web({
			url : yahooApiUrl,
			method : "GET",
			charset : "UTF-8",
			period : 3600
		}, function(err, symbolRes) {
      if( err ) {
        callback(err, null);
      }
      else {
        //Clear up YAHOO response and only keep the information "stock symbol" we need.
        var stockSymbol = stock.processSymbolRes(symbolRes);
        
        // construct SOAP envelop. We could do this manually or just use a Javascript Library.
        var soapEnvolope = '<?xml version="1.0" encoding="utf-8"?>' + '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' + '<soap:Body>' + '<GetQuote xmlns="http://www.webserviceX.NET/">' + '<symbol>' + stockSymbol + '</symbol>' + '</GetQuote>' + '</soap:Body>' + '</soap:Envelope>';
        
        //Retrieve SOAP url
        var stockInfoUrl = stock.webServiceXApi;
        
        //Prepare webcall parameters
        var opt = {
        	url : stockInfoUrl,
        	method : "POST",
        	charset : "UTF-8",
        	contentType : "text/xml",
        	body : soapEnvolope,
        	period : 3600
        }
        
        //Perform webcall
        $fh.web(opt, function(err, res) {
          if( err ) {
            callback(err, null);
          }
          else {
            console.log('stockInfo : ' , res.body);
          	var xml2js=require ("xml2js");
          	//getSOAPElement will retrieve specific XML object within SOAP response
          	(new xml2js.Parser()).parseString(res.body, function(err, jsres) {
          		var quoteRes=jsres["soap:Body"]["GetQuoteResponse"]["GetQuoteResult"];
          		//mash up the data and return to client.
              (new xml2js.Parser()).parseString(quoteRes, function(err, quotejsres) {
                console.log('quotejsres : ', quotejsres);
                var stock = quotejsres["Stock"];
              
            		callback(err, {
            			stockSymbol : stockSymbol,
            			stockInfo : stock
            		});
              });
          	});
          }
        });
      }
		});
	},
	/**
	 * Process Response from YAHOO stock symbol api.
	 * It will clear up the response and only return stock symbol as string.
	 */
	processSymbolRes : function(res) {
    var resBody = res.body;    
		var removedHeadRes = resBody.replace("YAHOO.Finance.SymbolSuggest.ssCallback(", "");
		//remove jsonp callback header
		var removedTailRes = removedHeadRes.substr(0, removedHeadRes.length - 1);
		//remove jsonp callback bracket
		var resObj = $fh.parse(removedTailRes);
		//parse result to JSON object
		return resObj.ResultSet.Result[0].symbol;
		//return the first matched stock symbol
	}
};

exports.getStockInfo = stock.getStockInfo;
