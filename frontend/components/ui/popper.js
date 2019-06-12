import React, { Component } from "react";
import PropTypes from "prop-types";

class Popper extends Component {
    constructor(props) {
        super(props);

        this.state = {
            bottomOverlay: false,
            rightOverlay: false,
        };
    }

    componentDidMount() {
        document.addEventListener("keyup", this.handleKeyUp);
        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("touchend", this.handleTouchEnd);
        document.addEventListener("scroll", this.handleChangePosition);
        window.addEventListener("resize", this.handleChangePosition);
        this.handleChangePosition();
    }

    componentWillUnmount() {
        document.removeEventListener("keyup", this.handleKeyUp);
        document.removeEventListener("mouseup", this.handleMouseUp);
        document.removeEventListener("touchend", this.handleTouchEnd);
        document.removeEventListener("scroll", this.handleChangePosition);
        window.removeEventListener("resize", this.handleChangePosition);
    }

    handleKeyUp = (e) => {
        const { closeWithEsc, onClose } = this.props;
        if (closeWithEsc && e.keyCode === 27) {
            onClose();
        }
    };

    handleMouseUp = (e) => {
        const { onClose } = this.props;
        if (!this.popper.contains(e.target)) {
            onClose();
        }
    };

    handleTouchEnd = (e) => {
        const { onClose } = this.props;
        if (!this.popper.contains(e.target)) {
            onClose();
        }
    };

    handleChangePosition = () => {
        const popper = this.popper.getBoundingClientRect();
        const { verticalDiff, horizontalDiff } = this.props;
        const bottomOverlay =
            (!this.state.bottomOverlay && popper.bottom > window.innerHeight)
            || (this.state.bottomOverlay && popper.bottom + verticalDiff + popper.height > window.innerHeight);
        const rightOverlay =
            (!this.state.rightOverlay && popper.right > window.innerWidth)
            || (this.state.rightOverlay && popper.right + (popper.width - horizontalDiff) > window.innerWidth);
        this.setState({
            bottomOverlay,
            rightOverlay,
        });
    };

    render() {
        const { className, children } = this.props;
        return (
            <div
                className={`popper ${className} ${
                    this.state.bottomOverlay ? "popper--oBottom" : ""
                } ${
                    this.state.rightOverlay ? "popper--oRight" : ""
                }`}
                ref={(ref) => { this.popper = ref }}
            >
                {children}
            </div>
        );
    }
}

Popper.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
    className: PropTypes.string,
    closeWithEsc: PropTypes.bool,
    horizontalDiff: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    verticalDiff: PropTypes.number,
};

export default Popper;
