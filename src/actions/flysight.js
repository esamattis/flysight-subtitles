import {connect} from "react-redux";
import update from "lodash/fp/update";
import getOr from "lodash/fp/getOr";
import get from "lodash/fp/get";

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
    var totalDistance = 0;

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

        totalDistance += horDistance;

        prev = point;
        return [
            point.time,
            [point.altitude, point.vertAccuracy],
            [vertSpeed, avgError],
            [horSpeed, avgHorError],
            totalDistance,
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

export const getGpsData = getOr([], ["inMemoryOnly", "gpsData"]);
export const getSyncPointIndex = get("syncPointIndex");

export function addFlysightProps() {
    return connect(
        state => ({
            gpsData: getGpsData(state),
            graphPosition: state.graphPosition,
        }),
        {setRawGPSData, setGraphExit}
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
