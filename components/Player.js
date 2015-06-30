
import React, {PropTypes} from "react";
import connectToStores from 'fluxible/addons/connectToStores';
import throttle from "lodash/function/throttle";

import DataStore from "../stores/DataStore";
import {setVideoExit, setVideoFile, setVideoPosition} from "../actions/GraphActions";

var flowplayer = window.flowplayer;

class Player extends React.Component {

    constructor(props) {
        super(props);
        this.throttledSendPos = throttle(this.sendPos.bind(this), 100);
    }

    createPlayer() {
        var el = React.findDOMNode(this.refs.container);
        var file = this.props.videoFile;
        this.player = flowplayer(el, {
                clip: {
                    sources: [{
                            type: file.type,
                            src: URL.createObjectURL(file)
                        }]
                }
        });

        this.player.on("progress", (ev, api, time) => {
            this.throttledSendPos(time);
        });

        window.player = this.player;
    }

    sendPos(time) {
        this.context.executeAction(setVideoPosition, time);
    }

    componentDidUpdate() {
        if (this.props.videoFile) {
            this.createPlayer();
        }
    }

    renderFileInput() {
        return <input type="file" accept=".mp4" onChange={e => this.context.executeAction(setVideoFile, e.target.files[0])} />;
    }

    render() {
        if (!this.props.videoFile) {
            return this.renderFileInput();
        }

        return (
            <div className="Player">
                <div>
                    <button
                        onClick={e => this.context.executeAction(setVideoExit, this.player.video.time)}
                        >set exit</button>
                </div>
                <div className="Player-wrap" ref="container" style={{height: 300}}> </div>
            </div>
        );
    }

}

Player.contextTypes = {
    executeAction: PropTypes.func.isRequired
};

Player.propTypes = {
    videoFile: PropTypes.object
};

export default connectToStores(Player, [DataStore], (stores, props) => {
    return {
        videoFile: stores.DataStore.videoFile
    };
});
