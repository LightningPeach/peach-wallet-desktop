class Onchain {
    constructor(
        txHash,
        name,
        timeStamp,
        address,
        status,
        amount,
        blockHash,
        numConfirmations,
        blockHeight,
        totalFees,
    ) {
        this.txHash = txHash;
        this.name = name;
        this.timeStamp = timeStamp;
        this.address = address;
        this.status = status;
        this.amount = amount;
        this.blockHash = blockHash;
        this.numConfirmations = numConfirmations;
        this.blockHeight = blockHeight;
        this.totalFees = totalFees;
    }
}

module.exports = {
    Onchain,
};
