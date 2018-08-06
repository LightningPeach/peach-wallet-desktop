const electron = require("electron");

const webContents = win => win.webContents || win.getWebContents();

function decorateMenuItem(menuItem) {
    const item = menuItem;
    return (opts = {}) => {
        if (opts.transform && !opts.click) {
            item.transform = opts.transform;
        }

        return item;
    };
}

function delUnusedElements(menuTpl) {
    let notDeletedPrevEl;
    return menuTpl.filter(el => el.visible !== false).filter((el, i, arr) => {
        const toDelete = el.type === "separator" &&
            (!notDeletedPrevEl || i === arr.length - 1 || arr[i + 1].type === "separator");
        notDeletedPrevEl = toDelete ? notDeletedPrevEl : el;
        return !toDelete;
    });
}

function create(win, opts) {
    webContents(win).on("context-menu", (e, props) => {
        if (typeof opts.shouldShowMenu === "function" && opts.shouldShowMenu(e, props) === false) {
            return;
        }
        const newProps = props;
        const { editFlags } = newProps;
        const hasText = newProps.selectionText.trim().length > 0;
        const can = type => editFlags[`can${type}`] && hasText;

        const defaultActions = {
            cut: decorateMenuItem({
                id: "cut",
                label: "Cut",
                enabled: can("Cut"),
                visible: newProps.isEditable,
                click(menuItem) {
                    newProps.selectionText = menuItem.transform ?
                        menuItem.transform(newProps.selectionText) :
                        newProps.selectionText;
                    electron.clipboard.writeText(newProps.selectionText);
                    win.webContents.delete();
                },
            }),
            copy: decorateMenuItem({
                id: "copy",
                label: "Copy",
                enabled: can("Copy"),
                visible: newProps.isEditable || hasText,
                click(menuItem) {
                    newProps.selectionText = menuItem.transform ?
                        menuItem.transform(newProps.selectionText) :
                        newProps.selectionText;
                    electron.clipboard.writeText(newProps.selectionText);
                },
            }),
            paste: decorateMenuItem({
                id: "paste",
                label: "Paste",
                enabled: editFlags.canPaste,
                visible: newProps.isEditable,
                click(menuItem) {
                    let clipboardContent;
                    clipboardContent = electron.clipboard.readText(newProps.selectionText);
                    clipboardContent = menuItem.transform ?
                        menuItem.transform(clipboardContent) :
                        clipboardContent;
                    win.webContents.insertText(clipboardContent);
                },
            }),
            inspect: decorateMenuItem({
                id: "inspect",
                label: "Inspect Element",
                click() {
                    win.inspectElement(newProps.x, newProps.y);
                    if (webContents(win).isDevToolsOpened()) {
                        webContents(win).devToolsWebContents.focus();
                    }
                },
            }),
            separator: decorateMenuItem({
                type: "separator",
            }),
        };

        let menuTpl = [
            defaultActions.separator(),
            defaultActions.cut(),
            defaultActions.copy(),
            defaultActions.paste(),
            defaultActions.separator(),
        ];

        if (opts.menu) {
            menuTpl = opts.menu(defaultActions, newProps, win);
        }

        if (opts.prepend) {
            const result = opts.prepend(defaultActions, newProps, win);

            if (Array.isArray(result)) {
                menuTpl.unshift(...result);
            }
        }

        if (opts.append) {
            const result = opts.append(defaultActions, newProps, win);

            if (Array.isArray(result)) {
                menuTpl.push(...result);
            }
        }

        if (
            opts.showInspectElement ||
            (opts.showInspectElement !== false && process.env.NODE_ENV !== "spectron")
        ) {
            menuTpl.push(defaultActions.separator(), defaultActions.inspect(), defaultActions.separator());
        }

        if (opts.labels) {
            for (const menuItem of menuTpl) { // eslint-disable-line
                if (opts.labels[menuItem.id]) {
                    menuItem.label = opts.labels[menuItem.id];
                }
            }
        }

        menuTpl = delUnusedElements(menuTpl);

        if (menuTpl.length > 0) {
            const menu = (electron.remote ? electron.remote.Menu : electron.Menu).buildFromTemplate(menuTpl);
            menu.popup(electron.remote ? electron.remote.getCurrentWindow() : win);
        }
    });
}

module.exports = (opts = {}) => {
    if (opts.window) {
        const win = opts.window;
        const wc = webContents(win);

        if (wc === undefined) {
            win.addEventListener("dom-ready", () => {
                create(win, opts);
            }, { once: true });
            return;
        }
        create(win, opts);
        return;
    }

    (electron.BrowserWindow || electron.remote.BrowserWindow).getAllWindows().forEach(win => create(win, opts));

    (electron.app || electron.remote.app).on("browser-window-created", (e, win) => {
        create(win, opts);
    });
};
