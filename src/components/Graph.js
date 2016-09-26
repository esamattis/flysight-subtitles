
import get from "lodash/fp/get";
import React, {PropTypes} from "react";
import ReactDOM from "react-dom";
import Dygraph from "dygraphs";
import {connect} from "react-redux";

import {setGraphExit, getGpsData} from "../actions/flysight";
import Box from "./Box";

var Graph = React.createClass({

    propTypes: {
        gpsData: PropTypes.array.isRequired,
        graphPosition: PropTypes.number,
        setGraphExit: PropTypes.func.isRequired,
    },

    createGraph() {
        console.log("creating graph el");
        var el = ReactDOM.findDOMNode(this.refs.container);
        this.dygGraph = new Dygraph(el, this.props.gpsData, {
            clickCallback: (e, x, point) => {
                var syncPointIndex = get([0, "idx"], point);
                this.props.setGraphExit({graphPosition: x / 1000, syncPointIndex});
            },
            labels: [ "time", "altitude", "fallrate", "ground speed", "distance"],
            series: {
                fallrate: {
                    axis: "y2",
                },
                "ground speed": {
                    axis: "y2",
                },
            },
            // axes: {
            //     y2: {
            //         labelsKMB: true,
            //     },
            // },
            ylabel: "Altitude in meters",
            y2label: "Ground speed km/h",
            errorBars: true,
        });
        this.dygGraph.resize(window.innerWidth, 350);
        this.updateAnnotations();
    },

    componentDidMount() {
        this.createGraph();
    },

    resetZoom(e) {
        e.preventDefault();
        this.dygGraph.resetZoom();
    },

    updateAnnotations() {
        var annotations = [];

        if (this.props.graphPosition) {
            annotations.push({
                series: "altitude",
                x: this.props.graphPosition * 1000,
                width: 80,
                height: 15,
                tickHeight: 20,
                shortText: "Exit Point",
                text: "The moment you jumped out",
                cssClass: "Graph-exit-point",
            });
        }

        this.dygGraph.setAnnotations(annotations);
    },

    componentDidUpdate(prevProps) {
        if (this.props.gpsData !== prevProps.gpsData) {
            this.createGraph();
        }

        if (this.props.graphPosition !== prevProps.graphPosition) {
            this.updateAnnotations();
        }

    },

    render() {
        var hasData = this.props.gpsData.length > 0;
        return (
            <div className="Graph">
                <Box>
                    <h3>Pick exit point</h3>
                </Box>
                <div className="Graph-wrap" ref="container"></div>
                <Box>
                    <button onClick={this.resetZoom}>reset zoom</button>
                </Box>
            </div>
        );
    },
});
Graph = connect(
        state => ({
            gpsData: getGpsData(state),
            graphPosition: state.graphPosition,
        }),
        {setGraphExit}
)(Graph);


export default Graph;
