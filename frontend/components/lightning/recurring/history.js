import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Tooltip from "rc-tooltip";
import { analytics, helpers } from "additional";
import { lightningOperations as operations } from "modules/lightning";
import { channelsOperations, channelsSelectors } from "modules/channels";
import History from "components/history";
import BalanceWithMeasure from "components/common/balance-with-measure";
import {
    streamPaymentOperations as streamOperations,
    streamPaymentTypes,
} from "modules/streamPayments";
import { filterTypes } from "modules/filter";
import { appOperations } from "modules/app";
import { STREAM_INFINITE_TIME_VALUE } from "config/consts";
import Ellipsis from "components/common/ellipsis";

const compare = (a, b, aPinned, bPinned, desc) => {
    if (aPinned && bPinned) {
        return !a ? -1 : !b ? 1 : a > b ? 1 : a < b ? -1 : 0;
    } else if (aPinned || bPinned) {
        if (desc) {
            return aPinned ? 1 : -1;
        }
        return aPinned ? -1 : 1;
    }
    return !a ? -1 : !b ? 1 : a > b ? 1 : a < b ? -1 : 0;
};

class RecurringHistory extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tooltips: {
                amount: [
                    "Total amount for the whole recurring payment",
                    "and price per singe time unit within the payment.",
                ],
                count: [
                    "Current count of paid (confirmed) plus pending",
                    "(finished but not confirmed) payments relative",
                    "to total amount of payments.",
                ],
            },
        };
    }

    getHistoryHeader = () => ([
        {
            Header: <span className="sortable">Name of payment</span>,
            accessor: "name",
            sortMethod: (a, b, desc) => compare(
                a.props.children.toLowerCase(),
                b.props.children.toLowerCase(),
                a.props["data-pinned"],
                b.props["data-pinned"],
                desc,
            ),
            width: 165,
        },
        {
            Header: <span className="" />,
            accessor: "status",
            sortable: false,
            width: 65,
        },
        {
            Header: (
                <span className="tooltip-wp">
                    Amount
                    <Tooltip
                        placement="right"
                        overlay={helpers.formatMultilineText(this.state.tooltips.amount)}
                        trigger="hover"
                        arrowContent={
                            <div className="rc-tooltip-arrow-inner" />
                        }
                        prefixCls="rc-tooltip__small rc-tooltip"
                        mouseLeaveDelay={0}
                    >
                        <i className="form-label__icon form-label__icon--info" />
                    </Tooltip>
                </span>),
            accessor: "amount",
            sortable: false,
            width: 120,
        },
        {
            Header: <span className="">Frequency</span>,
            accessor: "frequency",
            sortable: false,
            width: 105,
        },
        {
            Header: (
                <span className="tooltip-wp">
                    Count
                    <Tooltip
                        placement="right"
                        overlay={helpers.formatMultilineText(this.state.tooltips.count)}
                        trigger="hover"
                        arrowContent={
                            <div className="rc-tooltip-arrow-inner" />
                        }
                        prefixCls="rc-tooltip__small rc-tooltip"
                        mouseLeaveDelay={0}
                    >
                        <i className="form-label__icon form-label__icon--info" />
                    </Tooltip>
                </span>),
            accessor: "count",
            sortable: false,
            width: 105,
        },
        {
            Header: <span className="">To</span>,
            accessor: "to",
            sortable: false,
            width: 265,
        },
        {
            Header: <span className="sortable">Date & Time</span>,
            accessor: "date",
            sortMethod: (a, b, desc) => compare(
                a.props.dateTime,
                b.props.dateTime,
                a.props["data-pinned"],
                b.props["data-pinned"],
                desc,
            ),
            width: 115,
        },
    ]);

    getHistoryData = () => {
        const {
            dispatch, contacts, history, lightningID, streams, isThereActiveChannel, filter,
        } = this.props;
        return [
            ...streams.sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : 0),
            ...history.filter(item => item.type === "stream"),
        ]
            .map((item) => {
                let tempAddress = item.lightningID;
                const isActive = item.status === streamPaymentTypes.STREAM_PAYMENT_PAUSED
                    || item.status === streamPaymentTypes.STREAM_PAYMENT_STREAMING;
                contacts.forEach((contact) => {
                    if (contact.lightningID === item.lightningID) {
                        tempAddress = contact.name;
                    }
                });
                tempAddress = tempAddress || (item.lightningID !== lightningID ? item.lightningID : "me");
                const date = new Date(parseInt(item.date, 10));
                const [ymd, hms] = helpers.formatDate(date).split(" ");
                return {
                    ...item,
                    date,
                    hms,
                    isActive,
                    tempAddress,
                    ymd,
                };
            })
            .filter((item) => {
                const { search } = filter;
                const searchCheck = item.name.toLowerCase().includes(search.toLowerCase())
                    || item.tempAddress.toLowerCase().includes(search.toLowerCase());
                return searchCheck;
            })
            .map((item, key) => {
                console.log(item);
                const address = (
                    <span
                        onClick={() => {
                            if (item.lightningID !== "-") {
                                if (helpers.hasSelection()) return;
                                analytics.event({
                                    action: "History address",
                                    category: "Lightning",
                                    label: "Copy",
                                });
                                dispatch(appOperations.copyToClipboard(item.lightningID));
                            }
                        }}
                        title={item.tempAddress}
                    >
                        {item.tempAddress}
                    </span>
                );
                let status = "";
                if (item.status === streamPaymentTypes.STREAM_PAYMENT_PAUSED) {
                    status = (
                        <Fragment>
                            <span
                                className="start"
                                onClick={() => {
                                    analytics.event({
                                        action: "Stream",
                                        category: "Lightning",
                                        label: "Play",
                                    });
                                    if (!isThereActiveChannel) {
                                        dispatch(operations.channelWarningModal());
                                        return;
                                    }
                                    dispatch(streamOperations.startStreamPayment(item.streamId));
                                }}
                            />
                            <span
                                className="stop"
                                onClick={() => {
                                    analytics.event({
                                        action: "Stream",
                                        category: "Lightning",
                                        label: "Stop",
                                    });
                                    dispatch(streamOperations.finishStreamPayment(item.streamId));
                                }}
                            />
                        </Fragment>
                    );
                } else if (item.status === streamPaymentTypes.STREAM_PAYMENT_STREAMING) {
                    status = (
                        <span
                            className="pause"
                            onClick={() => {
                                analytics.event({
                                    action: "Stream",
                                    category: "Lightning",
                                    label: "Pause",
                                });
                                dispatch(streamOperations.pauseStreamPayment(item.streamId));
                            }}
                        />
                    );
                }
                const amount = item.currency === "BTC"
                    ? (
                        <span>
                            <BalanceWithMeasure satoshi={item.price * item.partsPaid} />
                            <br />
                            (<BalanceWithMeasure satoshi={item.price} />)
                        </span>)
                    : (
                        <span>
                            {helpers.noExponents(parseFloat((item.price * item.partsPaid).toFixed(8)))} USD
                            <br />
                            ({item.price} USD)
                        </span>);
                const count = item.status !== streamPaymentTypes.STREAM_PAYMENT_FINISHED
                    && item.status !== "end"
                    ? (
                        <span>
                            <span
                                className={item.status === streamPaymentTypes.STREAM_PAYMENT_STREAMING ? "green" : ""}
                            >
                                {item.partsPaid}
                                {item.partsPending > 0 && `+${item.partsPending}`}
                            </span> / {item.totalParts === STREAM_INFINITE_TIME_VALUE ? "∞" : item.totalParts}
                        </span>)
                    : (
                        <span>
                            {item.partsPaid} / {item.totalParts === STREAM_INFINITE_TIME_VALUE ? "∞" : item.totalParts}
                        </span>);
                return {
                    amount,
                    count,
                    date: (
                        <span dateTime={item.date} data-pinned={item.isActive}>
                            <span className="date__ymd">{item.ymd}</span>
                            <span className="date__hms">{item.hms}</span>
                        </span>
                    ),
                    frequency: <span>{helpers.formatTimeRange(item.delay)}</span>,
                    name: <Ellipsis data-pinned={item.isActive}>{item.name}</Ellipsis>,
                    status: <span data-pinned={item.isActive}>{status}</span>,
                    to: <Ellipsis>{address}</Ellipsis>,
                };
            });
    };

    render() {
        return (
            <History
                columns={this.getHistoryHeader()}
                data={this.getHistoryData()}
                defaultSorted={[
                    {
                        desc: true,
                        id: "date",
                    },
                ]}
                source={filterTypes.FILTER_RECURRING}
                title="Recurring payments history"
                filters={[
                    filterTypes.FILTER_KIND_SEARCH,
                ]}
            />
        );
    }
}

RecurringHistory.propTypes = {
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    dispatch: PropTypes.func.isRequired,
    filter: PropTypes.shape(),
    history: PropTypes.arrayOf(PropTypes.shape).isRequired,
    isThereActiveChannel: PropTypes.bool,
    lightningID: PropTypes.string.isRequired,
    streams: PropTypes.arrayOf(PropTypes.shape({
        comment: PropTypes.string,
        date: PropTypes.number.isRequired,
        delay: PropTypes.number,
        description: PropTypes.string,
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        partsPaid: PropTypes.number.isRequired,
        price: PropTypes.number.isRequired,
        status: PropTypes.string.isRequired,
        totalParts: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })).isRequired,
};

const mapStateToProps = state => ({
    contacts: state.contacts.contacts,
    externalPaymentRequest: state.lightning.externalPaymentRequest,
    filter: state.filter.recurring,
    history: state.lightning.history,
    isThereActiveChannel: channelsSelectors.isThereActiveChannel(state),
    lightningID: state.account.lightningID,
    modalState: state.app.modalState,
    streams: state.streamPayment.streams,
});

export default connect(mapStateToProps)(RecurringHistory);
