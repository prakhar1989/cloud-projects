var React = require('react');
var Select = require('react-select');

var KeywordFilter = React.createClass({
    propTypes: {
        handleKeywordChange: React.PropTypes.func.isRequired
    },
    getDefaultProps: function() {
        return {
            selectedKeyword: null,
            keywords: ["amazon", "google", "sports", "cricket", "trump",
                       "love", "facebook", "music", "technology"]
        }
    },
    handleChange(val) {
        this.props.handleKeywordChange(val);
    },
    render() {
        var options = this.props.keywords.map(function(key) {
            return {value: key, label: key.toUpperCase()}
        });
        var selectedKeyword = this.props.selectedKeyword;
        return <Select name="form-field-name"
                options={options}
                value={selectedKeyword}
                onChange={this.handleChange}/>
    }
});

module.exports = KeywordFilter;
