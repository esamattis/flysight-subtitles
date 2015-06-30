
import React from "react";

import Graph from "./Graph";
import Player from "./Player";

class Main extends React.Component {
    render() {
        return (
            <div className="Main">
                <div className="Graph-container">
                    <Graph />
                </div>

                <div className="Player-container">
                    <Player />
                </div>
            </div>
        );
    }
}


Main.propTypes = {
    foo: React.PropTypes.object
};


module.exports = Main;
