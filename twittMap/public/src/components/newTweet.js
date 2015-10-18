var React = require('react');

var NewTweet = React.createClass({
    propTypes: {
        user: React.PropTypes.string.isRequired,
        place: React.PropTypes.string.isRequired
    },
    getMsg(user, location) {
        var templates = [
            `${user} from ${location} has something to share.`,
            `${user} just tweeted from ${location}`,
            `140 characters of wisdom from ${location}`,
            `New Tweet from ${location}!`,
            `${user} just clicked on the tweet button from ${location}`
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    },
    render() {
        var user = this.props.user;
        var place = this.props.place || "unknown" ;
        var msg = this.getMsg(user, place);
        return <div className="newtweet">
            <p>{msg}</p>
        </div>
    }
});

module.exports = NewTweet;
