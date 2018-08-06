import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, helpers } from "additional";
import SubHeader from "components/subheader";
import {
    lightningOperations as operations,
    lightningTypes,
} from "modules/lightning";
import {
    contactsTypes,
    contactsOperations,
    contactsActions,
} from "modules/contacts";
import { channelsOperations, channelsSelectors } from "modules/channels";
import NewContact from "components/contacts/modal/new-contact";
import History from "components/history";
import BalanceWithMeasure from "components/common/balance-with-measure";
import {
    streamPaymentOperations as streamOperations,
    streamPaymentTypes,
} from "modules/streamPayments";
import { appOperations, appTypes } from "modules/app";
import { MODAL_ANIMATION_TIMEOUT } from "config/consts";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { LightningFullPath } from "routes";
import Ellipsis from "components/common/ellipsis";
import ChannelWarning from "./modal/channel_warning";
import RegularPayment from "./regular";
import StreamPayment from "./stream";

class Lightning extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: "regular",
        };
        analytics.pageview(`${LightningFullPath}/regular`, "Lightning / Regular Payment");
    }

    componentWillMount() {
        const { dispatch } = this.props;
        dispatch(operations.getHistory());
        dispatch(streamOperations.loadStreams());
        dispatch(channelsOperations.getChannels());
    }

    componentWillReceiveProps(nextProps) {
        const { activeTab } = this.state;
        if (nextProps.externalPaymentRequest && activeTab !== "regular") {
            this.setState({
                activeTab: "regular",
            });
        }
    }

    componentWillUpdate(nextProps) {
        if (this.props.modalState !== nextProps.modalState && nextProps.modalState === appTypes.CLOSE_MODAL_STATE) {
            let path;
            let title;
            if (this.state.activeTab === "regular") {
                path = `${LightningFullPath}/regular`;
                title = "Lightning / Regular Payment";
            } else if (this.state.activeTab === "stream") {
                path = `${LightningFullPath}/stream`;
                title = "Lightning / Stream Payment";
            }
            analytics.pageview(path, title);
        }
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch(contactsActions.newContactAdded(null));
        dispatch(contactsOperations.setContactsSearch(null));
    }

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
            dispatch, contacts, history, lightningID, streams, isThereActiveChannel,
        } = this.props;
        let type;

        streams.sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : 0);
        const streamsData = streams.map((item, key) => {
            let className = "orange";
            let tempAddress = item.lightningID;
            const date = new Date(parseInt(item.date, 10));
            let isActive = false;
            contacts.forEach((contact) => {
                if (contact.lightningID === item.lightningID) {
                    tempAddress = contact.name;
                }
            });
            let price = item.price * (!item.currentPart ? item.totalParts : item.currentPart);
            let seconds = !item.currentPart ? item.totalParts : item.currentPart;
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
            if (item.status === streamPaymentTypes.STREAM_PAYMENT_PAUSE) {
                type = (
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
                                dispatch(streamOperations.stopStreamPayment(item.streamId));
                            }}
                        />
                    </Fragment>
                );
                className = key === 0 ? "green" : "orange";
                isActive = true;
            } else if (item.status === streamPaymentTypes.STREAM_PAYMENT_STREAMING) {
                type = (
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
                className = "red";
                isActive = true;
            } else {
                type = "Stream";
                ({ price } = item);
                seconds = item.currentPart;
                price *= seconds;
            }
            const [ymd, hms] = helpers.formatDate(date).split(" ");
            return {
                amount: <span><BalanceWithMeasure satoshi={price} /> / {seconds} sec</span>,
                date: (
                    <span dateTime={date} data-pinned={isActive}>
                        <span className="date__ymd">{ymd}</span>
                        <span className="date__hms">{hms}</span>
                    </span>
                ),
                name: <Ellipsis classList={className} data-pinned={isActive}>{item.name}</Ellipsis>,
                sortDate: date,
                to: <Ellipsis>{address}</Ellipsis>,
                type: <span data-pinned={isActive}>{type}</span>,
            };
        });

        let date;
        const lightningData = history.map((item, key) => {
            let tempAddress = null;
            const className = !streamsData.length && key === 0 ? "green" : "orange";
            // item.amount > 0 ? "sended" : "pending";
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
                name: <Ellipsis classList={`history ${className}`}>{item.name}</Ellipsis>,
                to: <Ellipsis>{address}</Ellipsis>,
                type: <span>{item.type === "stream" ? "Stream" : "Regular"}</span>,
            };
        });

        return [...streamsData, ...lightningData];
    };

    handleTabClick = (tab) => {
        if (this.state.activeTab !== tab) {
            let path;
            let title;
            if (tab === "regular") {
                path = `${LightningFullPath}/regular`;
                title = "Lightning / Regular Payment";
            } else if (tab === "stream") {
                path = `${LightningFullPath}/stream`;
                title = "Lightning / Stream Payment";
            }
            analytics.pageview(path, title);
        }
        this.setState({ activeTab: tab });
    };

    render() {
        const { modalState } = this.props;
        const { activeTab } = this.state;
        let modal;
        switch (modalState) {
            case lightningTypes.MODAL_STATE_CHANNEL_WARNING:
                modal = <ChannelWarning />;
                break;
            case contactsTypes.MODAL_STATE_NEW_CONTACT:
                modal = <NewContact page="lightning" />;
                break;
            default:
                modal = null;
                break;
        }
        let tabContent;
        switch (activeTab) {
            case "regular":
                tabContent = <RegularPayment />;
                break;
            case "stream":
                tabContent = <StreamPayment />;
                break;
            default:
                tabContent = null;
                break;
        }
        return [
            <SubHeader key={0} />,
            <div key={1} className="lightning lightning-page">
                <div className="container">
                    <div className="tabs">
                        <div className="row tabs__row">
                            <div className="col-xs-12 tabs__wrapper">
                                <div className={`tabs__container tabs__${activeTab}`}>
                                    <a
                                        className={`tab-link ${activeTab === "regular" ? "tab-link-active" : ""}`}
                                        onClick={() => this.handleTabClick("regular")}
                                    >
                                        Regular payment
                                    </a>
                                    <a
                                        className={`tab-link ${activeTab === "stream" ? "tab-link-active" : ""}`}
                                        onClick={() => this.handleTabClick("stream")}
                                    >
                                        Stream payment
                                    </a>
                                </div>
                            </div>
                        </div>
                        {tabContent}
                    </div>
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
                </div>
            </div>,
            <ReactCSSTransitionGroup
                transitionName="modal-transition"
                transitionEnterTimeout={MODAL_ANIMATION_TIMEOUT}
                transitionLeaveTimeout={MODAL_ANIMATION_TIMEOUT}
                key={2}
            >
                {modal}
            </ReactCSSTransitionGroup>,
        ];
    }
}

Lightning.propTypes = {
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    dispatch: PropTypes.func.isRequired,
    externalPaymentRequest: PropTypes.string,
    history: PropTypes.arrayOf(PropTypes.shape).isRequired,
    isThereActiveChannel: PropTypes.bool,
    lightningID: PropTypes.string.isRequired,
    modalState: PropTypes.string,
    streams: PropTypes.arrayOf(PropTypes.shape({
        comment: PropTypes.string,
        currentPart: PropTypes.number.isRequired,
        date: PropTypes.number.isRequired,
        delay: PropTypes.number,
        description: PropTypes.string,
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        status: PropTypes.string.isRequired,
        totalParts: PropTypes.number.isRequired,
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

export default connect(mapStateToProps)(Lightning);
