"use strict";

import debug from "debug";
window.debug = debug;
import React from "react";
import Fluxible from "fluxible";

import Main from "./components/Main";


var app = new Fluxible({component: Main});

app.registerStore(require("./stores/DataStore"));

var context = app.createContext();
var mountNode = document.getElementById("app");
React.render(context.createElement(), mountNode, () => {
    console.log("React rendered");
});
