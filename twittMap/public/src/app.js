var React = require('react');
var ReactDOM = require('react-dom');
var config = require('./config');
var socket = io.connect();
var Sidebar = require('./components/Sidebar');

// setting up mapbox
L.mapbox.accessToken = config.mapboxKey;
var map = L.mapbox.map('map', config.mapId).setView(config.initView, config.initZoom);

ReactDOM.render(
    <Sidebar socket={socket} map={map} />, 
    document.getElementById('sidebar')
);
