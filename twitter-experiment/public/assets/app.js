L.mapbox.accessToken = 'pk.eyJ1IjoicHJha2hhciIsImEiOiJjaWZlbzQ1M2I3Nmt2cnhrbnlxcTQyN3VkIn0.uOaUAUqN2VS7dC7XKS0KkQ';

var socket = io();
var map = L.mapbox.map('map', 'prakhar.nkpoa3m1').setView([14.435, 2.285], 2);

socket.on('tweets', function(msg) {
    console.log("Tweets recieved:", msg);
    var locations = msg['tweets'].map(function(tweet) {
        return tweet.geo.coordinates;
    });
    L.heatLayer(locations, {maxZoom: 18}).addTo(map);
});
