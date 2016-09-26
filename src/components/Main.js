import React from "react";
import {connect} from "react-redux";

import {clearAll} from "../actions/storage";
import {setRawGPSData} from "../actions/flysight";
import {setInputValue} from "./Input";
import Graph from "./Graph";
import SubripView from "./SubripView";
import Box from "./Box";

var Main = React.createClass({

    handleFile(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = e => {
            this.props.setRawGPSData(e.target.result);
            this.props.setInputValue("dataFilename", file.name);
        };
        reader.readAsText(file);
    },

    render() {
        return (
            <div>
                <Box>
                    <p>
                        Convert <a href="http://flysight.ca/">FlySight</a> data files
                        (.csv) to SubRip (.srt) subtitles.
                    </p>
                    <p>
                        Watch a <a href="https://youtu.be/Oa81xi-d5iw">demo video</a> or play with the <a href="https://raw.githubusercontent.com/epeli/flysight-subtitles/master/data/15-30-18.CSV">data file</a>.
                    </p>
                    <h3>Select FlySight data file</h3>
                    <p>
                        <input type="file" accept=".csv" onChange={this.handleFile} />
                    </p>
                </Box>

                <Graph />

                <Box>
                    <SubripView />
                </Box>

                <p style={{textAlign: "center"}}>
                    <button onClick={this.props.clearAll}>Reset all data</button>
                </p>

                <hr />
                <p style={{textAlign: "center"}}>
                    Made by Esa-Matti Suuronen (esa-matti@suuronen.org)
                </p>
            </div>
        );
    },

});
Main = connect(null, {clearAll, setInputValue, setRawGPSData})(Main);



export default Main;
