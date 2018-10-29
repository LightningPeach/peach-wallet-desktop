import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, logger } from "additional";
import {
    contactsActions as actions,
    contactsOperations as operations,
    contactsTypes as types,
} from "modules/contacts";
import SubHeader from "components/subheader";
import Button from "components/ui/button";
import DebounceInput from "react-debounce-input";
import History from "components/history";
import Ellipsis from "components/common/ellipsis";
import { WalletPath, AddressBookFullPath } from "routes";
import { push } from "react-router-redux";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import { MODAL_ANIMATION_TIMEOUT } from "config/consts";
import { appOperations, appTypes } from "modules/app";
import { filterTypes, filterOperations } from "modules/filter";
import DeleteContact from "./modal/delete-contact";
import NewContact from "./modal/new-contact";
import EditContact from "./modal/edit-contact";

class ContactsPage extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(AddressBookFullPath, "Address Book");
    }

    componentWillMount() {
        this.props.dispatch(operations.getContacts());
    }

    componentWillUpdate(nextProps) {
        if (this.props.modalState !== nextProps.modalState && nextProps.modalState === appTypes.CLOSE_MODAL_STATE) {
            analytics.pageview(AddressBookFullPath, "Address Book");
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
                Header: <span className="sortable">Name of contact</span>,
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
        dispatch(push(WalletPath));
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

    renderEmptyList = () => (
        <div className="empty-placeholder">
            <span className="placeholder_text">Here all your contacts will be displayed</span>
        </div>
    );

    renderContacts = () => (
        <div className="container">
            <div className="row">
                <div className="col-xs-12 table">
                    <History
                        key={3}
                        data={this.getContactsData()}
                        columns={this.getHistoryHeader()}
                        source={filterTypes.FILTER_CONTACTS}
                        withoutTitle
                        filters={[
                            filterTypes.FILTER_KIND_SEARCH,
                        ]}
                        emptyPlaceholder="No contacts found"
                    />
                </div>
            </div>
        </div>
    );

    render() {
        const { contacts, modalState } = this.props;
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
        const headerBtn = <Button class="button__orange" onClick={this.headerBtnClick} text="ADD CONTACT" />;

        return [
            <SubHeader key={1} button={headerBtn} />,
            <div key={2} className="contacts-page">
                {!contacts.length ? this.renderEmptyList() : this.renderContacts()}
            </div>,
            <ReactCSSTransitionGroup
                transitionName="modal-transition"
                transitionEnterTimeout={MODAL_ANIMATION_TIMEOUT}
                transitionLeaveTimeout={MODAL_ANIMATION_TIMEOUT}
                key={3}
            >
                {modal}
            </ReactCSSTransitionGroup>,
        ];
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
};

const mapStateToProps = state => ({
    contacts: state.contacts.contacts,
    filter: state.filter.contacts,
    modalState: state.app.modalState,
});

export default connect(mapStateToProps)(ContactsPage);
