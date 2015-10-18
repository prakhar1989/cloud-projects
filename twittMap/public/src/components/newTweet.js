var React = require('react');

var NewTweet = React.createClass({
    propTypes: {
        user: React.PropTypes.string.isRequired,
        place: React.PropTypes.string.isRequired
    },
    render: function() {
        var user = this.props.user;
        var place = this.props.place || "unknown" ;
        return <div className="newtweet">
            <p>{user} just tweeted from {place}</p>
        </div>
    }
});

module.exports = NewTweet;
