var webpack = require("webpack");

var config = {
    entry: "./src/index.js",
    output: {
        path: "dist",
        filename: "bundle.js",
        publicPath: "/dist",
    },
    // devtool: "cheap-module-eval-source-map", // faster
    devtool: "sourceMap",
    module: {
        loaders: [
            {test: /\.css$/,  loader: "style-loader!css-loader"},
            {test: /\.png/, loader: "url-loader?mimetype=image/png"},
            {
                test: /\.jsx?$/,
                loader: "babel",
                exclude: /node_modules/,
            },

        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        }),
    ],
};


module.exports = config;
