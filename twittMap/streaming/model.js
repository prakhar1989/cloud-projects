var r = require('rethinkdb');

var model      = {},
    connection = null;

function runQuery(query) {
    r.connect({host: '127.0.0.1', port: 28015}, function(err, conn) {
        if (err) throw err;
        connection = conn;
        query();
    });
}

model.setup = function() {
    runQuery(function() {
        r.db('twitter_streaming').tableCreate('jstwitter')
         .run(connection, function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
        });
    });
};

model.getCount = function() {
    runQuery(function() {
        r.db('twitter_streaming').table('jstwitter').count()
         .run(connection, function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
        });
    });
}

model.insertTweet = function(tweet) {
    runQuery(function() {
        r.db('twitter_streaming').table('jstwitter').insert(tweet)
         .run(connection, function(err, result) {
            if (err) throw err;
            console.log(result);
        });
    });
}

module.exports = model;
