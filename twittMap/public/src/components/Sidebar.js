var React = require('react');
var TweetCounter = require('./TweetCounter');
var NewTweet = require('./newTweet');

var Sidebar = React.createClass({
    propTypes: {
        map: React.PropTypes.object.isRequired,
        socket: React.PropTypes.object.isRequired
    },
    getInitialState: function() {
        return {
            tweets: [],
            geoJSON: {
                "type": "FeatureCollection",
                "features": []
            }
        }
    },
    componentDidMount:function() {
        var socket = this.props.socket;
        socket.on('TWEETS_BULK', this.handleBulkTweets);
        socket.on('TWEET_NEW', this.handleNewTweet);
        this.pointsLayer = null;
    },
    handleBulkTweets: function(msg) {
        console.log("Connected to the server");
        var tweets = msg["tweets"];
        var geoJSON = this.state.geoJSON;

        geoJSON["features"] = tweets.map(function(tweet) {
            return this.getGeoPoint(tweet);
        }.bind(this));

        this.setState({
            tweets: msg['tweets'],
            geoJSON: geoJSON
        });

        this.plotTweetsOnMap();
    },
    handleNewTweet: function(msg) {
        var tweet = msg["tweet"];
        var geoJSON = this.state.geoJSON;
        var geoTweet = this.getGeoPoint(tweet);

        geoJSON.features.push(geoTweet);
        this.setState({
            tweets: this.state.tweets.concat([tweet]),
            geoJSON: geoJSON,
            newTweet: geoTweet.properties
        });

        this.plotTweetsOnMap();
    },
    getGeoPoint: function(tweet) {
        var user = tweet.user.screen_name, 
            id = tweet.id_str, 
            text = tweet.text,
            place = (tweet.place && tweet.place.full_name) || null;

        var url = "http://twitter.com/" +  user + "/status/" + id;

        return {
            "type": "Feature", 
            "geometry": {
                "type": "Point",
                "coordinates": tweet.geo.coordinates.reverse()
            },
            "properties": { "user": user, "location": place }
        }
    },
    plotTweetsOnMap: function() {
        var map = this.props.map;
        var geoJSON = this.state.geoJSON;
        
        // remove layer
        if (this.pointsLayer != null) {
            map.removeLayer(this.pointsLayer);
        }

        // add it back
        this.pointsLayer = L.mapbox.featureLayer(geoJSON, {
            pointToLayer: function(feature, latlon) {
                return L.circleMarker(latlon,  {
                    fillColor: '#AA5042',
                    fillOpacity: 0.7,
                    radius: 3,
                    stroke: false
                });
            }
        }).addTo(map);
    },
    render: function() {
        var count = this.state.tweets.length;
        var lastTweet = this.state.geoJSON.features[count - 1] || {};
        var lastTweetStats = lastTweet.properties;
        return <div>
            <header> <h1>TwittMap</h1> </header>
            <div className="content">
              <TweetCounter count={count} />
              {count > 0 ? <NewTweet user={lastTweetStats.user} 
                  place={lastTweetStats.location} /> : null }
            </div>
          <footer>
              <p>Built by <a href="http://prakhar.me">Prakhar Srivastav</a></p>
          </footer>
        </div>
    }
});

module.exports = Sidebar;
