import React from "react";

import {addSubripProp} from "../actions/flysight";

var SubripView = React.createClass({
    getRef(el) {
        this.textarea = el;
    },

    handleCopy(e) {
        e.preventDefault();
        this.textarea.select();
        console.log("copy", document.execCommand("copy"));
    },

    render() {
        const {subrip} = this.props;
        if (!subrip) return null;
        return (
            <div>
                <h2>Subrip subtitles</h2>
                <textarea readOnly rows="5" cols="40" value={subrip} ref={this.getRef} />
                <br />
                <button onClick={this.handleCopy}>copy to clipboard</button>
            </div>
        );
    },
});
SubripView = addSubripProp()(SubripView);

export default SubripView;
