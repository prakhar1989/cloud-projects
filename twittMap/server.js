var r = require('rethinkdb');
var express = require('express');

var bodyParser = require('body-parser');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

// read in the config
var config = require(__dirname + '/config.js');

// setup static content
app.use(express.static(__dirname + "/public"));

// parse application/json
app.use(bodyParser.json());

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

app.use(closeConnection);

var queryStructure = {
    'id_str': true,
    'geo': true,
    'place': {
        'full_name': true
    },
    'user': {
        'screen_name': true
    }
};

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
                    socket.emit(channel, {tweets: row.new_val});
                    console.log('Sending new tweet');
                });
            });
    });
}

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
    console.log("a user connected");
    sendLatestData(socket, 'tweets');
    startListening(socket, 'tweets');
});

// start listening
http.listen(config.express.port, function() {
    console.log('listening on 3000');
});
