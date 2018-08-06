const {
    app, Menu, ipcMain, BrowserWindow,
} = require("electron");
const path = require("path");
const url = require("url");
const baseLogger = require("./server/utils/logger");
const contextMenu = require("./server/utils/context-menu");
const server = require("./server/ipc");
const settings = require("./server/settings");
const helpers = require("./server/utils/helpers");

const APP_ICON = path.join(__dirname, "public", "app_icons", "png", "256x256.png");
const logger = baseLogger.child("electron");

let mainWindow = null;
let agreementWindow = null;

let deepLinkUrl;

const template = [
    {
        label: app.getName(),
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

const isSecondInstance = app.makeSingleInstance((argv) => {
    if (process.platform === "win32") {
        deepLinkUrl = argv.slice(1);
        helpers.ipcSend("handleUrlReceive", deepLinkUrl);
    }

    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    }
});

if (isSecondInstance) {
    app.quit();
}

function createWindow() {
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
    });

    mainWindow.webContents.on("new-window", event => event.preventDefault());

    Menu.setApplicationMenu(menu);
}

const checkAgreement = async () => {
    if (settings.get.agreement.eula) {
        createWindow();
        return;
    }
    agreementWindow = new BrowserWindow(defaultWindowSettings);
    agreementWindow.webContents.isMain = true; // to check if this window is main in server.utils.helpers.ipcSend

    agreementWindow.loadURL(url.format({
        pathname: path.join(__dirname, "agreement.html"),
        protocol: "file:",
        slashes: true,
    }));
    devTools(agreementWindow);
    agreementWindow.setMenu(null);
    agreementWindow.maximize();
    agreementWindow.show();

    agreementWindow.webContents.on("close", () => {
        if (settings.get.agreement.eula) {
            createWindow();
        }
    });
};

app.on("ready", checkAgreement);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (!mainWindow && !agreementWindow) {
        checkAgreement();
    }
});

app.on("before-quit", async (e) => {
    e.preventDefault();
    await server.shutdown();
    app.exit();
});

app.on("open-url", (event, arg) => {
    event.preventDefault();
    deepLinkUrl = arg;
    helpers.ipcSend("handleUrlReceive", deepLinkUrl);
});

ipcMain.on("setDefaultLightningApp", () => {
    app.setAsDefaultProtocolClient("lightning");
});

process.on("unhandledRejection", (error) => {
    logger.error(error);
});

process.on("uncaughtException", (error) => {
    logger.error(error);
});
