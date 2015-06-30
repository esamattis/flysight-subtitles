
import React, {PropTypes} from "react";
import Dygraph from "dygraphs";
import connectToStores from 'fluxible/addons/connectToStores';
import debug from "debug";


import DataStore from "../stores/DataStore";
import parseCSV from "../actions/parseCSV";
import {setGraphExit} from "../actions/GraphActions";

var debugGraph = debug("Graph");

class Graph extends React.Component {

    handleFile(e) {
        this.context.executeAction(parseCSV, {file: e.target.files[0]});
    }

    renderFileInput() {
        return <input type="file" accept=".csv" onChange={this.handleFile.bind(this)} />;
    }

    createGraph() {
        console.log("creating graph el");
        var el = React.findDOMNode(this.refs.container);
        this.dygGraph = new Dygraph(el, this.props.data, {
            clickCallback: (e, x, pts) => {
                this.context.executeAction(setGraphExit, x / 1000);
            },
            underlayCallback: this.drawPlayerLine.bind(this),
            labels: [ "time", "altitude", "vert", "hor"],
             series: {
                 vert: {
                     axis: "y2"
                 },
                 hor: {
                     axis: "y2"
                 }
            },
            axes: {
                y2: {
                    labelsKMB: true
                }
            },
            ylabel: 'Primary y-axis',
            y2label: 'Secondary y-axis',
            errorBars: true
        });
    }

    drawPlayerLine(ctx, area, graph) {
        ctx.beginPath();
        var coord = graph.toDomXCoord(this.props.videoPosOnGraph * 1000);
        ctx.moveTo(coord, 0);
        ctx.lineTo(coord, ctx.canvas.height);
        ctx.stroke();
    }

    componentDidUpdate(prevProps) {
        if (this.props.data !== prevProps.data) {
            this.createGraph();
        }

        var annotations = [];

        if (this.props.graphExit) {
            annotations.push({
                series: 'altitude',
                x: this.props.graphExit * 1000,
                width: 18,
                height: 23,
                tickHeight: 4,
                shortText: "E",
                text: "Exit point",
                cssClass: 'Graph-exit-point'
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

        if (this.props.graphExit !== prevProps.graphExit || this.props.videoPosOnGraph !== prevProps.videoPosOnGraph) {
            this.dygGraph.setAnnotations(annotations);


        }


    }

    render() {
        if (this.props.data.length === 0) return this.renderFileInput();
        return (
            <div className="Graph" >
                <div className="Graph-wrap" ref="container">
                </div>
            </div>
        );
    }
}

Graph.propTypes = {
    data: PropTypes.array.isRequired,
    graphExit: PropTypes.number,
    videoPosOnGraph: PropTypes.number
};

Graph.contextTypes = {
    executeAction: PropTypes.func.isRequired
};

Graph.defaultProps = {
    data: []
};

export default connectToStores(Graph, [DataStore], (stores, props) => {
    return {
        data: stores.DataStore.data,
        graphExit: stores.DataStore.graphExit,
        videoPosOnGraph: stores.DataStore.getVideoPositionOnGraph()
    };
});
