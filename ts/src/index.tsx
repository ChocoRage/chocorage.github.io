"use strict"

import * as React from "react";
import * as ReactDOM from "react-dom";

import {App} from "./components/App";

declare var require: any
require("./styles/main.scss")

ReactDOM.render(
    <App />,
    document.getElementById("app")
);