const NODE_ENV = process.env.NODE_ENV || "development";
const path = require("path");
const webpack = require("webpack");

module.exports = {
    mode: NODE_ENV,
    context: path.join(__dirname, "/frontend"),

    entry: {
        bundle: ["@babel/polyfill", "./app.js"],
    },

    output: {
        path: path.join(__dirname, "public", "assets", "dist"),
        filename: "[name].js",
    },

    plugins: [
        new webpack.SourceMapDevToolPlugin(),
    ],

    devtool: "eval",

    resolve: {
        modules: ["node_modules", "frontend"],
        extensions: [".js", ".jsx", ".json"],
    },

    target: "electron-renderer",

    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
            },
        ],
    },
};
