import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
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
import DeleteContact from "./modal/delete-contact";
import NewContact from "./modal/new-contact";
import EditContact from "./modal/edit-contact";

class ContactsPage extends Component {
    constructor(props) {
        super(props);
        this.contacts = this.props.contacts;
        this.state = {
            search_value: "",
        };

        analytics.pageview(AddressBookFullPath, "Address Book");
    }

    componentWillMount() {
        this.props.dispatch(operations.getContacts());
    }

    componentWillUpdate(nextProps, nextState) {
        this.filterContacts(nextState.search_value, nextProps.contacts);
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
            },
            {
                Header: <span className="sortable">Lightning ID</span>,
                accessor: "lightning",
                sortable: false,
            },
        ]
    );

    getContactsData = () => {
        const btnClass = "table__button";
        return this.contacts.map((contact, key) => ({
            lightning: (
                <div className="contacts__lightning-wrapper">
                    <div className="contacts__lightningId">
                        {contact.lightningID}
                    </div>
                    <div className="contacts__actions">
                        <button className={btnClass} type="button" onClick={() => this.handleEdit(key)}>
                            Edit
                        </button>
                        <button className={btnClass} type="button" onClick={() => this.handleCopy(contact.lightningID)}>
                            Copy
                        </button>
                        <button className={btnClass} type="button" onClick={() => this.handlePay(key)}>
                            Pay
                        </button>
                    </div>
                </div>
            ),
            name: <Ellipsis>{contact.name}</Ellipsis>,
        }));
    };

    filterContacts = (keyword, props = undefined) => {
        const contacts = !props ? this.props.contacts : props;
        this.contacts = !keyword ?
            contacts :
            contacts.filter(contact => contact.name.toUpperCase()
                .includes(keyword.toUpperCase()) || contact.lightningID.includes(keyword));
    };

    handleSearch = (e) => {
        if (this.props.contacts) {
            this.setState({ search_value: e.target.value.trim() });
        }
    };

    handleEdit = (index) => {
        analytics.event({ action: "Edit contact", category: "Address Book", label: "Edit" });
        const { dispatch } = this.props;
        const updateContact = this.contacts[index];
        dispatch(actions.setCurrentContact(updateContact));
        dispatch(operations.openEditContactModal());
    };

    handlePay = (index) => {
        analytics.event({ action: "Pay contact", category: "Address Book", label: "Pay" });
        const { dispatch } = this.props;
        const payContact = this.contacts[index];
        dispatch(operations.setContactsSearch(payContact.name));
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
                <div className="col-xs-12 search">
                    <DebounceInput
                        debounceTimeout={500}
                        onChange={this.handleSearch}
                        className="form-text form-search"
                        placeholder="&nbsp;"
                        value={this.state.search_value}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col-xs-12 table">
                    <History
                        data={this.getContactsData()}
                        key={3}
                        columns={this.getHistoryHeader()}
                        filterable={false}
                        withoutTitle
                        showPagination
                        showPageJump={false}
                        emptyPlaceholder="No contacts found"
                    />
                </div>
            </div>
        </div>
    );

    render() {
        console.log("RENDERED CONTACTS");
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
    modalState: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    contacts: state.contacts.contacts,
    modalState: state.app.modalState,
});

export default connect(mapStateToProps)(ContactsPage);
