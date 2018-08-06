const log4js = require("log4js");

/**
 * Setup logging system.
 * @param  {Object} [options]
 * @param  {String} [options.logLevel] Minimum logging threshold (default: info).
 * @param  {String} [options.logFolder] Log folder to write logs to.
 */
exports.init = (options) => {
    const { logFolder } = options;
    const level = options.logLevel || "INFO";
    const layout = {
        type: "basic",
        pattern: "[%d] [%p] [%z] %c - %X{caller}: %m",
    };
    const config = {
        appenders: {
            out: {
                type: "console",
                layout,
            },
            all: {
                type: "file",
                filename: `${logFolder}/all.log`,
                layout,
            },
            electron: {
                type: "file",
                filename: `${logFolder}/category/electron.log`,
                layout,
            },
            binaries: {
                type: "file",
                filename: `${logFolder}/category/binaries.log`,
                layout,
            },
            helpers: {
                type: "file",
                filename: `${logFolder}/category/helpers.log`,
                layout,
            },
            ipc: {
                type: "file",
                filename: `${logFolder}/category/ipc.log`,
                layout,
            },
            "[LIS]": {
                type: "file",
                filename: `${logFolder}/category/lis.log`,
                layout,
            },
        },
        categories: {
            default: { appenders: ["out", "all"], level },
            electron: { appenders: ["out", "electron"], level },
            binaries: { appenders: ["out", "binaries"], level },
            helpers: { appenders: ["out", "helpers"], level },
            ipc: { appenders: ["out", "ipc"], level },
            "[LIS]": { appenders: ["out", "[LIS]"], level },
        },
    };

    log4js.configure(config);
};

exports.child = (category) => {
    const logger = log4js.getLogger(category);
    logger.child = subCategory => exports.create(`${category}/${subCategory}`);

    return logger;
};
