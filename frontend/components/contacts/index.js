import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { push } from "react-router-redux";

import { analytics, logger } from "additional";
import {
    contactsActions as actions,
    contactsOperations as operations,
    contactsTypes as types,
} from "modules/contacts";
import { accountOperations, accountTypes } from "modules/account";
import { consts, routes } from "config";
import { appOperations, appTypes } from "modules/app";
import { filterTypes, filterOperations } from "modules/filter";

import SubHeader from "components/subheader";
import Button from "components/ui/button";
import RecordsTable from "components/records/table";
import Ellipsis from "components/common/ellipsis";
import { DeleteContact, NewContact, EditContact } from "./modal";

class ContactsPage extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(routes.AddressBookFullPath, "Address Book");
    }

    componentWillMount() {
        this.props.dispatch(operations.getContacts());
    }

    componentWillUpdate(nextProps) {
        if (this.props.modalState !== nextProps.modalState && nextProps.modalState === appTypes.CLOSE_MODAL_STATE) {
            analytics.pageview(routes.AddressBookFullPath, "Address Book");
        }
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch(actions.setCurrentContact(null));
        dispatch(actions.prepareNewContact(null));
        dispatch(actions.newContactAdded(null));
    }

    getHistoryHeader = () => (
        [
            {
                Header: <span className="sortable">Name</span>,
                accessor: "name",
                maxWidth: 201,
                minWidth: 142,
            },
            {
                Header: <span className="sortable">Lightning ID</span>,
                accessor: "lightning",
                sortable: false,
            },
        ]
    );

    getContactsData = () => {
        const { contacts, filter, dispatch } = this.props;
        return contacts
            .filter(contact => dispatch(filterOperations.filter(
                filter,
                {
                    search: [
                        contact.name,
                        contact.lightningID,
                    ],
                },
            )))
            .map((contact, key) => ({
                lightning: (
                    <div className="contacts__lightning-wrapper">
                        <div className="contacts__lightningId">
                            {contact.lightningID}
                        </div>
                        <div className="contacts__actions">
                            <button className="table__button" type="button" onClick={() => this.handleEdit(contact)}>
                                Edit
                            </button>
                            <button
                                className="table__button"
                                type="button"
                                onClick={() => this.handleCopy(contact.lightningID)}
                            >
                                Copy
                            </button>
                            <button className="table__button" type="button" onClick={() => this.handlePay(contact)}>
                                Pay
                            </button>
                        </div>
                    </div>
                ),
                name: <Ellipsis>{contact.name}</Ellipsis>,
            }));
    };

    handleEdit = (contact) => {
        analytics.event({ action: "Edit contact", category: "Address Book", label: "Edit" });
        const { dispatch } = this.props;
        dispatch(actions.setCurrentContact(contact));
        dispatch(operations.openEditContactModal());
    };

    handlePay = (contact) => {
        analytics.event({ action: "Pay contact", category: "Address Book", label: "Pay" });
        const { dispatch } = this.props;
        dispatch(operations.setContactsSearch(contact.name));
        dispatch(push(routes.WalletPath));
    };

    handleCopy = (address) => {
        analytics.event({ action: "Copy contact", category: "Address Book", label: "Copy" });
        const { dispatch } = this.props;
        dispatch(appOperations.copyToClipboard(address, "Lightning ID copied"));
    };

    headerBtnClick = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Subheader", category: "Address Book", label: "Create contact" });
        dispatch(operations.openNewContactModal());
    };

    renderEmptyList = (isStandard = false) => {
        const { dispatch } = this.props;
        return (
            <div className="page__placeholder page__placeholder--book">
                {isStandard
                    ? (
                        <Fragment>
                            <div className="row">
                                <div className="col-xs-12">
                                    <span className="page__placeholder-text">
                                        Contact list is available only in the&nbsp;
                                        <button
                                            className="link"
                                            onClick={() => dispatch(accountOperations.openWalletModeModal())}
                                        >
                                            Extended Mode
                                        </button>.
                                    </span>
                                </div>
                            </div>
                        </Fragment>
                    )
                    : <span className="page__placeholder-text">Here all your contacts will be displayed</span>
                }
            </div>
        );
    };

    renderContacts = () => (
        <div className="container">
            <div className="row">
                <div className="col-xs-12 table">
                    <RecordsTable
                        data={this.getContactsData()}
                        columns={this.getHistoryHeader()}
                        source={filterTypes.FILTER_CONTACTS}
                        withoutTitle
                        filters={[
                            filterTypes.FILTER_KIND_SEARCH,
                        ]}
                        emptyPlaceholder="No contacts found"
                        searchPlaceholder="Name, Lightning ID"
                    />
                </div>
            </div>
        </div>
    );

    render() {
        const { contacts, modalState, walletMode } = this.props;
        let modal;
        switch (modalState) {
            case types.MODAL_STATE_NEW_CONTACT:
                modal = <NewContact />;
                break;
            case types.MODAL_STATE_DELETE_CONTACT:
                modal = <DeleteContact />;
                break;
            case types.MODAL_STATE_EDIT_CONTACT:
                modal = <EditContact />;
                break;
            default:
                modal = null;
        }
        const headerBtn = walletMode === accountTypes.WALLET_MODE.EXTENDED
            ? <Button class="button__solid" onClick={this.headerBtnClick} text="ADD CONTACT" />
            : null;

        return (
            <Fragment>
                <SubHeader button={headerBtn} />
                <div className="page contacts">
                    {!contacts.length || walletMode !== accountTypes.WALLET_MODE.EXTENDED
                        ? this.renderEmptyList(walletMode === accountTypes.WALLET_MODE.STANDARD)
                        : this.renderContacts()}
                </div>
                <ReactCSSTransitionGroup
                    transitionName="modal-transition"
                    transitionEnterTimeout={consts.MODAL_ANIMATION_TIMEOUT}
                    transitionLeaveTimeout={consts.MODAL_ANIMATION_TIMEOUT}
                >
                    {modal}
                </ReactCSSTransitionGroup>
            </Fragment>
        );
    }
}

ContactsPage.propTypes = {
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })).isRequired,
    dispatch: PropTypes.func.isRequired,
    filter: PropTypes.shape().isRequired,
    modalState: PropTypes.string.isRequired,
    walletMode: PropTypes.oneOf(accountTypes.WALLET_MODES_LIST),
};

const mapStateToProps = state => ({
    contacts: state.contacts.contacts,
    filter: state.filter.contacts,
    modalState: state.app.modalState,
    walletMode: state.account.walletMode,
});

export default connect(mapStateToProps)(ContactsPage);
