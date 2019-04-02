import React, { Component } from "react";
import PropTypes from "prop-types";

class Ellipsis extends Component {
    constructor(props) {
        super(props);

        this.state = {
            hovered: false,
        };
    }
    handleMouseLeave = () => {
        if (this.state.hovered) {
            this.setState({
                hovered: false,
            });
        }
    };

    handleMouseEnter = () => {
        if (
            this.wrapper.offsetHeight < this.wrapper.scrollHeight
            || this.wrapper.offsetWidth < this.wrapper.scrollWidth
        ) {
            this.setState({
                hovered: true,
            });
        }
    };

    handleTouchEnd = () => {
        if (
            this.wrapper.offsetHeight < this.wrapper.scrollHeight
            || this.wrapper.offsetWidth < this.wrapper.scrollWidth
        ) {
            this.setState({
                hovered: !this.state.hovered,
            });
        }
    };

    render() {
        const { className, children } = this.props;
        return (
            <span
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                onTouchEnd={this.handleTouchEnd}
                ref={(ref) => { this.wrapper = ref }}
                className={`text-ellipsis ${className || ""} ${this.state.hovered ? "hovered" : ""}`}
            >
                <span className="text-ellipsis__popper">{children}</span>
            </span>
        );
    }
}

Ellipsis.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node,
    ]).isRequired,
    className: PropTypes.string,
};

export default Ellipsis;
