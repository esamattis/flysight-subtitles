

export function setGraphExit(context, payload) {
    context.dispatch("SET_GRAPH_EXIT", payload);
}

export function setVideoExit(context, payload) {
    context.dispatch("SET_VIDEO_EXIT", payload);
}

export function setVideoFile(context, payload) {
    context.dispatch("SET_VIDEO_FILE", payload);
}

export function setVideoPosition(context, payload) {
    context.dispatch("SET_VIDEO_POS", payload);
}
