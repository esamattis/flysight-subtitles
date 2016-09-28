
import padStart from "lodash/padStart";
import padEnd from "lodash/padEnd";

function padDecimalZero(num) {
    var [i, d] = String(num).split(".");
    if (!d) {
        return i + ".00";
    }
    return i + "." + padEnd(d, 2, "0");
}

function renderTemplate(template, context) {
    var keys = Object.keys(context);
    var re = new RegExp(keys.join("|"), "g");
    return template.replace(re, k => context[k]).trim();
}

const padZero = (num, s) => padStart(String(s), num, "0");
const fullMinutes = i => Math.floor(i / 60 / 1000);
const fullSeconds = i => Math.floor((i - fullMinutes(i) * 60 * 1000) / 1000);
const remainingMs = i => i % 1000;
const formatSubripTime = i => `00:${padZero(2, fullMinutes(i))}:${padZero(2, fullSeconds(i))},${padZero(3, remainingMs(i))}`;


export default function generateSubrip(template, gpsData, syncPointIndex, videoMinutes, videoSeconds, dropzoneElevation=0) {
    console.log("Generating subrip!");
    videoMinutes = parseInt(videoMinutes, 10) || 0;
    videoSeconds = parseFloat(videoSeconds, 10) || 0;
    dropzoneElevation = parseFloat(dropzoneElevation, 10);

    var exitPointIndex = syncPointIndex;
    var subStart = videoMinutes * 60 * 1000 + videoSeconds * 1000; // in ms

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
    var distanceAtExit = null;
    var exitTime = null;

    // eslint-disable-next-line
    while (true) {
        syncPointIndex++;
        let point = gpsData[syncPointIndex];
        if (!point) {
            break;
        }

        let duration = point[0].getTime() - prev[0].getTime();
        let subEnd = subStart + duration;
        let totalDistance = point[4];
        let glide = -1 * ((prev[4] - point[4]) / (prev[1][0] - point[1][0])).toFixed(2);

        let templateContext = {
            FALLRATE: Math.round(prev[2][0]),
            ALTITUDE: Math.round(prev[1][0] - dropzoneElevation),
            SPEED: Math.round(prev[3][0]),
            GLIDE: padDecimalZero(glide, 2),
            DISTANCE: 0,
            TIME: 0,
        };

        if (exitPointIndex === syncPointIndex) {
            distanceAtExit = totalDistance;
            exitTime = subStart;
        }

        if (distanceAtExit !== null) {
            templateContext.DISTANCE = Math.round(totalDistance - distanceAtExit);
        }

        if (exitTime !== null) {
            templateContext.TIME = Math.round((subStart - exitTime) / 1000);
        }

        subNum++;
        subrip += subNum;
        subrip += "\n";
        subrip += `${formatSubripTime(subStart)} --> ${formatSubripTime(subEnd)}`;
        subrip += "\n";
        subrip += renderTemplate(template, templateContext);
        subrip += "\n\n";


        // Shall be max freefall time :)
        if (templateContext.TIME > 5 * 60) {
            break;
        }

        prev = point;
        subStart = subEnd;
    }

    return subrip;
}

