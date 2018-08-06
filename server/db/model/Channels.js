class Channels {
    constructor(fundingTxid, name, status, blockHeight) {
        this.fundingTxid = fundingTxid;
        this.name = name;
        this.status = status;
        this.blockHeight = blockHeight;
    }
}

module.exports = {
    Channels,
};
