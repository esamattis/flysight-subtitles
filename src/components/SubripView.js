import React from "react";
import debounce from "lodash/fp/debounce";
import {saveAs} from "file-saver";


import {connectLean} from "../actions/lean";
import generateSubrip from "../generateSubrip";

import {connectGraphData} from "./Graph";
import {connectFile} from "./File";

function removeExtension(s, ext) {
    if (ext) {
        return s.replace(new RegExp(`\.${ext}$`), "");
    }

    return s.replace(/\.[^/.]+$/, "");
}


const defaultTemplate = `
Fallrate FALLRATE km/h
Altitude ALTITUDE m
Ground speed SPEED km/h
Distance DISTANCE m
Freefall time TIME s
Glide ratio GLIDE
`.trim();

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
            this.props.subtitleTemplate || defaultTemplate,
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
        const {syncPointIndex, gpsData} = this.props;
        const hasGpsData = gpsData.length > 0;
        return !!syncPointIndex && hasGpsData;
    },

    render() {
        const {subtitleString, dirty} = this.state;
        const {filename, dataFilename, videoMinutes, videoSeconds, dropzoneElevation, subtitleTemplate} = this.props;
        const canGenerateSubs = this.canGenerateSubs();

        return (
            <div style={{width: "400px", margin: "0 auto"}}>

                <div>
                    <h3>
                        Exit time in the video
                    </h3>
                    <p>
                        minutes and seconds
                    </p>

                    <input onChange={this.props.handleVideoMinutes} value={videoMinutes} type="text" placeholder="01" />
                    <input onChange={this.props.handleVideoSeconds} value={videoSeconds} type="text" placeholder="2.34" />

                    <br />
                    <small>
                        You can use fractions of seconds if needed.
                    </small>

                    <h3>
                    Dropzone elevation
                    </h3>
                    <p>
                        meters
                    </p>
                    <input onChange={this.props.handleDropzoneElevation} value={dropzoneElevation} type="text" placeholder="0" />
                    <br />
                    <small>protip: You can see it from the graph on landing</small>

                    <h3>
                    Subtitle template
                    </h3>
                    <textarea
                        value={subtitleTemplate}
                        onChange={this.props.handleSubtitleTemplate}
                        style={{width: "100%"}}
                        type="text"
                        placeholder={defaultTemplate}
                        rows="6"
                       />
                    <a href="#" onClick={this.props.setDefaultSubtitleTemplate}>use default</a>

                    <h3>
                        Download filename
                    </h3>
                    <input value={filename} onChange={this.props.handleFilename} type="text" placeholder={dataFilename ? removeExtension(dataFilename) : "GOPR0123"} />
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

                {canGenerateSubs && subtitleString &&
                    <div>
                        <p>
                            <button style={{width: "100%", padding: "1em"}} onClick={this.handleCopy}>Copy to clipboard</button>
                            <button style={{width: "100%", padding: "1em"}} onClick={this.handleDownload}>Dowload</button>
                            <textarea readOnly rows="15" style={{width: "100%"}} value={subtitleString} ref={this.getRef} />
                        </p>
                    </div>}
            </div>
        );
    },
});
SubripView = connectLean({
    scope: "options",
    defaults: {
        videoMinutes: 0,
        videoSeconds: 0,
        dropzoneElevation: 0,
        subtitleTemplate: defaultTemplate,
        filename: "",
    },
    updates: {
        handleDropzoneElevation(e) {
            return {dropzoneElevation: e.target.value};
        },
        handleVideoMinutes(e) {
            return {videoMinutes: e.target.value};
        },
        handleVideoSeconds(e) {
            return {videoSeconds: e.target.value};
        },
        handleSubtitleTemplate(e) {
            return {subtitleTemplate: e.target.value};
        },
        handleFilename(e) {
            return {filename: e.target.value};
        },
        setDefaultSubtitleTemplate(e) {
            if (e) {
                e.preventDefault();
            }
            return {subtitleTemplate: defaultTemplate};
        },
    },
})(SubripView);

SubripView = connectGraphData(SubripView);
SubripView = connectFile(SubripView);


export default SubripView;
