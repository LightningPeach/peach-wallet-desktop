import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, helpers } from "additional";
import History from "components/history";
import BalanceWithMeasure from "components/common/balance-with-measure";
import { filterTypes } from "modules/filter";
import { appOperations } from "modules/app";
import Ellipsis from "components/common/ellipsis";
import BlocksLoader from "components/ui/blocks_loader";
import moment from "moment/moment";

const compare = (a, b) => !a ? -1 : !b ? 1 : a > b ? 1 : a < b ? -1 : 0;

class OnchainHistory extends Component {
    getHistoryHeader = () => [
        {
            Header: <span className="sortable">Name of payment</span>,
            accessor: "name",
            className: "name",
            sortMethod: (a, b) => compare(
                a.props.children.toLowerCase(),
                b.props.children.toLowerCase(),
            ),
            width: 164,
        },
        {
            Header: <span className="">Amount</span>,
            accessor: "amount",
            className: "amount",
            sortable: false,
            width: 145,
        },
        {
            Header: <span className="sortable">To</span>,
            accessor: "to",
            className: "to",
            sortable: false,
            width: 156,
        },
        {
            Header: <span className="sortable">Confirmations</span>,
            accessor: "time",
            className: "time",
            sortable: false,
            width: 157,
        },
        {
            Header: <span>Transaction ID</span>,
            accessor: "tid",
            className: "tid",
            sortable: false,
            width: 198,
        },
        {
            Header: <span className="sortable">Date</span>,
            accessor: "date",
            className: "date",
            sortMethod: (a, b) => compare(
                a.props.dateTime,
                b.props.dateTime,
            ),
            width: 120,
        },
    ];

    getHistoryData = () => {
        const { dispatch, lightningID, filter } = this.props;
        return this.props.history
            .map((item) => {
                const tempAddress = item.to !== lightningID ? item.to : "me";
                const [ymd, hms] = helpers.formatDate(item.date).split(" ");
                return {
                    ...item,
                    hms,
                    tempAddress,
                    ymd,
                };
            })
            .filter((item) => {
                const {
                    type, date, search, time, price,
                } = filter;

                const searchCheck = item.name.toLowerCase().includes(search.toLowerCase())
                    || item.tempAddress.toLowerCase().includes(search.toLowerCase());

                const typeCheck = !(
                    (type === filterTypes.TYPE_PAYMENT_INCOMING && item.amount < 0)
                    || (type === filterTypes.TYPE_PAYMENT_OUTCOMING && item.amount > 0)
                );

                let amountCheck;
                if (!price.from && !price.to) {
                    amountCheck = true;
                } else if (price.currency === "USD") {
                    amountCheck = !(
                        (price.from && dispatch(appOperations.convertUsdToSatoshi(price.from)) > Math.abs(item.amount))
                        || (price.to && dispatch(appOperations.convertUsdToSatoshi(price.to)) < Math.abs(item.amount))
                    );
                } else {
                    amountCheck = !(
                        (price.from && dispatch(appOperations.convertToSatoshi(price.from)) > Math.abs(item.amount))
                        || (price.to && dispatch(appOperations.convertToSatoshi(price.to)) < Math.abs(item.amount))
                    );
                }

                const mDate = moment(item.date);
                const dateCheck = !(date.from || date.to)
                    || !((date.from && date.from.isAfter(mDate, "day"))
                        || (date.to && date.to.isBefore(mDate, "day")));

                let timeCheck = true;
                const hms = (mDate.hours() * 60) + mDate.minutes();
                if (time.from.minutes && time.from.hours) {
                    const from = moment(`${time.from.hours}:${time.from.minutes} ${time.from.meridiem}`, "HH:mm a");
                    if ((from.hours() * 60) + from.minutes() > hms) {
                        timeCheck = false;
                    }
                }
                if (time.to.minutes && time.to.hours) {
                    const to = moment(`${time.to.hours}:${time.to.minutes} ${time.to.meridiem}`, "HH:mm a");
                    if ((to.hours() * 60) + to.minutes() < hms) {
                        timeCheck = false;
                    }
                }
                return searchCheck && typeCheck && amountCheck && dateCheck && timeCheck;
            })
            .map((item, key) => {
                const address = (
                    <span
                        onClick={() => {
                            if (helpers.hasSelection()) return;
                            if (item.tempAddress !== "-") {
                                analytics.event({ action: "History address", category: "Onchain", label: "Copy" });
                                dispatch(appOperations.copyToClipboard(item.to));
                            }
                        }}
                        title={item.tempAddress}
                    >
                        {item.tempAddress}
                    </span>
                );
                const tid = (
                    <span
                        onClick={() => {
                            if (helpers.hasSelection()) return;
                            analytics.event({ action: "History transaction hash", category: "Onchain", label: "Copy" });
                            dispatch(appOperations.copyToClipboard(item.tx_hash));
                        }}
                        title={item.tx_hash}
                    >
                        {item.tx_hash}
                    </span>
                );
                return {
                    amount: <BalanceWithMeasure satoshi={item.amount} />,
                    date: (
                        <span dateTime={item.date}>
                            <span className="date__ymd">{item.ymd}</span>
                            <span className="date__hms">{item.hms}</span>
                        </span>
                    ),
                    name: <Ellipsis>{item.name}</Ellipsis>,
                    tid: <Ellipsis>{tid}</Ellipsis>,
                    time: <BlocksLoader
                        class={item.status === "pending" ? "pending" : "sended"}
                        countBlocks={item.num_confirmations}
                    />,
                    to: <Ellipsis>{address}</Ellipsis>,
                };
            });
    };

    render() {
        return (
            <History
                key={3}
                columns={this.getHistoryHeader()}
                data={this.getHistoryData()}
                defaultSorted={[
                    {
                        desc: true,
                        id: "date",
                    },
                ]}
                source={filterTypes.FILTER_ONCHAIN}
                title="Onchain payments history"
                filters={filterTypes.FILTER_KIND_LIST}
            />
        );
    }
}

OnchainHistory.propTypes = {
    dispatch: PropTypes.func.isRequired,
    filter: PropTypes.shape(),
    history: PropTypes.arrayOf(PropTypes.shape({
        amount: PropTypes.number,
        block_hash: PropTypes.string,
        block_height: PropTypes.number,
        date: PropTypes.instanceOf(Date).isRequired,
        name: PropTypes.string.isRequired,
        num_confirmations: PropTypes.number,
        status: PropTypes.string.isRequired,
        to: PropTypes.string.isRequired,
        total_fees: PropTypes.number,
        tx_hash: PropTypes.string,
    })).isRequired,
    lightningID: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    filter: state.filter.onchain,
    history: state.onchain.history,
    lightningID: state.account.lightningID,
});

export default connect(mapStateToProps)(OnchainHistory);
