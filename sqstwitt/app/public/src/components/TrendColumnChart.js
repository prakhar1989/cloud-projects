var React = require('react');

var Highcharts = require('react-highcharts/dist/bundle/Highstock');
var _ = require('lodash');
window._ = _;

var TrendColumnChart = React.createClass({
    getDrillDownSeries(item, tweets) {
        var data = _.chain(tweets)
                .filter(t => t.sentiment.type === item)
                .map(t => t.place && t.place.country)
                .countBy(t => t)
                .pairs()
                .value();
        return { name: item, id: item, data: data }
    },
    render: function() {
        var data = _.chain(this.props.data)
                 .map((x) => x.sentiment.type)
                 .countBy((x) => x)
                 .pairs()
                 .map((x) => {
                     return {name: x[0], y: x[1], drilldown: x[0]}
                 })
                 .value()

        var series = _.map(["positive", "neutral", "negative"], (x) => this.getDrillDownSeries(x, this.props.data));
        var config = {
            chart: { 
                type: "column", 
                height: 200
            },
            rangeSelector: { enabled: false },
            navigator: { enabled: false },
            legend: { enabled: false },
            scrollbar: { 
                enabled: false 
            },
            xAxis: {
                labels: {
                    enabled: false
                }
            },
            series: [{
                name: 'Sentiment',
                colorByPoint: true,
                data: data
            }],
            drilldown: {
                series: series
            }
        };
        return <div>
            <h5>Sentiment Trend</h5>
            <Highcharts config={config} />
        </div>
    }
});

module.exports = TrendColumnChart;
