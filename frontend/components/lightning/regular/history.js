import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, helpers } from "additional";
import History from "components/history";
import BalanceWithMeasure from "components/common/balance-with-measure";
import { appOperations } from "modules/app";
import Ellipsis from "components/common/ellipsis";

const compare = (a, b) => !a ? -1 : !b ? 1 : a > b ? 1 : a < b ? -1 : 0;

class RegularHistory extends Component {
    getHistoryHeader = () => ([
        {
            Header: <span className="sortable">Name of payment</span>,
            accessor: "name",
            sortMethod: (a, b) => compare(
                a.props.children.toLowerCase(),
                b.props.children.toLowerCase(),
            ),
            width: 235,
        },
        {
            Header: <span className="sortable">Amount</span>,
            accessor: "amount",
            sortMethod: (a, b) => compare(
                a.props.satoshi,
                b.props.satoshi,
            ),
            width: 190,
        },
        {
            Header: <span className="sortable">To</span>,
            accessor: "to",
            sortMethod: (a, b) => compare(
                a.props.children.props.children.toLowerCase(),
                b.props.children.props.children.toLowerCase(),
            ),
            width: 400,
        },
        {
            Header: <span className="sortable">Date</span>,
            accessor: "date",
            sortMethod: (a, b) => compare(
                a.props.dateTime,
                b.props.dateTime,
            ),
            width: 115,
        },
    ]);

    getHistoryData = () => {
        const {
            dispatch, contacts, history, lightningID,
        } = this.props;
        let date;
        return history
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
                return {
                    amount: <BalanceWithMeasure satoshi={item.amount} />,
                    date: (
                        <div dateTime={date}>
                            <span className="date__ymd">{ymd}</span>
                            <span className="date__hms">{hms}</span>
                        </div>
                    ),
                    name: <Ellipsis classList="history">{item.name}</Ellipsis>,
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
    history: state.lightning.history,
    lightningID: state.account.lightningID,
});

export default connect(mapStateToProps)(RegularHistory);
