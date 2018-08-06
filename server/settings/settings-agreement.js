const fs = require("fs");
const ini = require("ini");
const merge = require("lodash/merge");
const { join } = require("path");
const baseLogger = require("../utils/logger");

const logger = baseLogger.child("electron");
const settingsFiles = ["agreement.ini"];

/**
 * @param {string} filePath
 * @returns {object}
 */
const loadIni = filePath => ini.parse(fs.readFileSync(filePath, "utf-8"));

module.exports = (dataPath) => {
    let settings = {};
    settingsFiles.forEach((file) => {
        const filePath = join(dataPath, file);
        const fileExists = fs.existsSync(filePath);
        logger.info("[SETTINGS] - settings-agreement", { file, fileExists });
        if (fileExists) {
            const content = loadIni(filePath);
            logger.info("[SETTINGS] - settings-agreement", { file, content });
            settings = merge(settings, content);
        }
    });
    return settings;
};
