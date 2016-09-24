import {connect} from "react-redux";
import update from "lodash/fp/update";
import getOr from "lodash/fp/getOr";
import get from "lodash/fp/get";
import padStart from "lodash/padStart";
import {createSelector} from "reselect";

import Papa from "papaparse";
import distance from "gps-distance";

function setGraphExit(payload) {
    return {type: "SET_GRAPH_EXIT", ...payload};
}

function parseRow(row) {
    return {
        pos: {
            latitude: parseFloat(row[1], 10),
            longitude: parseFloat(row[2], 10),
        },
        time: new Date(row[0]),
        altitude: parseFloat(row[3], 10),
        vertAccuracy: parseFloat(row[8], 10),
        horAccuracy: parseFloat(row[7], 10),
    };
}

function calculateFlysightData(csvRows) {
    var prev = null;

    return csvRows.slice(2, -1).map(row => {
        var point = parseRow(row);
        if (!prev) {
            prev = point;
            return;
        }

        // var horDistance = geolib.getDistance(prev.pos, point.pos, 0.0000001);
        var horDistance = distance(
            prev.pos.latitude,
            prev.pos.longitude,

            point.pos.latitude,
            point.pos.longitude
        ) * 1000;


        var duration = point.time.getTime() - prev.time.getTime();
        var vertDistance = prev.altitude - point.altitude;

        var vertSpeed = vertDistance / (duration / 1000) * 3.6;
        var horSpeed = horDistance / (duration / 1000) * 3.6;

        var avgError = (prev.vertAccuracy + point.vertAccuracy) / 2.0;
        var avgHorError = (prev.horAccuracy + point.horAccuracy) / 2.0;

        prev = point;
        return [
            point.time,
            [point.altitude, point.vertAccuracy],
            [vertSpeed, avgError],
            [horSpeed, avgHorError],
        ];
    }).filter(Boolean);

}

function parseCSVString(csvString) {
    return dispatch => {
        Papa.parse(csvString, {complete: (results) => {
            console.log("parse errors", results.errors);
            dispatch({type: "SET_PARSED_GPS_DATA", gpsData: calculateFlysightData(results.data)});
        }});
    };
}

export function setRawGPSData(csvString, options={}) {
    window.localStorage.csvString = csvString;
    return dispatch => {
        dispatch({type: "CLEAR_ALL"});
        dispatch(parseCSVString(csvString));
    };
}

export function loadPreviousGPSData() {
    return dispatch => {
        if (window.localStorage.csvString) {
            dispatch(parseCSVString(window.localStorage.csvString));
        }
    };
}

const padZero = (num, s) => padStart(String(s), num, "0");
const fullMinutes = i => Math.floor(i / 60 / 1000);
const fullSeconds = i => Math.floor((i - fullMinutes(i) * 60 * 1000) / 1000);
const remainingMs = i => i % 1000;
const formatSubripTime = i => `00:${padZero(2, fullMinutes(i))}:${padZero(2, fullSeconds(i))},${padZero(3, remainingMs(i))}`;

export function addSubripProp() {
    return connect(createSelector(
        get(["inMemoryOnly", "gpsData"]),
        get("syncPointIndex"),
        generateSubrip
    ));
}


function generateSubrip(gpsData, syncPointIndex) {
    if (!gpsData || !syncPointIndex) {
        return {subrip: ""};
    }

    console.log("Generating subrip!");
    var videoExitMin = 1;
    var videoExitSec = 10;

    var subStart = videoExitMin * 60 * 1000 + videoExitSec * 1000; // in ms

    var prev = gpsData[syncPointIndex];

    // Seek to the begining of the data or video
    while (syncPointIndex !== 0) {
        syncPointIndex--;
        let point = gpsData[syncPointIndex];
        let duration = prev[0].getTime() - point[0].getTime();
        let newStart = subStart - duration;

        if (newStart < 0) {
            break;
        }

        subStart = newStart;
        prev = point;


    }

    prev = gpsData[syncPointIndex];
    var subNum = 0;
    var subrip = "";
    while (subNum < 1000) {
        syncPointIndex++;
        let point = gpsData[syncPointIndex];
        let duration = point[0].getTime() - prev[0].getTime();
        let subEnd = subStart + duration;

        let fallrate = prev[2][0];
        let altitude = prev[1][0];

        subNum++;
        subrip += subNum;
        subrip += "\n";
        subrip += `${formatSubripTime(subStart)} --> ${formatSubripTime(subEnd)}`;
        subrip += "\n";
        subrip += padStart(fallrate.toFixed(1), 5, " ") + " km/h ";
        subrip += padStart(Math.round(altitude), 4, " ") + " M";
        subrip += "\n\n";

        prev = point;
        subStart = subEnd;
    }

    return {subrip};
}

export function addFlysightProps() {
    return connect(
        state => ({
            gpsData: getOr([], ["inMemoryOnly", "gpsData"], state),
            graphPosition: state.graphPosition,
        }),
        {setRawGPSData, setGraphExit, generateSubrip}
    );
}

export default function reducer(state={}, action) {
    if (action.type === "CLEAR_ALL") {
        return {};
    }

    if (action.type === "SET_PARSED_GPS_DATA") {
        return update(["inMemoryOnly", "gpsData"], () => action.gpsData, state);
    }
    if (action.type === "SET_GRAPH_EXIT") {
        return {...state, graphPosition: action.graphPosition, syncPointIndex: action.syncPointIndex};
    }

    if (!state || !state.gpsData) {
        return {...state, gpsData: []};
    }

    return state;
}
