import React from "react";
import Papa from "papaparse";

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
            <div>
                <h3>Select FlySight data file</h3>
                <p>
                    <input type="file" accept=".csv" onChange={this.props.handleFiles} />
                </p>
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
                var file = e.target.files[0];
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
