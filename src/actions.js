import {connect} from "react-redux";
import padStart from "lodash/padStart";

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

function parse(rawData) {
    var prev = null;

    return rawData.slice(2, -1).map(row => {
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

function loadFlysightData(file) {
    return (dispatch) => {
        Papa.parse(file, {complete: (results) => {
            console.log("parse errors", results.errors);
            dispatch({type: "SET_PARSED_GPS_DATA", gpsData: parse(results.data)});
        }});
    };
}

const padZero = (num, s) => padStart(String(s), num, "0");
const fullMinutes = i => Math.floor(i / 60 / 1000);
const fullSeconds = i => Math.floor((i - fullMinutes(i) * 60 * 1000) / 1000);
const remainingMs = i => i % 1000;
const formatSubripTime = i => `00:${padZero(2, fullMinutes(i))}:${padZero(2, fullSeconds(i))},${padZero(3, remainingMs(i))}`;

function generateSubrip() {
    console.log("generating");
    return (dispatch, getState) => {
        var {syncPointIndex, gpsData} = getState();
        var videoExitMin = 1;
        var videoExitSec = 10;


        var subStart = videoExitMin * 60 * 1000 + videoExitSec * 1000; // in ms
        var subNum = 0;
        var prev = gpsData[syncPointIndex];
        var subrip = "";

        while (subNum < 600) {
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

        console.log(subrip);
        prompt("copy", subrip);


    };

}

export function addFlysightProps() {
    return connect(
        state => ({
            gpsData: state.gpsData,
            graphPosition: state.graphPosition,
        }),
        {loadFlysightData, setGraphExit, generateSubrip}
    );
}

export default function reducer(state={}, action) {
    if (action.type === "SET_PARSED_GPS_DATA") {
        return {...state, gpsData: action.gpsData};
    }
    if (action.type === "SET_GRAPH_EXIT") {
        return {...state, graphPosition: action.graphPosition, syncPointIndex: action.syncPointIndex};
    }

    if (!state.gpsData) {
        return {...state, gpsData: []};
    }

    return state;
}
