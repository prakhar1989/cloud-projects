// Schema - https://dpaste.de/Q0VS
var Twitter = require('twitter');
var model = require('./model');

var client = new Twitter({
  consumer_key: "bcUhD7E8LoXcqLlc3EKhQmN6Y",
  consumer_secret: "ZUlP6eZjVu1k2QI9umLkkit6PWj90mdeMrrp5ngIKeOoXTQrgx",
  access_token_key: "1412174058-5vuJzQk4MDm33QYXYpVLprCrsLNHyvTKc0kdpVP",
  access_token_secret:  "1UhH4UYGXMLl6VFeJl5hzTJf1Y29OTWo7TGCcBaMvUTLZ"
});

client.stream('statuses/sample', function(stream) {
    var tweets = [], count = 0;
    stream.on('data', function(tweet) {
        if (tweet.geo != null) {
            model.insertTweet(tweet);
        }
    });

    stream.on('error', function(error) {
        throw error;
    });
});
