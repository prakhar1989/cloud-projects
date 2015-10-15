var r = require('rethinkdb');

var model      = {},
    connection = null;

model.setup = function() {
    r.connect({host: '127.0.0.1', port: 28015}, function(err, conn) {
        if (err) throw err;
        connection = conn;

        r.db('twitter_streaming').tableCreate('jstwitter')
         .run(connection, function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
        });
    });
};

model.getCount = function() {
    r.connect({host: '127.0.0.1', port: 28015}, function(err, conn) {
        if (err) throw err;
        connection = conn;

        r.db('twitter_streaming').table('jstwitter').count()
         .run(connection, function(err, result) {
            if (err) throw err;
            console.log(JSON.stringify(result, null, 2));
        });
    });
}

model.insertTweets = function(tweets) {
    r.connect({host: '127.0.0.1', port: 28015}, function(err, conn) {
        if (err) throw err;
        connection = conn;

        r.db('twitter_streaming').table('jstwitter').insert(tweets)
         .run(connection, function(err, result) {
            if (err) throw err;
            console.log("Total records written:", tweets.length);
        });
    });
}


model.testIt = function() {
    return 5 * 5;
}

module.exports = model;
