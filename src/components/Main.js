import React from "react";

import Graph from "./Graph";
import SubripView from "./SubripView";

var Main = React.createClass({

    render() {
        return (
            <div>
                <h1 style={{textAlign: "center"}}>Flysight to Subrip converter</h1>
                <Graph />
                <SubripView />
            </div>
        );
    },

});



export default Main;
