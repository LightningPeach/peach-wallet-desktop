import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, helpers } from "additional";
import { channelsOperations, channelsSelectors } from "modules/channels";
import History from "components/history";
import BalanceWithMeasure from "components/common/balance-with-measure";
import { appOperations } from "modules/app";
import { STREAM_INFINITE_TIME_VALUE } from "config/consts";
import Ellipsis from "components/common/ellipsis";

class RegularHistory extends Component {
    getHistoryHeader = () => ([
        {
            Header: <span className="sortable">Name of payment</span>,
            accessor: "name",
            sortMethod: (a, b, desc) => {
                const aa = a.props.children.toLowerCase();
                const bb = b.props.children.toLowerCase();
                if (a.props["data-pinned"] && b.props["data-pinned"]) {
                    return aa > bb ? 1 : aa < bb ? -1 : 0;
                } else if (a.props["data-pinned"] || b.props["data-pinned"]) {
                    if (desc) {
                        return a.props["data-pinned"] ? 1 : -1;
                    }
                    return a.props["data-pinned"] ? -1 : 1;
                }
                return aa > bb ? 1 : aa < bb ? -1 : 0;
            },
            width: 186,
        },
        {
            Header: <span className="">Amount</span>,
            accessor: "amount",
            sortable: false,
            width: 210,
        },
        {
            Header: <span className="sortable">Type</span>,
            accessor: "type",
            sortMethod: (a, b, desc) => {
                if (a.props["data-pinned"] || b.props["data-pinned"]) {
                    if (desc) {
                        return a.props["data-pinned"] ? 1 : -1;
                    }
                    return a.props["data-pinned"] ? -1 : 1;
                }
                const aa = a.props.children.toLowerCase();
                const bb = b.props.children.toLowerCase();
                return aa > bb ? 1 : aa < bb ? -1 : 0;
            },
            width: 109,
        },
        {
            Header: <span className="">To</span>,
            accessor: "to",
            sortable: false,
            width: 305,
        },
        {
            Header: <span className="sortable">Date</span>,
            accessor: "date",
            sortMethod: (a, b, desc) => {
                if (a.props["data-pinned"] && b.props["data-pinned"]) {
                    return a.props.dateTime > b.props.dateTime ? 1 : a.props.dateTime < b.props.dateTime ? -1 : 0;
                } else if (a.props["data-pinned"] || b.props["data-pinned"]) {
                    if (desc) {
                        return a.props["data-pinned"] ? 1 : -1;
                    }
                    return a.props["data-pinned"] ? -1 : 1;
                }
                return a.props.dateTime > b.props.dateTime ? 1 : a.props.dateTime < b.props.dateTime ? -1 : 0;
            },
            width: 170,
        },
    ]);

    getHistoryData = () => {
        const {
            dispatch, contacts, history, lightningID,
        } = this.props;
        let date;
        const paymentsData = history
            .filter(item => item.type !== "stream")
            .map((item, key) => {
                let tempAddress = null;
                date = new Date(parseInt(item.date, 10));
                contacts.forEach((contact) => {
                    if (contact.lightningID === item.lightningID) {
                        tempAddress = contact.name;
                    }
                });
                tempAddress = tempAddress || (item.lightningID !== lightningID ? item.lightningID : "me");
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
                const amount = item.type !== "stream" ?
                    <BalanceWithMeasure satoshi={item.amount} /> :
                    <span><BalanceWithMeasure satoshi={item.amount} /> / {item.parts} sec</span>;
                return {
                    amount,
                    date: (
                        <div dateTime={date}>
                            <span className="date__ymd">{ymd}</span>
                            <span className="date__hms">{hms}</span>
                        </div>
                    ),
                    name: <Ellipsis classList="history">{item.name}</Ellipsis>,
                    to: <Ellipsis>{address}</Ellipsis>,
                    type: <span>{item.type === "stream" ? "Stream" : "Regular"}</span>,
                };
            });

        return paymentsData;
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

RegularHistory.propTypes = {
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    dispatch: PropTypes.func.isRequired,
    history: PropTypes.arrayOf(PropTypes.shape).isRequired,
    lightningID: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    contacts: state.contacts.contacts,
    externalPaymentRequest: state.lightning.externalPaymentRequest,
    history: state.lightning.history,
    lightningID: state.account.lightningID,
    modalState: state.app.modalState,
});

export default connect(mapStateToProps)(RegularHistory);
