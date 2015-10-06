var r = require('rethinkdb');

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

console.log("hello world");
