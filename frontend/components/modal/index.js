import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { analytics } from "additional";
import { appOperations } from "modules/app";

class Modal extends Component {
    componentDidMount() {
        document.addEventListener("keydown", this.onEscClick, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.onEscClick, false);
    }

    onEscClick = (e) => {
        if (e.keyCode === 27) {
            analytics.event({ action: "Modal", category: "Modal windows", label: "Close with ESC" });
            this.props.dispatch(appOperations.closeModal());
        }
    };

    renderHeader = () => {
        if (!this.props.title) {
            return null;
        }

        return (
            <div className="modal-header">
                <div className="row">
                    <div className="col-xs-12">
                        {this.props.title}
                    </div>
                </div>
            </div>
        );
    };

    render() {
        return (
            <div className="modal-wrapper">
                <div className="modal-layout" onClick={this.props.onClose} />
                <div
                    className={`modal ${this.props.styleSet ? `modal__${this.props.styleSet}` : ""}`}
                    tabIndex="-1"
                    role="dialog"
                >
                    {this.renderHeader()}
                    {this.props.children}
                    {
                        this.props.showCloseButton &&
                        <button className="close-modal" onClick={this.props.onClose}>Close</button>
                    }
                </div>
            </div>
        );
    }
}

Modal.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
    dispatch: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    showCloseButton: PropTypes.bool,
    styleSet: PropTypes.string,
    title: PropTypes.string,
};

export default connect(null)(Modal);
