import React from "react";
import padStart from "lodash/padStart";
import {connect} from "react-redux";

import {getSyncPointIndex, getGpsData} from "../actions/flysight";

const padZero = (num, s) => padStart(String(s), num, "0");
const fullMinutes = i => Math.floor(i / 60 / 1000);
const fullSeconds = i => Math.floor((i - fullMinutes(i) * 60 * 1000) / 1000);
const remainingMs = i => i % 1000;
const formatSubripTime = i => `00:${padZero(2, fullMinutes(i))}:${padZero(2, fullSeconds(i))},${padZero(3, remainingMs(i))}`;

function generateSubrip(gpsData, syncPointIndex) {
    console.log("Generating subrip!");
    var videoExitMin = 1;
    var videoExitSec = 10;

    var exitPointIndex = syncPointIndex;
    var subStart = videoExitMin * 60 * 1000 + videoExitSec * 1000; // in ms

    var prev = gpsData[syncPointIndex];

    // Seek to the begining of the data or video
    while (syncPointIndex !== 0) {
        syncPointIndex--;
        let point = gpsData[syncPointIndex];
        let duration = prev[0].getTime() - point[0].getTime();
        let newStart = subStart - duration;

        if (newStart < 0) {
            break;
        }

        subStart = newStart;
        prev = point;
    }

    prev = gpsData[syncPointIndex];
    var subNum = 0;
    var subrip = "";
    var distanceAtExit = null;

    while (subNum < 1000) {
        syncPointIndex++;


        let point = gpsData[syncPointIndex];
        let duration = point[0].getTime() - prev[0].getTime();
        let subEnd = subStart + duration;

        let fallrate = prev[2][0];
        let altitude = prev[1][0];
        let groundSpeed = prev[3][0];
        let jumpDistance = 0;
        let totalDistance = point[4];

        if (exitPointIndex === syncPointIndex) {
            distanceAtExit = totalDistance;
        }

        if (distanceAtExit !== null) {
            jumpDistance = totalDistance - distanceAtExit;
        }

        subNum++;
        subrip += subNum;
        subrip += "\n";
        subrip += `${formatSubripTime(subStart)} --> ${formatSubripTime(subEnd)}`;
        subrip += "\n";
        subrip += "Fallrate " + fallrate.toFixed(1) + " km/h";
        subrip += "\n";
        subrip += "Altitude " + Math.round(altitude) + " m";
        subrip += "\n";
        subrip += "Ground speed " + Math.round(groundSpeed) + " km/h";
        subrip += "\n" ;
        subrip += "Distance " + Math.round(jumpDistance) + " m";
        subrip += "\n\n";

        prev = point;
        subStart = subEnd;
    }

    return subrip;
}

var SubripView = React.createClass({
    getInitialState() {
        return {subtitleString: "", dirty: false};
    },

    handleGenerate(e) {
        e.preventDefault();
        this.setState({
            subtitleString: generateSubrip(this.props.gpsData, this.props.syncPointIndex),
            dirty: false,
        });
    },

    getRef(el) {
        this.textarea = el;
    },

    handleCopy(e) {
        e.preventDefault();
        this.textarea.select();
        console.log("copy", document.execCommand("copy"));
    },

    componentWillReceiveProps() {
        this.setState({dirty: true});
    },

    render() {
        const {subtitleString, dirty} = this.state;
        const {syncPointIndex, gpsData} = this.props;
        const hasGpsData = gpsData.length > 0;
        const canGenerateSubs = !!syncPointIndex && hasGpsData;

        if (!hasGpsData) {
            return null;
        }

        return (
            <div style={{width: "400px", margin: "0 auto"}}>

                <div>
                    <p>
                    Exit time in video
                    </p>
                    <input type="text" placeholder="minutes" />
                    <input type="text" placeholder="seconds" />
                </div>

                {canGenerateSubs &&
                    <p>
                        <button style={{width: "100%", padding: "1em"}} onClick={this.handleGenerate}>generate{dirty ? "*" : ""}</button>
                    </p>}

                {subtitleString &&
                    <div>
                        <h2>The subtitles!</h2>
                        <button style={{width: "100%", padding: "1em"}} onClick={this.handleCopy}>copy to clipboard</button>
                        <textarea readOnly rows="30" style={{width: "100%"}} value={subtitleString} ref={this.getRef} />
                    </div>}
            </div>
        );
    },
});
SubripView = connect(
    state => ({
        syncPointIndex: getSyncPointIndex(state),
        gpsData: getGpsData(state),
    })
)(SubripView);

export default SubripView;
