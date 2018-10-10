import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, helpers } from "additional";
import { lightningOperations as operations } from "modules/lightning";
import { channelsOperations, channelsSelectors } from "modules/channels";
import History from "components/history";
import BalanceWithMeasure from "components/common/balance-with-measure";
import {
    streamPaymentOperations as streamOperations,
    streamPaymentTypes,
} from "modules/streamPayments";
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
            width: 140,
        },
        {
            Header: <span className="" />,
            accessor: "status",
            sortable: false,
            width: 80,
        },
        {
            Header: <span className="">Amount<br />(total)</span>,
            accessor: "amount",
            sortable: false,
            width: 127,
        },
        {
            Header: <span className="">Payments frequency</span>,
            accessor: "frequency",
            sortable: false,
            width: 107,
        },
        {
            Header: <span className="">Payments count</span>,
            accessor: "count",
            sortable: false,
            width: 102,
        },
        {
            Header: <span className="">To</span>,
            accessor: "to",
            sortable: false,
            width: 268,
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
            dispatch, contacts, history, lightningID, streams, isThereActiveChannel,
        } = this.props;
        streams.sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : 0);
        const activeStreamsData = streams.map((item, key) => {
            let tempAddress = item.lightningID;
            const date = new Date(parseInt(item.date, 10));
            let isActive = false;
            contacts.forEach((contact) => {
                if (contact.lightningID === item.lightningID) {
                    tempAddress = contact.name;
                }
            });
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
                    title={tempAddress}
                >
                    {tempAddress}
                </span>
            );
            let status;
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
                isActive = true;
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
                isActive = true;
            }
            const amount = item.currency === "BTC"
                ? (
                    <span>
                        <BalanceWithMeasure satoshi={item.price} />
                        <br />
                        (<BalanceWithMeasure satoshi={item.price * item.partsPaid} />)
                    </span>)
                : (
                    <span>
                        {item.price} USD
                        <br />
                        ({item.price * item.partsPaid} USD)
                    </span>);
            const count = (
                <span>
                    <span className="green">
                        {item.partsPaid}(+{item.partsPending})
                    </span> / {item.totalParts === STREAM_INFINITE_TIME_VALUE ? "∞" : item.totalParts}
                </span>);
            const [ymd, hms] = helpers.formatDate(date).split(" ");
            return {
                amount,
                count,
                date: (
                    <span dateTime={date} data-pinned={isActive}>
                        <span className="date__ymd">{ymd}</span>
                        <span className="date__hms">{hms}</span>
                    </span>
                ),
                frequency: <span>{item.delay}</span>,
                name: <Ellipsis data-pinned={isActive}>{item.name}</Ellipsis>,
                status: <span data-pinned={isActive}>{status}</span>,
                to: <Ellipsis>{address}</Ellipsis>,
            };
        });

        const finishedStreamsData = history
            .filter(item => item.type === "stream")
            .map((item, key) => {
                let tempAddress = null;
                const date = new Date(parseInt(item.date, 10));
                contacts.forEach((contact) => {
                    if (contact.lightningID === item.lightningID) {
                        tempAddress = contact.name;
                    }
                });
                tempAddress = tempAddress || (item.lightningID !== lightningID ? item.lightningID : "me");
                const amount = item.currency === "BTC"
                    ? (
                        <span>
                            <BalanceWithMeasure satoshi={item.amount} />
                            <br />
                            (<BalanceWithMeasure satoshi={item.amount * item.partsPaid} />)
                        </span>)
                    : (
                        <span>
                            {item.amount} USD
                            <br />
                            ({item.amount * item.partsPaid} USD)
                        </span>);
                const count = (
                    <span>
                        {item.partsPaid} / {item.totalParts === STREAM_INFINITE_TIME_VALUE ? "∞" : item.totalParts}
                    </span>);
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
                        title={tempAddress}
                    >
                        {tempAddress}
                    </span>
                );
                const [ymd, hms] = helpers.formatDate(date).split(" ");
                return {
                    amount,
                    count,
                    date: (
                        <div dateTime={date}>
                            <span className="date__ymd">{ymd}</span>
                            <span className="date__hms">{hms}</span>
                        </div>
                    ),
                    frequency: <span>{item.delay}</span>,
                    name: <Ellipsis classList="history">{item.name}</Ellipsis>,
                    status: <span>Finished</span>,
                    to: <Ellipsis>{address}</Ellipsis>,
                };
            });

        return [...activeStreamsData, ...finishedStreamsData];
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
    history: state.lightning.history,
    isThereActiveChannel: channelsSelectors.isThereActiveChannel(state),
    lightningID: state.account.lightningID,
    modalState: state.app.modalState,
    streams: state.streamPayment.streams,
});

export default connect(mapStateToProps)(RecurringHistory);
