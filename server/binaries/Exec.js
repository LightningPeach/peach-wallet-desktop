// ToDo: Make node (lnd + lis) works without wallet (e.g. blockchain monitoring)

const settings = require("../settings");
const fs = require("fs");
const path = require("path");
const { webContents } = require("electron");
const baseLogger = require("../utils/logger");

const logger = baseLogger.child("binaries");

class Exec {
    constructor() {
        this.process_name = null;
        this.pid_name = "pid.json";
        this.starting = false;
        this.manualStopped = false;
        this.handleExit = this.handleExit.bind(this);
    }

    async start() {
        const error = new Error("Function start() not implemented ");
        logger.error({ func: this.start }, `${this.process_name}`, error);
        throw error;
    }

    async handleExit(code, signal) {
        this.starting = false;
        if (!this.manualStopped) {
            try {
                this._savePid(-1);
                // console.log(await this.start());
                // webContents.getAllWebContents()[0].send("lnd-up");
            } catch (e) {
                logger.error({ func: this.handleExit }, `${this.process_name}`, e);
            }
        }
    }

    async stop() {
        if (this.pid === -1) {
            return { ok: true };
        }
        try {
            this.manualStopped = true;
            process.kill(this.pid);
            this._savePid(-1);
            if (this.shoudClearData && typeof this._clearData === "function") {
                await this._clearData();
            }
            return { ok: true };
        } catch (error) {
            return { ok: false, error };
        }
    }

    _savePid(pid) {
        logger.info(`Saving pid ${pid} to ${path.join(settings.get.dataPath, this.pid_name)}`);
        const filePath = path.join(settings.get.dataPath, this.pid_name);
        fs.writeFileSync(filePath, JSON.stringify({ pid }));
        this.pid = pid;
    }

    _getPid() {
        try {
            const data = fs.readFileSync(path.join(settings.get.dataPath, this.pid_name), "utf8");
            const pid = JSON.parse(data);
            logger.info(`Received pid ${pid.pid} from ${path.join(settings.get.dataPath, this.pid_name)}`);
            return pid.pid;
        } catch (err) {
            return -1;
        }
    }
}

module.exports = Exec;
