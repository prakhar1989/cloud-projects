var AWS = require('aws-sdk');
var merge = require('merge');
var _und = require('lodash');

AWS.config.region = 'us-east-1';

var sqs = new AWS.SQS();

var Queue = { QueueName: 'testQueue' };

function sendMessage(message) {
  sqs.sendMessage(message, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
        console.log(data);
        return data["MessageId"];
    }
  });
}

/* delete the message 
 * in the callback, process the message
 */
function processMsg(msg) {
    console.log("here", msg);
    console.log(JSON.parse(msg.Body));
}

/*
 * The main queue function
 */
sqs.createQueue(Queue, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else {
      Queue = merge(Queue, data);
      /*
      var message = {
          MessageBody: JSON.stringify({bar: 'baz'}),
          QueueUrl: Queue.QueueUrl,
          DelaySeconds: 0
      };
      */
      var params = {
          QueueUrl: Queue.QueueUrl
      };
      sqs.receiveMessage(params, function(err, data) {
          if (err) console.log(err, err.stack);
          else {
              if (data) {
                  _und.each(data.Messages, function(msg) {
                      processMsg(msg);
                  });
              }
          }
      });
  }
});

