import "./style.css";
import React from "react";
import ReactDOM from "react-dom";
import {createStore, applyMiddleware} from "redux";
import {Provider} from "react-redux";

import reducer from "./actions";
import Main from "./components/Main";

import {thunkMiddleware} from "./utils";


const middleware = [thunkMiddleware];

if (process.env.NODE_ENV !== "production") {
    let createLogger = require("redux-logger");
    middleware.push(createLogger());
}

const store = createStore(reducer, applyMiddleware(...middleware));
window.getState = store.getState;

function Root() {
    return (
        <Provider store={store}>
            <Main />
        </Provider>
    );
}

ReactDOM.render(<Root />, document.getElementById("app"));
