const fs = require("fs");
const { join } = require("path");
const merge = require("lodash/merge");
const baseLogger = require("../utils/logger");

const logger = baseLogger.child("electron");
const PEACH = "settings.peach.json";
const PEACH_LOCAL = "settings.peach.local.json";

/**
 * @param {string} filePath
 * @returns {object}
 */
const loadJson = filePath => JSON.parse(fs.readFileSync(filePath).toString());

module.exports = (appPath) => {
    const peachFile = join(appPath, PEACH);
    const peachLocalFile = join(appPath, PEACH_LOCAL);
    let content;
    let settings = { analytics: {}, peach: {} };
    if (fs.existsSync(peachFile)) {
        content = loadJson(peachFile);
        logger.info("[SETTINGS] - settings-peach", { peachFile, content });
        settings = merge(settings, content);
    }
    if (fs.existsSync(peachLocalFile)) {
        content = loadJson(peachLocalFile);
        logger.info("[SETTINGS] - settings-peach", { peachLocalFile, content });
        settings = merge(settings, content);
    }
    return settings;
};
