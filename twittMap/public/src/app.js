var React = require('react');
var ReactDOM = require('react-dom');
var socket = io();
var config = require('./config');

// components
var TweetCounter = require('./components/TweetCounter');

// setting up mapbox
L.mapbox.accessToken = config.mapboxKey;
var map = L.mapbox.map('map', config.mapId).setView(config.initView, config.initZoom);

var geoJSON, count, pointsLayer;

// runs when a new tweet arrives
socket.on(config.channels.NEW, function(msg) {
    var tweet = msg['tweet'];
    count = count + 1;

    // append
    geoJSON.features.push(getGeoPoint(tweet));

    // remove layer and add it again
    map.removeLayer(pointsLayer);
    addPointstoMap();

    // render the counter
    ReactDOM.render(
        <TweetCounter count={count}/>, 
        document.getElementById("sidebar")
    );
});

// runs when the client initially connects
socket.on(config.channels.BULK, function(msg) {
    console.log("Connected to the server");
    var tweets = msg['tweets'];

    // set global count
    count = tweets.length;

    // render the counter
    ReactDOM.render(
        <TweetCounter count={count}/>, 
        document.getElementById("sidebar")
    );

    geoJSON = { 
        "type": "FeatureCollection", 
        "features": tweets.map(function(tweet) {
            return getGeoPoint(tweet);
        })
    }; 

    addPointstoMap();
});

function addPointstoMap() {
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
}


function getGeoPoint(tweet) {
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
        "properties": {
            "title": user + " says - ",
            "description": "<p>" + text + "</p><a href='" + url + "'>View Tweet</a>",
            "location": place
        }
    }
}
