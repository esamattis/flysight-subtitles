import React from "react";
import getOr from "lodash/fp/getOr";
import update from "lodash/fp/update";
import omit from "lodash/fp/omit";
import {connect} from "react-redux";

export function setInputValue(key, value) {
    return {type: "INPUT_VALUE", value, stateKey: key};
}

var Input = React.createClass({
    render() {
        var Component = this.props.component || "input";
        return <Component {...omit(["stateKey", "component"], this.props)} />;
    },
});
Input = connect(
    (state, ownProps) => ({
        value: getOr("", ownProps.stateKey, state),
    }),
    (dispatch, ownProps) => ({
        onChange(e) {
            dispatch(setInputValue(ownProps.stateKey, e.target.value));
        },
    })
)(Input);


export function inputReducer(state, action) {
    if (action.type === "INPUT_VALUE") {
        return update(action.stateKey, () => action.value, state);
    }

    return state;
}

export default Input;
