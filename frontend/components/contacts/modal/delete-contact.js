import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations } from "modules/app";
import {
    contactsActions as actions,
    contactsOperations as operations,
} from "modules/contacts";
import { error, info } from "modules/notifications";
import { AddressBookFullPath } from "routes";
import Modal from "components/modal";

class DeleteContact extends Component {
    constructor(props) {
        super(props);

        analytics.pageview(`${AddressBookFullPath}/delete-contact`, "Delete contact");
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
                message: response.error,
            }));
        }

        dispatch(actions.setCurrentContact(null));
        dispatch(operations.getContacts());
        dispatch(info({ message: <span>Contact <strong>{currentContact.name}</strong> deleted</span> }));
    };

    render() {
        const { currentContact } = this.props;
        if (!currentContact) {
            console.log("Cant show Delete Contact 'cause currentContact not provided");
            return null;
        }
        return (
            <Modal title="Delete contact" onClose={this.closeModal} showCloseButton>
                <div className="modal-body">
                    <div className="row form-row">
                        <div className="col-xs-12 channel-close__text">
                            Are you sure you want to
                            delete <strong title={currentContact.name}>{currentContact.name}</strong>?
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <div className="row">
                        <div className="col-xs-12 text-right">
                            <button
                                className="button button__link text-uppercase"
                                type="button"
                                onClick={this.editModal}
                            >
                                Back
                            </button>
                            <button
                                className="button button__orange button__close"
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
