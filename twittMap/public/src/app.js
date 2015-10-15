L.mapbox.accessToken = 'pk.eyJ1IjoicHJha2hhciIsImEiOiJjaWZlbzQ1M2I3Nmt2cnhrbnlxcTQyN3VkIn0.uOaUAUqN2VS7dC7XKS0KkQ';
var React = require('react');
var ReactDOM = require('react-dom');
var socket = io();

var map = L.mapbox.map('map', 'prakhar.nkpoa3m1').setView([14.435, 2.285], 2);

var count = 0;
socket.on('tweets', function(msg) {
    console.log("Tweets recieved:", msg);
    var locations = msg['tweets'].map(function(tweet) {
        return tweet.geo.coordinates;
    });
    
    // set global count
    count = count + locations.length;

    ReactDOM.render(
        <TweetCounter count={count}/>, 
        document.getElementById("header")
    );
    L.heatLayer(locations, {maxZoom: 12}).addTo(map);
});

var TweetCounter = React.createClass({
    render: function() {
        return <div>Tweet count: {this.props.count} </div>
    }
});

