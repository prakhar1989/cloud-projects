var React = require('react');

var TweetCounter = React.createClass({
    render: function() {
        return (<div>
            <p>Tweet count</p>
            <h1>{this.props.count} </h1>
        </div>)
    }
});

module.exports = TweetCounter;
