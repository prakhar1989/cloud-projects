var React = require('react');

var TweetCounter = React.createClass({
    propTypes: {
        count: React.PropTypes.number.isRequired
    },
    render: function() {
        return (<div className="counter">
            <p>Total tweets</p>
            <h1>{this.props.count} </h1>
        </div>)
    }
});

module.exports = TweetCounter;
