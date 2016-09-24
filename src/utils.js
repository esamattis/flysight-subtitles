import {isFunction} from "lodash/fp";

export function thunkMiddleware({dispatch, getState}) {
    return next => action => {
        if (typeof action === "function") {
            return action(dispatch, getState);
        }
        return next(action);
    };
}

export function composeReducers(...reducers) {
    return (state=null, action) => {
        return reducers.filter(isFunction).reduce(
            ((state, subReducer) => subReducer(state, action)),
            state
        );
    };
}
