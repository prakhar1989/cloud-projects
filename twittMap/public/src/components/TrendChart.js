var React = require('react');
var Highstock = require('react-highcharts/dist/bundle/Highstock');

var TrendChart = React.createClass({
    render: function() {
        var data = this.props.data;
        var config = {
            chart: {
                height: 200
            },
            rangeSelector: { enabled: false },
            navigator: { enabled: false },
            series: [{
                name: 'Trends',
                data: data,
                color: '#AA5042',
                dataGrouping: {
                    approximation: 'sum',
                    units: [
                        ['minute', [1]]
                    ],
                    forced: true
                }
            }]
        };
        return <div>
            <h5>Trends for {"#" + this.props.keyword.toUpperCase()} </h5>
            <Highstock config={config} />
        </div>
    }
});

module.exports = TrendChart;
