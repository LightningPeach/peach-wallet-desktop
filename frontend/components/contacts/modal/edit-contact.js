import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, validators, logger } from "additional";
import { appOperations } from "modules/app";
import {
    contactsActions as actions,
    contactsOperations as operations,
} from "modules/contacts";
import { error, info } from "modules/notifications";
import { AddressBookFullPath } from "routes";
import Modal from "components/modal";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import * as statusCodes from "config/status-codes";
import { USERNAME_MAX_LENGTH } from "config/consts";

class EditContact extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nameError: null,
        };

        analytics.pageview(`${AddressBookFullPath}/update-contact`, "Update contact");
    }

    closeModal = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Update Contact Modal", category: "Address Book", label: "Close" });
        dispatch(appOperations.closeModal());
    };

    openDeleteContact = () => {
        const { dispatch } = this.props;
        analytics.event({ action: "Update Contact Modal", category: "Address Book", label: "Delete" });
        dispatch(operations.openDeleteContactModal());
    };

    updateContact = async (e) => {
        e.preventDefault();
        analytics.event({ action: "Update Contact Modal", category: "Address Book", label: "Edit" });
        const { contacts, currentContact, dispatch } = this.props;
        const name = this.contact__name.value.trim();
        if (name === currentContact.name) {
            dispatch(appOperations.closeModal());
            return;
        }
        let nameError = validators.validateName(name, true);
        contacts.forEach((contact) => {
            const nameEqual = contact.name.toUpperCase() === name.toUpperCase();
            if (nameEqual) {
                nameError = statusCodes.EXCEPTION_CONTACT_EDIT_USER_EXISTS;
            }
        });

        if (nameError) {
            this.setState({ nameError });
            return;
        }

        const response = await dispatch(operations.updateContactOnServer(
            name,
            currentContact.lightningID,
        ));
        dispatch(appOperations.closeModal());
        if (!response.ok) {
            dispatch(error({
                action: {
                    callback: () => dispatch(operations.openEditContactModal()),
                    label: "Retry",
                },
                message: response.error,
            }));
            return;
        }

        dispatch(actions.setCurrentContact(null));
        dispatch(actions.prepareNewContact(null));
        dispatch(operations.getContacts());
        dispatch(info({
            message: <span>Contact <strong>{currentContact.name}</strong> renamed to <strong>{name}</strong></span>,
        }));
    };

    render() {
        const { currentContact } = this.props;
        if (!currentContact) {
            logger.log("Cant show Edit contact 'cause currentContact not provided");
            return null;
        }
        return (
            <Modal title="Edit contact" onClose={this.closeModal} showCloseButton>
                <form onSubmit={this.updateContact}>
                    <div className="modal-body">
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="contact__name">
                                        Name of contact
                                    </label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <input
                                    id="contact__name"
                                    className={`form-text ${this.state.nameError ? "form-text__error" : ""}`}
                                    name="contact__name"
                                    placeholder="Enter name"
                                    ref={(input) => {
                                        this.contact__name = input;
                                    }}
                                    defaultValue={currentContact.name}
                                    max={USERNAME_MAX_LENGTH}
                                    maxLength={USERNAME_MAX_LENGTH}
                                    onChange={() => { this.setState({ nameError: null }) }}
                                />
                                <ErrorFieldTooltip text={this.state.nameError} />
                            </div>
                        </div>
                        <div className="row form-row">
                            <div className="col-xs-12">
                                <div className="form-label">
                                    <label htmlFor="contact__name">
                                        Lightning Address
                                    </label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <input
                                    id="contact__lightning"
                                    className="form-text"
                                    name="contact__lightning"
                                    value={currentContact.lightningID}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <div className="row">
                            <div className="col-xs-12 text-right">
                                <button
                                    className="button button__link text-uppercase button__link--red"
                                    type="button"
                                    onClick={this.openDeleteContact}
                                >
                                    Delete
                                </button>
                                <button
                                    className="button button__orange button__close"
                                    type="submit"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        );
    }
}

EditContact.propTypes = {
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    currentContact: PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }),
    dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    contacts: state.contacts.contacts,
    currentContact: state.contacts.currentContact,
});

export default connect(mapStateToProps)(EditContact);
