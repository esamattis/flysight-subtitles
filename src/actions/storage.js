import {debounce, omit, mapValues, update, get} from "lodash/fp";


// Anything saved under this key will not be persisted to the local storage
const IN_MEMORY_KEY = "inMemoryOnly";

// Action types

const RESTORE_FROM_STORAGE = "RESTORE_FROM_STORAGE";
const SET_STORAGE_KEY = "SET_STORAGE_KEY";
const SAVE_NOW = "SAVE_NOW";
const CLEAR_ALL = "CLEAR_ALL";


// Action creators

export function setStorageKey(key) {
    return {type: SET_STORAGE_KEY, key};
}

export function clearAll() {
    localStorage.clear();
    window.scrollTo(0,0);
    return {type: CLEAR_ALL};
}

export function restoreFromStorage() {
    return (dispatch, getState) => {
        const storageKey = getStorageKey(getState());
        const rawState = window.localStorage[storageKey];
        var state = null;

        if (!rawState) {
            console.warn("No saved state", storageKey);
            return;
        }

        try {
            state = JSON.parse(rawState);
        } catch (err) {
            console.warn("Failed to parse saved state", storageKey);
            return;
        }

        dispatch({type: RESTORE_FROM_STORAGE, state});

    };
}

export function autoSaveToStorage() {
    return dispatch => {
        window.addEventListener("blur", () => {
            console.log("on blur save");
            dispatch(saveToStorageNow());
        }, false);

        window.addEventListener("beforeunload", () => {
            console.log("on beforeunload save");
            dispatch(saveToStorageNow());
        }, false);
    };
}

export function saveToStorageNow() {
    return {type: SAVE_NOW};
}

function _save(state) {
    const storageKey = getStorageKey(state);
    if (!storageKey) {
        console.warn("Storage key not found. Cannot save");
        return;
    }
    _saveDebounced.cancel();
    state = omit(IN_MEMORY_KEY, state);

    window.localStorage[storageKey] = JSON.stringify(state);
    console.log("App state saved to storage", storageKey, state);
}

const _saveDebounced = debounce(1000 * 5, _save);

const getStorageKey = get([IN_MEMORY_KEY, "storageKey"]);

export default function storageReducer(state, action) {

    switch (action.type) {
    case RESTORE_FROM_STORAGE:
        return {...action.state, [IN_MEMORY_KEY]: state[IN_MEMORY_KEY]};
    case SAVE_NOW:
        _save(state);
        return state;
    case SET_STORAGE_KEY:
        return update([IN_MEMORY_KEY, "storageKey"], () => action.key, state);
    case CLEAR_ALL:
        return {};
    default:
        _saveDebounced(state);
        return state;
    }

}
