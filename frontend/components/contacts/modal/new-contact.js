import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics, validators } from "additional";
import { appOperations } from "modules/app";
import ErrorFieldTooltip from "components/ui/error_field_tooltip";
import * as statusCodes from "config/status-codes";
import { LIGHTNING_ID_LENGTH, USERNAME_MAX_LENGTH } from "config/consts";
import {
    contactsActions as actions,
    contactsOperations as operations,
} from "modules/contacts";
import { error, info } from "modules/notifications";
import { AddressBookFullPath, LightningFullPath } from "routes";
import Modal from "components/modal";

class NewContact extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lightningIDError: null,
            nameError: null,
        };

        const basePath = this.props.page && this.props.page === "lightning" ? LightningFullPath : AddressBookFullPath;
        analytics.pageview(`${basePath}/new-contact`, "New contact");
    }

    closeModal = () => {
        analytics.event({ action: "New Contact Modal", category: "Address Book", label: "Back" });
        this.props.dispatch(appOperations.closeModal());
    };

    addContact = async (event) => {
        event.preventDefault();
        analytics.event({ action: "New Contact Modal", category: "Address Book", label: "Create" });
        const { contacts, dispatch } = this.props;
        const name = this.contact__name.value.trim();
        const lightningID = this.contact__lightning.value.trim();
        let nameError = validators.validateName(name, true);
        let lightningIDError = dispatch(appOperations.validateLightning(lightningID));

        if (contacts) {
            contacts.forEach((contact) => {
                const nameEqual = contact.name.toUpperCase() === name.toUpperCase();
                const lightningIdEqual = contact.lightningID.toUpperCase() === lightningID.toUpperCase();
                if (nameEqual && lightningIdEqual) {
                    lightningIDError = statusCodes.EXCEPTION_CONTACT_CREATE_USER_ID_EXISTS;
                } else if (nameEqual) {
                    nameError = statusCodes.EXCEPTION_CONTACT_CREATE_USER_EXISTS;
                } else if (lightningIdEqual) {
                    lightningIDError = statusCodes.EXCEPTION_CONTACT_CREATE_ID_EXISTS;
                }
            });
        }

        if (nameError || lightningIDError) {
            this.setState({ lightningIDError, nameError });
            return;
        }

        this.setState({ lightningIDError, nameError });
        dispatch(appOperations.closeModal());
        dispatch(actions.prepareNewContact({ lightningID, name }));
        const response = await dispatch(operations.addNewContact(name, lightningID));
        if (!response.ok) {
            dispatch(error({
                action: {
                    callback: () => dispatch(operations.openNewContactModal()),
                    label: "Retry",
                },
                message: response.error,
            }));
            return;
        }

        dispatch(actions.prepareNewContact(null));
        dispatch(actions.newContactAdded(name));
        dispatch(operations.getContacts());
        dispatch(info({ message: <span>Contact <strong>{name}</strong> added</span> }));
    };

    render() {
        const { newContactDetails } = this.props;
        return (
            <Modal title="Add new contact" onClose={this.closeModal}>
                <form onSubmit={this.addContact}>
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
                                    defaultValue={newContactDetails ? newContactDetails.name : null}
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
                                    <label htmlFor="contact__lightning">
                                        Lightning Address
                                    </label>
                                </div>
                            </div>
                            <div className="col-xs-12">
                                <input
                                    id="contact__lightning"
                                    className={`form-text ${this.state.lightningIDError ? "form-text__error" : ""}`}
                                    name="contact__lightning"
                                    placeholder="Enter Lightning Address"
                                    ref={(input) => {
                                        this.contact__lightning = input;
                                    }}
                                    defaultValue={newContactDetails ? newContactDetails.lightningID : null}
                                    max={LIGHTNING_ID_LENGTH}
                                    maxLength={LIGHTNING_ID_LENGTH}
                                    onChange={() => { this.setState({ lightningIDError: null }) }}
                                />
                                <ErrorFieldTooltip text={this.state.lightningIDError} />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <div className="row">
                            <div className="col-xs-12 text-right">
                                <button
                                    className="button button__link text-uppercase"
                                    type="button"
                                    onClick={this.closeModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="button button__orange button__create"
                                    type="submit"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        );
    }
}

NewContact.propTypes = {
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    dispatch: PropTypes.func.isRequired,
    newContactDetails: PropTypes.shape({
        lightningID: PropTypes.string,
        name: PropTypes.string,
    }),
    page: PropTypes.string,
};

NewContact.defaultProps = {
    contacts: [],
    newContactDetails: {},
};

const mapStateToProps = state => ({
    contacts: state.contacts.contacts,
    newContactDetails: state.contacts.newContactDetails,
});

export default connect(mapStateToProps)(NewContact);
