
import Papa from "papaparse";
import Bluebird from "bluebird";
import distance from "gps-distance";

function parseRow(row) {
    return {
        pos: {
            latitude: parseFloat(row[1], 10),
            longitude: parseFloat(row[2], 10)
        },
        time: new Date(row[0]),
        altitude: parseFloat(row[3], 10),
        vertAccuracy: parseFloat(row[8], 10),
        horAccuracy: parseFloat(row[7], 10)
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
            [horSpeed, avgHorError]
        ];
    }).filter(Boolean);

}

export default function parseCSV(context, payload) {
    return new Bluebird((resolve, reject) => {
        Papa.parse(payload.file, {complete: (results) => {
            console.log("parse errors", results.errors);
            context.dispatch("RECEIVE_GPS_DATA", parse(results.data));
        }});
    });
}
