
import get from "lodash/fp/get";
import React, {PropTypes} from "react";
import ReactDOM from "react-dom";
import Dygraph from "dygraphs";

import {addFlysightProps} from "../actions";

var Graph = React.createClass({

    propTypes: {
        gpsData: PropTypes.array.isRequired,
        graphPosition: PropTypes.number,
        setGraphExit: PropTypes.func.isRequired,
        loadFlysightData: PropTypes.func.isRequired,
    },

    handleFile(e) {
        this.props.loadFlysightData(e.target.files[0]);
    },

    renderFileInput() {
        return <input type="file" accept=".csv" onChange={this.handleFile} />;
    },

    createGraph() {
        console.log("creating graph el");
        var el = ReactDOM.findDOMNode(this.refs.container);
        this.dygGraph = new Dygraph(el, this.props.gpsData, {
            clickCallback: (e, x, point) => {
                var syncPointIndex = get([0, "idx"], point);
                this.props.setGraphExit({graphPosition: x / 1000, syncPointIndex});
            },
            labels: [ "time", "altitude", "vert", "hor"],
            series: {
                vert: {
                    axis: "y2",
                },
                hor: {
                    axis: "y2",
                },
            },
            axes: {
                y2: {
                    labelsKMB: true,
                },
            },
            ylabel: "Primary y-axis",
            y2label: "Secondary y-axis",
            errorBars: true,
        });
        this.dygGraph.resize(1000, 600);
    },

    resetZoom(e) {
        e.preventDefault();
        this.dygGraph.resetZoom();
    },


    componentDidUpdate(prevProps) {
        if (this.props.gpsData !== prevProps.gpsData) {
            this.createGraph();
        }

        var annotations = [];

        if (this.props.graphPosition) {
            annotations.push({
                series: "altitude",
                x: this.props.graphPosition * 1000,
                width: 18,
                height: 23,
                tickHeight: 4,
                shortText: "exit",
                text: "Exit point",
                cssClass: "Graph-exit-point",
            });
        }


        // if (this.props.videoPosOnGraph) {
        //     annotations.push({
        //         series: 'vert',
        //         x: this.props.videoPosOnGraph * 1000,
        //         width: 18,
        //         height: 23,
        //         tickHeight: 4,
        //         shortText: "V",
        //         text: "Video position",
        //         cssClass: 'Graph-exit-point'
        //     });
        // }

        if (this.props.graphPosition !== prevProps.graphPosition) {
            this.dygGraph.setAnnotations(annotations);
        }


    },

    render() {
        if (this.props.gpsData.length === 0) return this.renderFileInput();
        return (
            <div className="Graph" >
                <div className="Graph-wrap" ref="container">
                </div>
                <button onClick={this.resetZoom}>reset zoom</button>
                <button onClick={this.props.generateSubrip}>generate</button>
            </div>
        );
    },
});
Graph = addFlysightProps()(Graph);


export default Graph;
