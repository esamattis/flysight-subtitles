import "./style.css";
import React from "react";
import ReactDOM from "react-dom";
import {createStore, applyMiddleware} from "redux";
import {Provider} from "react-redux";

import storageReducer, {restoreFromStorage, setStorageKey} from "./actions/storage";
import leanReducer from "./actions/lean";
import Main from "./components/Main";
import {inputReducer} from "./components/Input";

import {composeReducers, thunkMiddleware} from "./utils";


const middleware = [thunkMiddleware];

if (process.env.NODE_ENV !== "production") {
    let createLogger = require("redux-logger");
    middleware.push(createLogger());
}

const store = createStore(
    composeReducers(
        inputReducer,
        leanReducer,
        storageReducer
    ),
    applyMiddleware(...middleware)
);
store.dispatch(setStorageKey("flysight"));
store.dispatch(restoreFromStorage());
window.getState = store.getState;

function Root() {
    return (
        <Provider store={store}>
            <Main />
        </Provider>
    );
}

ReactDOM.render(<Root />, document.getElementById("app"));
