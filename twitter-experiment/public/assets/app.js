L.mapbox.accessToken = 'pk.eyJ1IjoicHJha2hhciIsImEiOiJjaWZlbzQ1M2I3Nmt2cnhrbnlxcTQyN3VkIn0.uOaUAUqN2VS7dC7XKS0KkQ';

var socket = io();
var map = L.mapbox.map('map', 'prakhar.nkpoa3m1');

socket.on('tweets', function(msg) {
    console.log("Tweets recieved:", msg);
    msg['tweets'].forEach(function(tweet) {
        L.marker(tweet.geo.coordinates).addTo(map);
    });
});
