// Schema - https://dpaste.de/Q0VS
var Twitter = require('twitter');
var model = require('./model');

var client = new Twitter({
  consumer_key: "bcUhD7E8LoXcqLlc3EKhQmN6Y",
  consumer_secret: "ZUlP6eZjVu1k2QI9umLkkit6PWj90mdeMrrp5ngIKeOoXTQrgx",
  access_token_key: "1412174058-5vuJzQk4MDm33QYXYpVLprCrsLNHyvTKc0kdpVP",
  access_token_secret:  "1UhH4UYGXMLl6VFeJl5hzTJf1Y29OTWo7TGCcBaMvUTLZ"
});

function persistTweet(tweets) {
    model.insertTweets(tweets);
    //console.log(tweets);
    //console.log("http://twitter.com/" + tweet['user']['screen_name'] + "/status/" + tweet.id_str);
}

client.stream('statuses/sample', function(stream) {
    var tweets = [], count = 0;
    stream.on('data', function(tweet) {
        if (tweet.geo != null) {
            tweets.push(tweet);
            count += 1;
            console.log("Adding tweet");
        }
        if (count > 5) { // Batch it in groups of 5
            persistTweet(tweets);
            tweets = [];
            count = 0;
        }
    });

    stream.on('error', function(error) {
        throw error;
    });
});
