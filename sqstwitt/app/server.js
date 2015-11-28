var r = require('rethinkdb');
var express = require('express');

var bodyParser = require('body-parser');
var app = express();
var SNSClient = require('aws-snsclient');

var http = require('http').Server(app);
var io = require('socket.io')(http);

// read in the config
var config = require(__dirname + '/config.js');

// setup static content
app.use(express.static(__dirname + "/public"));

// parse application/json
app.use(bodyParser.json());


// init db config
config["rethinkdb"] = process.env.NODE_ENV == 'development' ? 
                    config.rethinkdb_dev : config.rethinkdb;
                
// middleware that gets the connection to the db
// and makes it available to the request object
function createConnection(req, res, next) {
    r.connect(config.rethinkdb).then(function(conn) {
        req._rdbConn = conn;
        next();
    }).error(handleError(res));
}

// middleware that closes the connection
function closeConnection(req, res, next) {
    req._rdbConn.close();
}

// handle 500 gracefully
function handleError(res) {
    return function(error) {
        res.send(500, {error: error.message});
    }
}

app.use(createConnection);

app.route('/tweets').get(getTweets);
app.route('/notify').post(handleNotification);

app.use(closeConnection);

var queryStructure = {
    'id_str': true,
    'geo': true,
    'place': { 'full_name': true },
    'user': { 'screen_name': true },
    'text': true,
    'sentiment': true,
    'keywords': true,
    'created_at': true
};

var socketObj;

// routes
function getTweets(req, res, next) {
    r.table(config.rethinkdb.table).pluck(queryStructure)
        .run(req._rdbConn).then(function(cursor) {
            return cursor.toArray();
        }).then(function(result) {
            res.send(JSON.stringify(result));
        }).error(handleError(res))
        .finally(next);
}

// handle message here
var sns = SNSClient(function(err, msg) {
    if (msg.Type !== "Notification") {
        return;
    }
    var tweet = JSON.parse(msg.Message);
    //console.log("http://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str, JSON.stringify(tweet.sentiment, null, 2));
    socketObj.emit(config.channels.NEW, {tweet: tweet});

});

function handleNotification(req, res, next) {
    return sns(req, res);
}

function getKeywords() {
    return r.connect({host: config.rethinkdb.host, port: config.rethinkdb.port}, function(err, conn) {
        if (err) throw err;
        var connection = conn;
        return r.db(config.rethinkdb.db).table(config.rethinkdb.table)
            .pluck(['keywords']).distinct()
            .run(connection).then(function(cursor) {
                return cursor.toArray();
            }).then(function(results) {
                var keys = results.map(function(r) {
                    return Object.keys(r["keywords"])
                }).reduce(function(arr, key) {
                    return arr.concat(key)
                });
                var distinctKeywords = [];
                for (var i in keys) {
                    var key = keys[i];
                    if (distinctKeywords.indexOf(key) == -1) {
                        distinctKeywords.push(key)
                    }
                }
                return distinctKeywords
            }).error(function(err) {
                throw err
            });
    });
}

/*
 * This function is not being used now since all our updates are being
 * sent by the SNS service
function startListening(socket, channel) {
    r.connect({host: config.rethinkdb.host, port: config.rethinkdb.port}, function(err, conn) {
        if (err) throw err;

        // batching
        var connection = conn;

        r.db(config.rethinkdb.db).table(config.rethinkdb.table)
            .pluck(queryStructure).changes()
            .run(connection, function(err, cursor) {
                if (err) throw err;
                cursor.each(function(err, row) {
                    if (err) throw err;
                    socket.emit(channel, {tweet: row.new_val});
                    console.log('Sending new tweet');
                });
            });
    });
}
*/

function sendLatestData(socket, channel) {
    r.connect({host: config.rethinkdb.host, port: config.rethinkdb.port}, function(err, conn) {
        if (err) throw err;
        var connection = conn;
        r.db(config.rethinkdb.db).table(config.rethinkdb.table)
            .pluck(queryStructure)
            .run(connection).then(function(cursor) {
                return cursor.toArray();
            }).then(function(result) {
                socket.emit(channel, {tweets: result});
                console.log("Sending off tweets:", result.length);
            }).error(function(err) {
                throw err
            });
    });
}

io.on('connection', function(socket) {
    socketObj = socket;
    console.log("new user connected");
    sendLatestData(socket, config.channels.BULK);
    //startListening(socket, config.channels.NEW);
});

// start listening
http.listen(process.env.PORT || config.express.port, function() {
    console.log('listening on 3000');
});
