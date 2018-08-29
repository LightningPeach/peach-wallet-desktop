class Config {
    constructor(lightningId, createChannelViewed, activeMeasure, enableNotifications) {
        this.lightningId = lightningId;
        this.createChannelViewed = createChannelViewed;
        this.activeMeasure = activeMeasure;
        this.enableNotifications = enableNotifications;
    }
}

module.exports = {
    Config,
};
