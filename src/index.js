import "./style.css";
import React from "react";
import ReactDOM from "react-dom";
import {createStore, applyMiddleware} from "redux";
import {Provider} from "react-redux";

import flysightReducer, {loadPreviousGPSData} from "./actions/flysight";
import storageReducer, {restoreFromStorage, setStorageKey} from "./actions/storage";
import Main from "./components/Main";

import {composeReducers, thunkMiddleware} from "./utils";


const middleware = [thunkMiddleware];

if (process.env.NODE_ENV !== "production") {
    let createLogger = require("redux-logger");
    middleware.push(createLogger());
}

const store = createStore(
    composeReducers(
        flysightReducer,
        storageReducer
    ),
    applyMiddleware(...middleware)
);
store.dispatch(setStorageKey("flysight"));
store.dispatch(restoreFromStorage());
setTimeout(() => {
    store.dispatch(loadPreviousGPSData());
}, 0);
window.getState = store.getState;

function Root() {
    return (
        <Provider store={store}>
            <Main />
        </Provider>
    );
}

ReactDOM.render(<Root />, document.getElementById("app"));
