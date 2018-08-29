class Config {
    constructor(lightningId, createChannelViewed, activeMeasure, systemNotifications) {
        this.lightningId = lightningId;
        this.createChannelViewed = createChannelViewed;
        this.activeMeasure = activeMeasure;
        this.systemNotifications = systemNotifications;
    }
}

module.exports = {
    Config,
};
