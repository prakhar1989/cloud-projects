// Schema - https://dpaste.de/Q0VS
var Twitter = require('twitter');
var model = require('./model');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();

var client = new Twitter({
  consumer_key: "bcUhD7E8LoXcqLlc3EKhQmN6Y",
  consumer_secret: "ZUlP6eZjVu1k2QI9umLkkit6PWj90mdeMrrp5ngIKeOoXTQrgx",
  access_token_key: "1412174058-5vuJzQk4MDm33QYXYpVLprCrsLNHyvTKc0kdpVP",
  access_token_secret:  "1UhH4UYGXMLl6VFeJl5hzTJf1Y29OTWo7TGCcBaMvUTLZ"
});

var ENDPOINT = "statuses/filter";
var KEYWORDS = ["music","cricket", "sports", "technology", "beiber", "google", "facebook", "amazon"];

function startStreaming() {
    var query = KEYWORDS.join(",");

    client.stream(ENDPOINT, {track: query}, function(stream){
        var tweets = [], count = 0;
        stream.on('data', function(tweet) {
            if (tweet.geo != null) {
                tweet['keywords'] = classify(tweet);
                model.insertTweet(tweet);
            }
        });

        stream.on('error', function(error) {
            throw error;
        });
    });
}

function classify(tweet) {
    var text = tokenizer.tokenize(tweet.text).map(function(w) {
        return w.toLowerCase();
    });
    var classification = {};

    KEYWORDS.filter(function(keyword) {
        return text.indexOf(keyword) > -1
    }).forEach(function(key) {
        classification[key] = true
    });

    return classification;
}

function getTrends(woeid) {
    client.get("trends/place", {id: woeid}, function(error, tweets, response){
        if(error) throw error;
        console.log(JSON.stringify(tweets, null, 2));
    });
}

startStreaming();
