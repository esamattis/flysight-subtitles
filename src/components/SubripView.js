import React from "react";
import padStart from "lodash/padStart";
import debounce from "lodash/fp/debounce";
import {connect} from "react-redux";
import {saveAs} from "file-saver";

import Input from "./Input";

import {getSyncPointIndex, getGpsData} from "../actions/flysight";

const padZero = (num, s) => padStart(String(s), num, "0");
const fullMinutes = i => Math.floor(i / 60 / 1000);
const fullSeconds = i => Math.floor((i - fullMinutes(i) * 60 * 1000) / 1000);
const remainingMs = i => i % 1000;
const formatSubripTime = i => `00:${padZero(2, fullMinutes(i))}:${padZero(2, fullSeconds(i))},${padZero(3, remainingMs(i))}`;

const defaultTemplate = `
Fallrate FALLRATE km/h
Altitude ALTITUDE m
Ground speed SPEED km/h
Distance DISTANCE m
Freefall time TIME s
Glide ratio GLIDE
`.trim();

function renderTemplate(template, context) {
    var keys = Object.keys(context);
    var re = new RegExp(keys.join("|"), "g");
    return template.replace(re, k => context[k]).trim();
}

function removeExtension(s, ext) {
    if (ext) {
        return s.replace(new RegExp(`\.${ext}$`), "");
    }

    return s.replace(/\.[^/.]+$/, "");
}

function generateSubrip(template, gpsData, syncPointIndex, videoMinutes, videoSeconds, dropzoneElevation=0) {
    console.log("Generating subrip!");
    template = String(template || "").trim() || defaultTemplate.trim();
    videoMinutes = parseInt(videoMinutes, 10);
    videoSeconds = parseFloat(videoSeconds, 10);
    dropzoneElevation = parseFloat(dropzoneElevation, 10);

    var exitPointIndex = syncPointIndex;
    var subStart = videoMinutes * 60 * 1000 + videoSeconds * 1000; // in ms

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
    var exitTime = null;

    // eslint-disable-next-line
    while (true) {
        syncPointIndex++;
        let point = gpsData[syncPointIndex];
        if (!point) {
            break;
        }

        let duration = point[0].getTime() - prev[0].getTime();
        let subEnd = subStart + duration;
        let totalDistance = point[4];

        let templateContext = {
            FALLRATE: Math.round(prev[2][0]),
            ALTITUDE: Math.round(prev[1][0] - dropzoneElevation),
            SPEED: Math.round(prev[3][0]),
            GLIDE: -1 * ((prev[4] - point[4]) / (prev[1][0] - point[1][0])).toFixed(2),
            DISTANCE: 0,
            TIME: 0,
        };

        if (exitPointIndex === syncPointIndex) {
            distanceAtExit = totalDistance;
            exitTime = subStart;
        }

        if (distanceAtExit !== null) {
            templateContext.DISTANCE = Math.round(totalDistance - distanceAtExit);
        }

        if (exitTime !== null) {
            templateContext.TIME = Math.round((subStart - exitTime) / 1000);
        }

        subNum++;
        subrip += subNum;
        subrip += "\n";
        subrip += `${formatSubripTime(subStart)} --> ${formatSubripTime(subEnd)}`;
        subrip += "\n";
        subrip += renderTemplate(template, templateContext);
        subrip += "\n\n";


        // Shall be max freefall time :)
        if (templateContext.TIME > 5 * 60) {
            break;
        }

        prev = point;
        subStart = subEnd;
    }

    return subrip;
}

var SubripView = React.createClass({
    componentWillMount() {
        this.debouncedGenerate = debounce(1000, this.generate);
    },
    getInitialState() {
        return {subtitleString: "", dirty: false};
    },

    generate(cb) {
        if (!this.canGenerateSubs()) {
            return;
        }
        var subtitleString = generateSubrip(
            this.props.subtitleTemplate,
            this.props.gpsData,
            this.props.syncPointIndex,
            this.props.videoMinutes,
            this.props.videoSeconds,
            this.props.dropzoneElevation
        );
        this.setState({subtitleString, dirty: false}, cb);
    },

    getRef(el) {
        this.textarea = el;
    },

    getDownloadFilename() {
        const {dataFilename, filename} = this.props;

        if (filename) {
            return removeExtension(filename, "srt") + ".srt";
        }

        if (dataFilename) {
            return removeExtension(dataFilename) + ".srt";
        }

        return "flysight.srt";
    },

    handleDownload(e) {
        e.preventDefault();
        this.generate();
        var blob = new Blob([this.state.subtitleString], {type: "text/plain;charset=utf-8"});
        saveAs(blob, this.getDownloadFilename());
    },

    handleCopy(e) {
        e.preventDefault();
        this.generate(() => {
            this.textarea.select();
            console.log("copy", document.execCommand("copy"));
        });
    },

    componentWillReceiveProps() {
        this.debouncedGenerate();
        this.setState({dirty: true});
    },

    canGenerateSubs() {
        const {syncPointIndex, gpsData, videoMinutes, videoSeconds} = this.props;
        const hasGpsData = gpsData.length > 0;
        return !!syncPointIndex && hasGpsData && videoMinutes != null && videoSeconds != null;
    },

    render() {
        const {subtitleString, dirty} = this.state;
        const {dataFilename} = this.props;
        const canGenerateSubs = this.canGenerateSubs();

        return (
            <div style={{width: "400px", margin: "0 auto"}}>

                <div>
                    <h3>
                    Exit time in the video
                    </h3>
                    <Input stateKey="videoMinutes" type="text" placeholder="minutes" />
                    <Input stateKey="videoSeconds" type="text" placeholder="seconds" />
                    <br />
                    <small>
                        You can use fractions of seconds if needed.
                    </small>

                    <h3>
                    Dropzone elevation in meters
                    </h3>
                    <Input stateKey="dropzoneElevation" type="text" placeholder="0" />
                    <br />
                    <small>protip: You can see it from the graph</small>

                    <h3>
                    Subtitle template
                    </h3>
                    <Input
                        stateKey="subtitleTemplate"
                        style={{width: "100%"}}
                        component="textarea"
                        type="text"
                        placeholder={defaultTemplate}
                        rows="6"

                       />

                    <h3>
                        Download filename
                    </h3>
                    <Input stateKey="filename" type="text" placeholder={dataFilename ? removeExtension(dataFilename) : "GOPR0123"} />
                    <br />
                    <small>
                        Most players can pick up the subtitle file when
                        it's in the same directory with video file with
                        same name.

                        For a player I'd recommend <a href="https://mpv.io/">mpv</a>.
                        VLC is bit laggy with big subtitle files.
                    </small>

                </div>

                <h2>The subtitles!</h2>

                <i>
                    {!canGenerateSubs && "Missing some data. Exit point from the graph?"}
                    {(canGenerateSubs && subtitleString && dirty) && "Dirty! Compiling soon."}
                    {(canGenerateSubs && !subtitleString) && "Compiling!"}
                </i>

                {subtitleString &&
                    <div>
                        <p>
                            <button style={{width: "100%", padding: "1em"}} onClick={this.handleCopy}>Copy to clipboard</button>
                            {filename && <button style={{width: "100%", padding: "1em"}} onClick={this.handleDownload}>Dowload</button>}
                            <textarea readOnly rows="15" style={{width: "100%"}} value={subtitleString} ref={this.getRef} />
                        </p>
                    </div>}
            </div>
        );
    },
});
SubripView = connect(
    state => ({
        syncPointIndex: getSyncPointIndex(state),
        videoMinutes: state.videoMinutes,
        videoSeconds: state.videoSeconds,
        dropzoneElevation: state.dropzoneElevation,
        filename: state.filename,
        dataFilename: state.dataFilename,
        subtitleTemplate: state.subtitleTemplate,
        gpsData: getGpsData(state),
    })
)(SubripView);

export default SubripView;
