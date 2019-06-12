import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics, validators, logger, helpers } from "additional";
import { appOperations } from "modules/app";
import {
    contactsActions as actions,
    contactsOperations as operations,
} from "modules/contacts";
import { error, info } from "modules/notifications";
import { exceptions, routes, consts } from "config";

import Modal from "components/modal";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";

class EditContact extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nameError: null,
        };

        analytics.pageview(`${routes.AddressBookFullPath}/update-contact`, "Update contact");
    }

    showErrorNotification = (text) => {
        const { dispatch } = this.props;
        dispatch(error({
            action: {
                callback: () => dispatch(operations.openNewContactModal()),
                label: "Retry",
            },
            message: helpers.formatNotificationMessage(text),
        }));
    };

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
        const name = this.contactName.value.trim();
        if (name === currentContact.name) {
            dispatch(appOperations.closeModal());
            return;
        }
        let nameError = validators.validateName(name, true);
        contacts.forEach((contact) => {
            const nameEqual = contact.name.toUpperCase() === name.toUpperCase();
            if (nameEqual) {
                nameError = exceptions.CONTACT_EDIT_USER_EXISTS;
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
            this.showErrorNotification(response.error);
            return;
        }

        dispatch(actions.setCurrentContact(null));
        dispatch(actions.prepareNewContact(null));
        dispatch(operations.getContacts());
        const message = (
            <span>Contact&nbsp;
                <strong>
                    {currentContact.name}
                </strong> renamed to <strong>{name}</strong>
            </span>);
        dispatch(info({
            message: helpers.formatNotificationMessage(message),
        }));
    };

    render() {
        const { currentContact } = this.props;
        if (!currentContact) {
            logger.log("Cant show Edit contact cause currentContact not provided");
            return null;
        }
        return (
            <Modal title="Edit contact" theme="body-20" onClose={this.closeModal} showCloseButton>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12">
                            <div className="form-label">
                                <label htmlFor="contact__name">
                                    Name
                                </label>
                            </div>
                        </div>
                        <div className="col-xs-12">
                            <input
                                id="contact__name"
                                className={`form-text ${this.state.nameError ? "form-text__error" : ""}`}
                                name="contact__name"
                                placeholder="Optional"
                                ref={(ref) => {
                                    this.contactName = ref;
                                }}
                                defaultValue={currentContact.name}
                                max={consts.ELEMENT_NAME_MAX_LENGTH}
                                maxLength={consts.ELEMENT_NAME_MAX_LENGTH}
                                onChange={() => { this.setState({ nameError: null }) }}
                            />
                            <ErrorFieldTooltip text={this.state.nameError} />
                        </div>
                    </div>
                    <div className="block__row">
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
                <div className="modal__footer">
                    <div className="row row--no-col justify-end-xs">
                        <div className="col-xs-12">
                            <button
                                className="link link--red"
                                type="button"
                                onClick={this.openDeleteContact}
                            >
                                Delete
                            </button>
                            <button
                                className="button button__solid"
                                onClick={this.updateContact}
                            >
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
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
