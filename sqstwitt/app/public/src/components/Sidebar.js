var React = require('react');
var TweetCounter = require('./TweetCounter');
var NewTweet = require('./NewTweet');
var KeywordFilter = require('./KeywordFilter');
var TrendColumnChart = require('./TrendColumnChart');
var TrendChart = require('./TrendChart');
var _ = require('lodash');

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
                "coordinates": coordinates
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

        var clusterLayer = new L.MarkerClusterGroup();

        tweets.forEach(function(tweet) {
            var coords = tweet.geo.coordinates;
            var user = tweet.user.screen_name;
            var url  = "http://twitter.com/" + user + "/status/" + tweet.id_str;
            var text = "<strong><p>"+ user + "</strong></p>" + tweet.text + " <a href='" + url + "' target=_blank>View tweet</a>";

            var marker = L.marker(new L.LatLng(coords[0], coords[1]), {
                icon: L.mapbox.marker.icon({
                    'marker-color': 'AA5042',
                    'marker-size': 'small'
                }),
                description: text
            });
            marker.bindPopup(text);
            clusterLayer.addLayer(marker);
        });

        this.pointsLayer = clusterLayer;
        map.addLayer(this.pointsLayer);
    },
    render() {
        var count = this.state.tweets.length;
        var latestTweet = this.state.tweets[count - 1] || {};
        var filteredTweets = this.state.filteredTweets;
        var dates = filteredTweets
                .map(t => [new Date(t.created_at).getTime(), 1])
                .sort((pt1, pt2) => pt1[0] - pt2[0]);
        var keyword = this.state.keyword;
        window.tweets = this.state.tweets;

        if (count === 0) {
            return <div>
                <header> <h1>TwittMap</h1> </header>
                <div className="content" style={{textAlign:'center'}}>
                    <img src="imgs/loader.gif" />
                    <h5>Assembling Tweets ...</h5>
                </div>
            </div>
        }

        return <div>
            <header> <h1>TwittMap</h1> </header>
            <div className="content">
              <TweetCounter count={count} filteredCount={filteredTweets.length}/>
              { count > 0 ? 
                  <NewTweet user={latestTweet.user.screen_name} 
                            place={latestTweet.place.full_name}
                            sentiment={latestTweet.sentiment} />: null}

              <h5>Filter Tweets</h5>
              <KeywordFilter selectedKeyword={this.state.keyword}
                  handleKeywordChange={this.handleKeywordChange}/>

              { filteredTweets.length > 0 ? <TrendChart data={dates} keyword={keyword}/> : null }
              <TrendColumnChart data={this.state.tweets} />
            </div>
          <footer>
              <p>Built by <a href="http://prakhar.me">Prakhar Srivastav</a></p>
          </footer>
        </div>
    }
});

module.exports = Sidebar;
