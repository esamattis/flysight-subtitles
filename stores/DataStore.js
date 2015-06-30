

import BaseStore from 'fluxible/addons/BaseStore';


export default class DataStore extends BaseStore {

    constructor (dispatcher) {
        super(dispatcher);
        this.videoExit = 100;
    }

    handleGPSData(data) {
        this.data = data;
        this.emitChange();
    }

    handleVideoExit(videoExit) {
        console.log("vidoe exit is", videoExit);
        this.videoExit = videoExit;
        this.emitChange();
    }

    handleGraphExit(graphExit) {
        console.log("graph exit is", graphExit);
        this.graphExit = graphExit;
        this.emitChange();
    }

    handleVideoFile(file) {
        this.videoFile = file;
        this.emitChange();
    }

    handleVideoPosition(videoPosition) {
        console.log("setting video pos");
        this.videoPosition = videoPosition;
        this.emitChange();
    }

    getDataStartTime() {
        return this.data[0][0].getTime() / 1000;
    }

    getVideoPositionOnGraph() {
        if (!this.graphExit) return console.warn("no graphExit");
        if (!this.videoFile) return console.warn("no videoFile");
        if (!this.videoExit) return console.warn("no videoExit");
        if (!this.videoPosition) return console.warn("no videoPosition");
        if (!this.data[0]) return console.warn("no data");

        var graphStart = this.getDataStartTime();
        var distanceOnGraph = this.graphExit - graphStart;
        var ratio = distanceOnGraph / this.videoExit;

        return graphStart + ratio * this.videoPosition;

    }

}

DataStore.handlers = {
    "RECEIVE_GPS_DATA": "handleGPSData",
    "SET_VIDEO_EXIT": "handleVideoExit",
    "SET_GRAPH_EXIT": "handleGraphExit",
    "SET_VIDEO_FILE": "handleVideoFile",
    "SET_VIDEO_POS": "handleVideoPosition"
};

DataStore.storeName = "DataStore";

