const { dialog, app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const isDev = require("electron-is-dev");
const baseLogger = require("./logger");

autoUpdater.autoDownload = false;

const logger = baseLogger.child("binaries");

logger.debug("[UPDATER]: isDev", isDev);

const updaterManager = () => {
    let menu;

    const init = () => {
        logger.debug("[UPDATER]: Init");
        autoUpdater.checkForUpdates();
        const oneDay = 24 * 60 * 60 * 1000;
        setInterval(() => autoUpdater.checkForUpdates(), oneDay);
    };

    const manualCheckUpdate = (menuItem) => {
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
                title: "Update was not found",
                message: "There is no update available. Your wallet application is up to date.",
            });
        } else {
            dialog.showErrorBox("Error: ", !error ? "unknown" : (error.stack).toString());
        }
        menu.enabled = true;
        menu = null;
    });

    autoUpdater.on("update-not-available", () => {
        logger.debug("[UPDATER]: Update is not available");
        if (menu) {
            dialog.showMessageBox({
                title: "Update was not found",
                message: "There is no update available. Your wallet application is up to date.",
            });
        }
        menu.enabled = true;
        menu = null;
    });

    autoUpdater.on("update-available", () => {
        logger.debug("[UPDATER]: Update is found");
        dialog.showMessageBox({
            type: "info",
            title: "Update the Peach Wallet",
            message: "New update is available. Update now?",
            buttons: ["Update now", "Remind me later"],
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
        logger.debug("[UPDATER]: Update is downloaded");
        app.removeAllListeners("window-all-closed");
        const browserWindows = BrowserWindow.getAllWindows();
        browserWindows.forEach((browserWindow) => {
            browserWindow.removeAllListeners("close");
        });
        dialog.showMessageBox({
            title: "Update is downloaded",
            message: "Update is downloaded. The wallet application will be closed for updating.",
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
