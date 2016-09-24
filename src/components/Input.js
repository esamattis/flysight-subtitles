import React from "react";
import getOr from "lodash/fp/getOr";
import update from "lodash/fp/update";
import omit from "lodash/fp/omit";
import {connect} from "react-redux";

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
            dispatch({type: "INPUT_VALUE", value: e.target.value, stateKey: ownProps.stateKey});
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
