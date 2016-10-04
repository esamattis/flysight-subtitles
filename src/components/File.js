import React from "react";
import Papa from "papaparse";
import FileDrop from "react-file-drop";

import analyzeFlysightData from "../analyzeFlysightData";
import {connectLean, thunk} from "../actions/lean";

var File = React.createClass({

    componentDidMount() {
        if (localStorage.flysightRawData) {
            this.props.parseRawData(localStorage.flysightRawData);
        }
    },

    render() {
        return (
            <div className="File">
                <h3>Select FlySight data file</h3>
                <p>
                    <input type="file" accept=".csv" onChange={this.props.handleFiles} />
                </p>
                <div style={{width: "100%", padding: 10, backgroundColor: "silver", textAlign: "center"}}>
                    <p>Or drag and drop one here.</p>
                    <FileDrop frame={document} onFrameDrop={this.props.handleFiles} >
                        <p>Drop it!</p>
                    </FileDrop>
                </div>
            </div>
        );
    },

});

export const connectFile = connectLean({
    scope: "inMemoryOnly",
    defaults: {
        gpsData: [],
    },
    mapState(s) {
        return {gpsData: s.gpsData};
    },
});

File = connectLean({
    updates: {
        handleFiles(e) {
            return thunk((update, {parseRawData}) => {
                var files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
                var file = files[0];

                update({
                    graph: {
                        dataFilename: file.name,
                    },
                });

                var reader = new FileReader();
                reader.onload = e => {
                    localStorage.flysightRawData = e.target.result;
                    update({
                        graph: {
                            graphPosition: null,
                            syncPointIndex: null,
                        },
                    });
                    update(parseRawData(e.target.result));
                };
                reader.readAsText(file);
            });
        },
        parseRawData(rawData) {
            return thunk(update => {
                Papa.parse(rawData, {complete: (results) => {
                    console.log("parse errors", results.errors);
                    update({
                        inMemoryOnly: {
                            gpsData: analyzeFlysightData(results.data),
                        },
                    });
                }});
            });
        },
    },
})(File);


export default File;
