
import get from "lodash/fp/get";
import React, {PropTypes} from "react";
import ReactDOM from "react-dom";
import Dygraph from "dygraphs";

import {addFlysightProps} from "../actions/flysight";

var Graph = React.createClass({

    propTypes: {
        gpsData: PropTypes.array.isRequired,
        graphPosition: PropTypes.number,
        setGraphExit: PropTypes.func.isRequired,
        setRawGPSData: PropTypes.func.isRequired,
    },

    handleFile(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = e => {
            this.props.setRawGPSData(e.target.result);
        };
        reader.readAsText(file);
    },


    createGraph() {
        console.log("creating graph el");
        var el = ReactDOM.findDOMNode(this.refs.container);
        this.dygGraph = new Dygraph(el, this.props.gpsData, {
            clickCallback: (e, x, point) => {
                var syncPointIndex = get([0, "idx"], point);
                this.props.setGraphExit({graphPosition: x / 1000, syncPointIndex});
            },
            labels: [ "time", "altitude", "fallrate", "ground speed"],
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
        this.dygGraph.resize(1000, 400);
        this.updateAnnotations();
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
        return (
            <div className="Graph" >
                <div className="Graph-wrap" ref="container">
                </div>
                <input type="file" accept=".csv" onChange={this.handleFile} />
                <button onClick={this.resetZoom}>reset zoom</button>
                <button onClick={this.props.generateSubrip}>generate</button>
            </div>
        );
    },
});
Graph = addFlysightProps()(Graph);


export default Graph;
