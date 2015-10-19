module.exports = {
    rethinkdb: {
        host: '172.31.59.233',
        port: 28015,
        db: 'twitter_streaming',
        table: 'jstwitter',
    },
    rethinkdb_dev: {
        host: '127.0.0.1',
        port: 28015,
        db: 'twitter_streaming',
        table: 'jstwitter',
    },
    express: {
        port: 3000
    },
    channels: {
        BULK: 'TWEETS_BULK',
        NEW: 'TWEET_NEW',
    }
}
