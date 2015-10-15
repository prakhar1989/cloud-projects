var React = require('react');
var ReactDOM = require('react-dom');
var socket = io();
var config = require('./config');

// components
var TweetCounter = require('./components/TweetCounter');

// setting up mapbox
L.mapbox.accessToken = config.mapboxKey;
var map = L.mapbox.map('map', config.mapId).setView(config.initView, config.initZoom);

window.geoJSON = {
    "type": "FeatureCollection",
    "features": []
};

var count, pointsLayer;

socket.on(config.channels.NEW, function(msg) {
    var tweet = msg['tweet'];
    count = count + 1;
    geoJSON.features.push(getGeoPoint(tweet));

    pointsLayer = L.mapbox.featureLayer(geoJSON, {
        pointToLayer: function(feature, latlon) {
            return L.circleMarker(latlon,  {
                fillColor: '#AA5042',
                fillOpacity: 0.7,
                radius: 5,
                stroke: false
            });
        }
    }).addTo(map);

    // render the counter
    ReactDOM.render(
        <TweetCounter count={count}/>, 
        document.getElementById("sidebar")
    );
});

socket.on(config.channels.BULK, function(msg) {
    console.log("connected to the server");
    console.log("Tweets recieved:", msg);
    var tweets = msg['tweets'];

    // setup locations
    var locations = tweets.map(function(tweet) {
        return tweet.geo.coordinates;
    });
    
    // set global count
    count = locations.length;

    // render the counter
    ReactDOM.render(
        <TweetCounter count={count}/>, 
        document.getElementById("sidebar")
    );

    geoJSON.features = tweets.map(function(tweet) {
        return getGeoPoint(tweet);
    });

    pointsLayer = L.mapbox.featureLayer(geoJSON, {
        pointToLayer: function(feature, latlon) {
            return L.circleMarker(latlon,  {
                fillColor: '#AA5042',
                fillOpacity: 0.7,
                radius: 5,
                stroke: false
            });
        }
    }).addTo(map);

});


function getGeoPoint(tweet) {
    var user = tweet.user.screen_name, 
        id = tweet.id_str, 
        place = (tweet.place && tweet.place.full_name) || null;

    return {
        "type": "Feature", 
        "geometry": {
            "type": "Point",
            "coordinates": tweet.geo.coordinates.reverse()
        },
        "properties": {
            "location": place,
            "url": "http://twitter.com/" + user + "/status/" + id
        }
    }
}
