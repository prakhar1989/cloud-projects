var React = require('react');
var TweetCounter = require('./TweetCounter');
var NewTweet = require('./NewTweet');
var KeywordFilter = require('./KeywordFilter');
var TrendChart = require('./TrendChart');

var Sidebar = React.createClass({
    propTypes: {
        map: React.PropTypes.object.isRequired,
        socket: React.PropTypes.object.isRequired
    },
    getInitialState: function() {
        return {
            tweets: [],
            keyword: null,
            filteredTweets: []
        }
    },
    componentDidMount:function() {
        var socket = this.props.socket;
        socket.on('TWEETS_BULK', this.handleBulkTweets);
        socket.on('TWEET_NEW', this.handleNewTweet);
        this.pointsLayer = null;
    },
    handleKeywordChange: function(keyword) {
        var tweets;
        if (keyword == "") {
            tweets = [];
        } else {
            tweets = this.state.tweets.filter(function(tweet) {
                if (tweet.keywords[keyword]) {
                    return true;
                }
                return false;
            });
        }
        this.setState({
            filteredTweets: tweets,
            keyword: keyword
        });
    },
    handleBulkTweets: function(msg) {
        console.log("Connected to the server");
        this.setState({
            tweets: msg['tweets'],
        });
    },
    handleNewTweet: function(msg) {
        var tweet = msg["tweet"];
        var tweets = this.state.tweets;
        tweets.push(tweet);
        this.setState({
            tweets: tweets
        });
    },
    componentDidUpdate: function() {
        this.plotTweetsOnMap();
        return true;
    },
    getGeoPoint: function(tweet) {
        var coordinates = Array.prototype.slice.call(tweet.geo.coordinates);
        var place = "";
        if (tweet.place != undefined && tweet.place.full_name != undefined) {
            place = tweet.place.full_name
        }
        return {
            "type": "Feature", 
            "geometry": {
                "type": "Point",
                "coordinates": coordinates.reverse()
            },
            "properties": { 
                "user": tweet.user.screen_name,
                "location": place
            }
        }
    },
    plotTweetsOnMap: function() {
        var map = this.props.map;
        var tweets = this.state.filteredTweets.length > 0 ? 
                        this.state.filteredTweets : 
                        this.state.tweets;

        // remove layer
        if (this.pointsLayer != null) {
            map.removeLayer(this.pointsLayer);
        }

        // build geoJSON
        var geoJSON = { "type": "FeatureCollection", "features": [] };
        geoJSON["features"] = tweets.map(function(tweet) {
            return this.getGeoPoint(tweet);
        }.bind(this));
        
        // add geoJSON to layer
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
    render() {
        var count = this.state.tweets.length;
        var latestTweet = this.state.tweets[count - 1] || {};
        var filteredTweets = this.state.filteredTweets;
        var dates = filteredTweets
                .map(t => [new Date(t.created_at).getTime(), 1])
                .sort((pt1, pt2) => pt1[0] - pt2[0]);
        var keyword = this.state.keyword;

        return <div>
            <header> <h1>TwittMap</h1> </header>
            <div className="content">
              <TweetCounter count={count} filteredCount={filteredTweets.length}/>
              { count > 0 ? 
                  <NewTweet user={latestTweet.user.screen_name} 
                            place={latestTweet.place.full_name} />: null}

              <h5>Filter Tweets</h5>
              <KeywordFilter selectedKeyword={this.state.keyword}
                  handleKeywordChange={this.handleKeywordChange}/>

              { filteredTweets.length > 0 ? <TrendChart data={dates} keyword={keyword}/> : null }
            </div>
          <footer>
              <p>Built by <a href="http://prakhar.me">Prakhar Srivastav</a></p>
          </footer>
        </div>
    }
});

module.exports = Sidebar;
