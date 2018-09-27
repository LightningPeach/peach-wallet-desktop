import React, { Component } from "react";
import PropTypes from "prop-types";
import Tooltip from "rc-tooltip";
import { connect } from "react-redux";
import { analytics, helpers } from "additional";
import { appOperations } from "modules/app";

class Modal extends Component {
    componentDidMount() {
        document.addEventListener("keydown", this.onKeyClick, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.onKeyClick, false);
    }

    onKeyClick = (e) => {
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
                        <span className="modal-header__label">
                            {this.props.title}
                            {this.props.titleTooltip &&
                            <Tooltip
                                placement="right"
                                overlay={helpers.formatTooltips(this.props.titleTooltip)}
                                trigger="hover"
                                arrowContent={
                                    <div className="rc-tooltip-arrow-inner" />
                                }
                                prefixCls="rc-tooltip__small rc-tooltip"
                                mouseLeaveDelay={0}
                            >
                                <i className="form-label__icon form-label__icon--info form-label__icon--large" />
                            </Tooltip>
                            }
                        </span>
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
    titleTooltip: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.string,
    ]),
};

export default connect(null)(Modal);
