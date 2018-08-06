/* eslint-disable */
const NODE_ENV = process.env.NODE_ENV;
const path = require("path");
const webpack = require("webpack");

module.exports = {
    context: path.join(__dirname, "/frontend"),

    entry: {
        bundle: [
            "./app.js",
        ],
    },

    output: {
        path: path.join(__dirname, "public"),
        filename: "bundle.js",
    },

    plugins: [
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production"),
            },
        }),
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            compress: {
                warnings: false,
            },
        }),
    ],

    devtool: "source-map",

    resolve: {
        modulesDirectories: ["node_modules", "frontend"],
        extensions: ["", ".js", ".jsx", ".json"],
        packageMains: ["webpack", "browser", "web", "browserify", ["jam", "main"], "main"],
    },

    resolveLoader: {
        modulesDirectories: ["node_modules"],
        modulesTemplates: ["*-loader", "*"],
        extensions: ["", ".js"],
    },

    target: "electron",

    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loaders: [
                    "react-hot",
                    "babel?presets[]=es2015,presets[]=react,presets[]=stage-0,plugins[]=transform-runtime",
                ],
            },
            {
                test: /\.json$/,
                loader: "json-loader",
            },
        ],
    },
};
