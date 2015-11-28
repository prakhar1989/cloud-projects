// Schema - https://dpaste.de/Q0VS
var Twitter = require('twitter');
var model = require('./model');
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();
var AWS = require('aws-sdk');
var merge = require('merge');


// AWS configuration stuff
AWS.config.region = 'us-east-1';
var sqs = new AWS.SQS();
var Queue = { QueueName: 'tweetsQueue' };

var client = new Twitter({
  consumer_key: "bcUhD7E8LoXcqLlc3EKhQmN6Y",
  consumer_secret: "ZUlP6eZjVu1k2QI9umLkkit6PWj90mdeMrrp5ngIKeOoXTQrgx",
  access_token_key: "1412174058-5vuJzQk4MDm33QYXYpVLprCrsLNHyvTKc0kdpVP",
  access_token_secret:  "1UhH4UYGXMLl6VFeJl5hzTJf1Y29OTWo7TGCcBaMvUTLZ"
});

var ENDPOINT = "statuses/filter";
var KEYWORDS = ["depressed","fun", "happy", "shit", "fuck", "bad", "awesome","party"];


function startStreaming() {
    var query = KEYWORDS.join(",");

    client.stream(ENDPOINT, {track: query, lang: "en"}, function(stream){
        var tweets = [], count = 0;
        stream.on('data', function(tweet) {
            if (tweet.geo != null) {
                console.log(tweet.text);
                tweet['keywords'] = classify(tweet);
                // save tweet in database
                //model.insertTweet(tweet);

                var message = {
                    MessageBody: JSON.stringify(tweet),
                    QueueUrl: Queue.QueueUrl,
                    DelaySeconds: 0
                };
                // send tweet to the queue
                sendMessageToQueue(message);
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

// sends the message off the to the queue
function sendMessageToQueue(message) {
  sqs.sendMessage(message, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
        console.log("Message sent to queue", data["MessageId"]);
    }
  });
}


function main() {
    // Creates the queue and starts streaming
    sqs.createQueue(Queue, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else {
          Queue = merge(Queue, data);
          startStreaming()
      }
    });
}

// start the streaming
main();

