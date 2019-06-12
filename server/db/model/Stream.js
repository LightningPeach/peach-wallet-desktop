class Stream {
    constructor(
        id, name, totalParts, partsPaid,
        price, totalAmount, memo, lightningID,
        date, lastPayment, status, delay,
        currency,
    ) {
        this.id = id;
        this.name = name;
        this.totalParts = totalParts;
        this.partsPaid = partsPaid;
        this.price = price;
        this.totalAmount = totalAmount;
        this.memo = memo;
        this.lightningID = lightningID;
        this.date = date;
        this.lastPayment = lastPayment;
        this.status = status;
        this.delay = delay;
        this.currency = currency;
    }
}

module.exports = {
    Stream,
};
