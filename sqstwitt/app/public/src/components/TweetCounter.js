var React = require('react');

var TweetCounter = React.createClass({
    propTypes: {
        count: React.PropTypes.number.isRequired,
        filteredCount: React.PropTypes.number
    },
    getDefaultProps: function() {
        return {
            filteredCount: 0
        }
    },
    render: function() {
        return (<div className="counter">
            <p>Total tweets</p>
            <h1>
                {this.props.filteredCount > 0 ?
                    <span className="highlight"> {this.props.filteredCount} / </span> : null
                }
                {this.props.count} 
            </h1>
        </div>)
    }
});

module.exports = TweetCounter;
