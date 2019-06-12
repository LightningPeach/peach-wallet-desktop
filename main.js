const {
    app,
    Menu,
    BrowserWindow,
    ipcMain,
    Notification,
} = require("electron");
const path = require("path");
const url = require("url");
const baseLogger = require("./server/utils/logger");
const contextMenu = require("./server/utils/context-menu");
const server = require("./server/ipc");
const settings = require("./server/settings");
const helpers = require("./server/utils/helpers");
const { updaterManager } = require("./server/utils/updater");

const APP_ICON = path.join(__dirname, "public", "app_icons", "png", "256x256.png");
const logger = baseLogger.child("electron");
const updater = updaterManager();

let mainWindow = null;
let notification = null;

let deepLinkUrl;

const template = [
    {
        label: "Peach Wallet",
        submenu: [
            { label: "Hide", accelerator: "CmdOrCtrl+H", role: "hide" },
            { label: "Minimize", accelerator: "CmdOrCtrl+M", role: "minimize" },
            { accelerator: "CmdOrCtrl+F", role: "togglefullscreen" },
            { type: "separator" },
            { label: "Quit Peach Wallet", accelerator: "CmdOrCtrl+Q", role: "quit" },
        ],
    },
    {
        label: "Edit",
        submenu: [
            { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
            { label: "Select all", accelerator: "CmdOrCtrl+A", role: "selectall" },
            { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
            { label: "Redo", accelerator: "CmdOrCtrl+Shift+Z", role: "redo" },
        ],
    },
    {
        label: "Develop",
        submenu: [
            {
                label: "DevTools",
                accelerator: "Alt+CommandOrControl+I",
                click() {
                    if (mainWindow) {
                        mainWindow.webContents.openDevTools();
                    }
                },
            },
        ],
    },
    {
        label: "About",
        submenu: [
            {
                label: "Check update", click: updater.manualCheckUpdate,
            },
        ],
    },
];

const defaultWindowSettings = {
    width: 1200,
    height: 800,
    minWidth: 352,
    minHeight: 650,
    center: true,
    resizable: true,
    autoHideMenuBar: true,
    icon: APP_ICON,
    show: false,
    webPreferences: {
        preload: path.join(__dirname, "preload.js"),
    },
};

contextMenu({
    showInspectElement: true,
    append: (menu, params) => [
        { label: "Select all", role: "selectall", visible: params.editFlags.canSelectAll },
    ],
});

const devTools = (window) => {
    if (process.env.NODE_ENV !== "spectron" && settings.get.backend.devMode) {
        window.webContents.openDevTools();
    }
};

const menu = Menu.buildFromTemplate(template);

const gotInstanceLock = app.requestSingleInstanceLock();

if (!gotInstanceLock) {
    app.quit();
}

function createMainWindow() {
    mainWindow = new BrowserWindow(defaultWindowSettings);
    mainWindow.webContents.isMain = true; // to check if this window is main in server.utils.helpers.ipcSend
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file:",
        slashes: true,
    }));
    devTools(mainWindow);
    mainWindow.setMenu(null);

    if (process.platform === "win32") {
        deepLinkUrl = process.argv.slice(1);
        helpers.ipcSend("handleUrlReceive", deepLinkUrl);
    }
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.maximize();
        mainWindow.show();
        mainWindow.focus();

        const isDefautLighningProtocol = app.isDefaultProtocolClient("lightning");
        helpers.ipcSend("isDefaultLightningApp", isDefautLighningProtocol);
        updater.init();
    });

    mainWindow.webContents.on("new-window", event => event.preventDefault());

    Menu.setApplicationMenu(menu);
}

app.on("ready", createMainWindow);

app.on("window-all-closed", () => {
    app.quit();
});

app.on("activate", () => {
    if (!mainWindow) {
        createMainWindow();
    }
});

app.on("browser-window-focus", () => {
    if (process.platform === "darwin") {
        app.dock.setBadge("");
    }
});

app.on("before-quit", async (e) => {
    e.preventDefault();
    await server.shutdown();
    app.exit();
});

app.on("open-url", (e, arg) => {
    e.preventDefault();
    deepLinkUrl = arg;
    helpers.ipcSend("handleUrlReceive", deepLinkUrl);
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
});

app.on("second-instance", (e, arg) => {
    if (process.platform === "win32") {
        deepLinkUrl = arg.slice(1);
        helpers.ipcSend("handleUrlReceive", deepLinkUrl);
    }

    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
});

ipcMain.on("showNotification", (event, sender) => {
    notification = new Notification({
        title: sender.title || "Peach Wallet",
        subtitle: sender.subtitle,
        body: sender.body,
        silent: sender.silent,
    });
    notification.show();
    if (!mainWindow.isFocused()) {
        if (process.platform === "darwin") {
            app.dock.setBadge("•");
        }
    }
});

process.on("unhandledRejection", (error) => {
    logger.error(error);
});

process.on("uncaughtException", (error) => {
    logger.error(error);
});

module.exports.getMainWindow = () => mainWindow;
