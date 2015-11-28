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
    getEmoticonImage() {
        var score = this.props.sentiment.score || 0;
        if (score > 0.6) {
            return "http://twemoji.maxcdn.com/36x36/1f601.png"
        } else if (score > 0.3) {
            return "http://twemoji.maxcdn.com/36x36/1f600.png"
        } else if (score > 0) {
            return "http://twemoji.maxcdn.com/36x36/1f603.png"
        } else if (score < -0.2) {
            return "http://twemoji.maxcdn.com/36x36/1f61e.png"
        }  else if (score < 0) {
            return "http://twemoji.maxcdn.com/36x36/1f614.png"
        } else {
            return "http://twemoji.maxcdn.com/36x36/1f615.png"
        }
        return url;
    },
    render() {
        var user = this.props.user;
        var place = this.props.place || "unknown" ;
        var sentiment = this.props.sentiment;
        var msg = this.getMsg(user, place);
        return <div className="newtweet">
            <div className="mood">
                <span>Tweet Mood</span>
                <img src={this.getEmoticonImage()} />
            </div>
            <p>{msg}</p>
        </div>
    }
});

module.exports = NewTweet;
