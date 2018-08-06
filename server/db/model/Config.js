class Config {
    constructor(lightningId, createChannelViewed, lightningPaymentViewed, activeMeasure) {
        this.lightningId = lightningId;
        this.createChannelViewed = createChannelViewed;
        this.lightningPaymentViewed = lightningPaymentViewed;
        this.activeMeasure = activeMeasure;
    }
}

module.exports = {
    Config,
};
