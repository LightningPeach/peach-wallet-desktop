import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { analytics, logger, helpers } from "additional";
import { appOperations } from "modules/app";
import {
    contactsActions as actions,
    contactsOperations as operations,
} from "modules/contacts";
import { error, info } from "modules/notifications";
import { routes } from "config";

import Modal from "components/modal";

class DeleteContact extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${routes.AddressBookFullPath}/delete-contact`, "Delete contact");
    }

    closeModal = () => {
        analytics.event({ action: "Delete Contact Modal", category: "Address Book", label: "Close" });
        this.props.dispatch(appOperations.closeModal());
    };

    editModal = () => {
        analytics.event({ action: "Delete Contact Modal", category: "Address Book", label: "Back" });
        this.props.dispatch(operations.openEditContactModal());
    };

    deleteContact = async () => {
        const { currentContact, dispatch } = this.props;
        analytics.event({ action: "Delete Contact Modal", category: "Address Book", label: "Delete" });
        const response = await dispatch(operations.deleteCurrentContact());
        dispatch(appOperations.closeModal());
        if (!response.ok) {
            dispatch(error({
                action: {
                    callback: () => dispatch(operations.openDeleteContactModal()),
                    label: "Retry",
                },
                message: helpers.formatNotificationMessage(response.error),
            }));
        }

        dispatch(actions.setCurrentContact(null));
        dispatch(operations.getContacts());
        const message = (<span>Contact <strong>{currentContact.name}</strong> deleted</span>);
        dispatch(info({
            message: helpers.formatNotificationMessage(message),
        }));
    };

    render() {
        const { currentContact } = this.props;
        if (!currentContact) {
            logger.log("Cant show Delete Contact 'cause currentContact not provided");
            return null;
        }
        return (
            <Modal title="Delete contact" onClose={this.closeModal} showCloseButton>
                <div className="modal__body">
                    <div className="row">
                        <div className="col-xs-12 channel-close__text">
                            Are you sure you want to
                            delete <strong title={currentContact.name}>{currentContact.name}</strong>?
                        </div>
                    </div>
                </div>
                <div className="modal__footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                className="button button__link"
                                type="button"
                                onClick={this.editModal}
                            >
                                Back
                            </button>
                            <button
                                className="button button__solid"
                                type="button"
                                onClick={this.deleteContact}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

DeleteContact.propTypes = {
    currentContact: PropTypes.shape({
        name: PropTypes.string.isRequired,
    }),
    dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    currentContact: state.contacts.currentContact,
});

export default connect(mapStateToProps)(DeleteContact);
