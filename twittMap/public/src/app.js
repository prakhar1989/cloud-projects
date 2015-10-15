L.mapbox.accessToken = 'pk.eyJ1IjoicHJha2hhciIsImEiOiJjaWZlbzQ1M2I3Nmt2cnhrbnlxcTQyN3VkIn0.uOaUAUqN2VS7dC7XKS0KkQ';
var React = require('react');
var ReactDOM = require('react-dom');
var socket = io();

var map = L.mapbox.map('map', 'prakhar.nkpoa3m1').setView([14.435, 2.285], 2);

window.geoJSON = {
    "type": "FeatureCollection",
    "features": []
};

var count = 0;
socket.on('tweets', function(msg) {
    console.log("Tweets recieved:", msg);
    var tweets = msg['tweets'];

    // setup locations
    var locations = tweets.map(function(tweet) {
        return tweet.geo.coordinates;
    });
    
    // set global count
    count = count + locations.length;

    // render the counter
    ReactDOM.render(
        <TweetCounter count={count}/>, 
        document.getElementById("sidebar")
    );

    // add to map
    //L.heatLayer(locations, {maxZoom: 12}).addTo(map);

    addToGeoJSON(tweets, window.geoJSON);

    var pointsLayer = L.mapbox.featureLayer(geoJSON, {
        pointToLayer: function(feature, latlon) {
            return L.circleMarker(latlon,  {
                fillColor: '#AA5042',
                fillOpacity: 0.7,
                radius: 5,
                stroke: false
            });
        }
    }).addTo(map);

    // setting the tooltip
    pointsLayer.on('click', function(e) {
        console.log(e.layer);
        e.layer.openPopup();
    });

});

var TweetCounter = React.createClass({
    render: function() {
        return <h1>{this.props.count} </h1>
    }
});


function getGeoPoint(tweet) {
    var user = tweet.user.screen_name, 
        id = tweet.id_str, 
        place = tweet.place.full_name;

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

var addToGeoJSON = function(tweets, geoJSON) {
    geoJSON.features = tweets.map(function(tweet) {
        return getGeoPoint(tweet);
    });
}
