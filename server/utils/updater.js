const { dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const isDev = require("electron-is-dev");
const baseLogger = require("./logger");

autoUpdater.autoDownload = false;

const logger = baseLogger.child("binaries");

logger.debug("[UPDATER]: isDev", isDev);

const updaterManager = (window) => {
    const mainWindow = window;

    let menu;

    const init = () => {
        logger.debug("[UPDATER]: Init");
        autoUpdater.checkForUpdates();
        const oneHour = 60 * 60 * 1000;
        setInterval(() => autoUpdater.checkForUpdates(), oneHour);
    };

    const manualCheckUpdate = (menuItem, focusedWindow, event) => {
        logger.debug("[UPDATER]: Click on update from menu");
        menu = menuItem;
        menu.enabled = false;
        autoUpdater.checkForUpdates();
    };

    autoUpdater.on("error", (error) => {
        logger.error("[UPDATER]:", error);
        if (!menu) {
            return;
        }
        if (error.statusCode === 404) {
            dialog.showMessageBox({
                title: "Update not found",
                message: "Update not found",
            });
        } else {
            dialog.showErrorBox("Error: ", !error ? "unknown" : (error.stack).toString());
        }
        menu.enabled = true;
        menu = null;
    });

    autoUpdater.on("update-not-available", () => {
        logger.debug("[UPDATER]: Update not found");
        dialog.showMessageBox({
            title: "Update not found",
            message: "Update not found",
        });
        menu.enabled = true;
        menu = null;
    });

    autoUpdater.on("update-available", () => {
        logger.debug("[UPDATER]: Update found");
        dialog.showMessageBox({
            type: "info",
            title: "Update found",
            message: "Found update, do you want to update now?",
            buttons: ["Now", "Later"],
        }, (buttonIndex) => {
            if (buttonIndex === 0) {
                logger.debug("[UPDATER]: User accept to update");
                autoUpdater.downloadUpdate();
            } else if (menu) {
                menu.enabled = true;
                menu = null;
            } else {
                logger.debug("[UPDATER]: User not accept to update");
            }
        });
    });

    autoUpdater.on("update-downloaded", () => {
        logger.debug("[UPDATER]: Update downloaded");
        dialog.showMessageBox({
            title: "Update downloaded",
            message: "Update downloaded, application will quit for update.",
        }, () => {
            logger.debug("[UPDATER]: Update will be installed");
            setImmediate(() => autoUpdater.quitAndInstall());
        });
    });

    if (isDev) {
        return Object.freeze({
            init: () => ({}),
            manualCheckUpdate: () => ({}),
        });
    }

    return Object.freeze({
        init,
        manualCheckUpdate,
    });
};

module.exports.updaterManager = updaterManager;
