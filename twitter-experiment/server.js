var r = require('rethinkdb');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// read in the config
var config = require(__dirname + '/config.js');

// setup static content
app.use(express.static(__dirname + "/public"));
app.use(bodyParser());


/*
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log("a user command");
    socket.broadcast.emit('hi');

    socket.on('disconnect', function() {
        console.log('user disconnected');
    });

    socket.on('chat message', function(msg) {
        io.emit('chat message', "Prakhar: " +  msg);
    });
});

http.listen(3000, function() {
    console.log('listening on 3000');
});

/*
r.connect({host: '127.0.0.1', port: 28015}, function(err, conn) {
    if (err) throw err;
    var connection = conn;

    r.db('twitter_streaming').table('jstwitter').pluck(['id_str', 'geo'])
        .run(connection, function(err, cursor) {
            cursor.toArray(function(err, result) {
                if (err) throw err;
                console.log(JSON.stringify(result, null, 2));
            });
    });
    r.db('twitter_streaming').table('jstwitter').changes()
        .run(connection, function(err, cursor) {
            if (err) throw err;
            cursor.each(function(err, row) {
                if (err) throw err;
                console.log(JSON.stringify(row, null, 2));
            });
        })
});
*/

