
import React from "react";

export default function Box(props) {
    return <div style={styles.box} {...props} />;
}

const styles = {
    box: {
        width: "400px", margin: "0 auto",
    },
};
