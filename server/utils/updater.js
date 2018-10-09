const { dialog, app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const isDev = require("electron-is-dev");
const baseLogger = require("./logger");

autoUpdater.autoDownload = false;

const logger = baseLogger.child("binaries");

logger.debug("[UPDATER]: isDev", isDev);

const MANUAL_UPDATE_CHECK = "MANUAL_UPDATE_CHECK";
const AUTO_UPDATE_CHECK = "AUTO_UPDATE_CHECK";

const updaterManager = () => {
    let menu;
    let isManual = false;

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
        isManual = true;
        autoUpdater.checkForUpdates();
    };

    autoUpdater.on("error", (error) => {
        logger.error("[UPDATER]:", error);
        if (!menu) {
            return;
        }
        isManual = false;
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
        logger.debug("[UPDATER]: Update not found");
        if (isManual) {
            dialog.showMessageBox({
                title: "Update was not found",
                message: "There is no update available. Your wallet application is up to date.",
            });
            isManual = false;
        }
        menu.enabled = true;
        menu = null;
    });

    autoUpdater.on("update-available", () => {
        logger.debug("[UPDATER]: Update found");
        isManual = false;
        dialog.showMessageBox({
            type: "info",
            title: "Update the LightningPeach wallet",
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
        logger.debug("[UPDATER]: Update downloaded");
        app.removeAllListeners("window-all-closed");
        const browserWindows = BrowserWindow.getAllWindows();
        browserWindows.forEach((browserWindow) => {
            browserWindow.removeAllListeners("close");
        });
        autoUpdater.autoInstallOnAppQuit = true;
        dialog.showMessageBox({
            title: "Update is downloaded",
            message: process.platform === "darwin" ? "Update is downloaded. Quit the application to update."
                : "Update is downloaded. The wallet application will be closed for updating.",
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
