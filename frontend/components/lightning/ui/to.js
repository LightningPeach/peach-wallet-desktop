import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { contactsActions, contactsOperations } from "modules/contacts";
import { PAYMENT_REQUEST_LENGTH, LIGHTNING_ID_LENGTH } from "config/consts";
import { debounce } from "additional";

class ToField extends Component {
    constructor(props) {
        super(props);
        this.selectedItem = false;
        this.pseudoFocused = false;
        this.state = {
            empty: true,
            isFocused: false,
            value: "",
        };
    }

    componentWillMount() {
        const { contactsSearch, onChange } = this.props;
        if (contactsSearch) {
            this.setState({ empty: false, value: contactsSearch });
            onChange(contactsSearch);
        }
        document.addEventListener("mouseup", this._handleMouseUp, false);
    }

    componentDidMount() {
        if (this.props.onRef) {
            this.props.onRef(this);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.newContactAddedName && this.state.value.trim() !== nextProps.newContactAddedName) {
            this.setState({ value: nextProps.newContactAddedName });
            this.props.onChange(nextProps.newContactAddedName);
        }
        if (nextProps.refreshed) {
            this.setState({ empty: true, value: "" });
        }
    }

    componentWillUnmount() {
        if (this.props.onRef) {
            this.props.onRef(undefined);
        }
        document.removeEventListener("mouseup", this._handleMouseUp, false);
    }

    onBlur = debounce(() => {
        if (this.pseudoFocused) {
            return;
        }
        let found = false;
        if (!this.input || this.selectedItem) {
            this.selectedItem = false;
            return;
        }
        const value = this.input.value.trim();
        this.props.contacts.forEach((item) => {
            if (item.name === value || item.lightningID === value) {
                found = true;
                this.setState({ empty: false, isFocused: false, value: item.name });
            }
        });
        if (!found) {
            this.setState({ empty: value.length < 1, isFocused: false, value });
        }
        this.props.onChange(value);
    }, 150);

    onInput = () => {
        const { value } = this.input;
        this.setState({ empty: value.length < 1, value });
    };

    setPseudoFocused = () => {
        this.pseudoFocused = true;
    };

    setValue = (value) => {
        this.setState({ value });
    };

    unsetPseudoFocused = () => {
        this.pseudoFocused = false;
        this.onBlur();
    };

    _handleMouseUp = () => {
        if (!this.pseudoFocused) {
            return;
        }
        this.unsetPseudoFocused();
    };

    reset = () => {
        this.setState({ empty: true, value: "" });
    };

    renderAddToAddress = (key = undefined) => {
        const { dispatch } = this.props;
        const value = this.state.value.trim();
        const name = !value ? "contact" : value;
        const params = {};
        if (value.length === LIGHTNING_ID_LENGTH) {
            params.lightningID = value;
        } else {
            params.name = value;
        }
        return (
            <div
                className="l-select__option l-select__option--create"
                key={key}
                onClick={() => {
                    dispatch(contactsActions.prepareNewContact(params));
                    dispatch(contactsOperations.openNewContactModal());
                }}
                onMouseDown={this.setPseudoFocused}
            >
                <span>+ Add </span>
                <span className="word">{name}</span>
                <span> to Address Book</span>
            </div>
        );
    };

    renderOption = (item, key) => {
        const value = this.state.value.trim();
        let name;
        if (value) {
            name = { __html: item.name.replace(value, x => `<strong>${x}</strong>`) };
        } else {
            name = { __html: item.name };
        }
        return (
            <div
                className="l-select__option"
                key={key}
                onClick={() => {
                    this.setState({ isFocused: false, value: item.name });
                    this.props.onChange(item.name);
                    this.selectedItem = true;
                }}
                onMouseDown={this.setPseudoFocused}
                dangerouslySetInnerHTML={name} // eslint-disable-line
            />
        );
    };

    renderEmptyOption = () => {
        if (!this.state.value) {
            return this.renderAddToAddress();
        }
        return [
            <div
                className="l-select__option l-select__option--placeholder"
                key="toFieldNotFound"
            >
                <span>Contact </span>
                <span className="word">{this.state.value.trim()}</span>
                <span> is not found</span>
            </div>,
            this.renderAddToAddress(1),
        ];
    };

    renderDropdown = () => {
        const value = this.state.value.trim();
        const inContact = item => item.name.includes(value) || item.lightningID === value;
        const contacts = !value ? this.props.contacts : this.props.contacts.filter(inContact);
        let options;
        if (value.length >= PAYMENT_REQUEST_LENGTH) {
            return null;
        }
        if (!contacts.length) {
            options = this.renderEmptyOption();
        } else {
            options = contacts.map((item, key) => this.renderOption(item, key));
            if (value && (options.length !== 1 || (value !== contacts[0].name && value !== contacts[0].lightningID))) {
                options.push(this.renderAddToAddress(options.length + 1));
            }
        }
        return (
            <div className="l-select__options">{options}</div>
        );
    };

    renderClear = () => {
        if (this.state.empty) {
            return null;
        }
        return (
            <span
                className="l-select__clear"
                onClick={() => {
                    this.setState({ empty: true, isFocused: false, value: "" });
                    this.props.onChange("");
                }}
            >
                &times;
            </span>
        );
    };

    renderArrow = () => (
        <span
            className={`l-select__arrow ${this.state.isFocused ? "l-select__arrow--opened" : ""}`}
            onClick={() => {
                if (!this.state.isFocused) {
                    this.input.focus();
                }
            }}
        />
    );

    render() {
        const { disableLightningId } = this.props;
        return (
            <div className={`l-select ${disableLightningId ? "l-select--no-dropdown" : ""}`}>
                {this.renderArrow()}
                {/* {this.renderClear()} */}
                <input
                    id={this.props.id || ""}
                    ref={(el) => {
                        this.input = el;
                    }}
                    className={`l-select__input ${this.props.class}`}
                    placeholder={this.props.placeholder ? this.props.placeholder : "Lightning ID / Payment request"}
                    value={this.state.value}
                    onFocus={() => this.setState({ isFocused: true })}
                    onBlur={this.onBlur}
                    onChange={this.onInput}
                    disabled={this.props.disabled}
                />
                {this.state.isFocused && !disableLightningId ? this.renderDropdown() : null}
            </div>
        );
    }
}

ToField.propTypes = {
    class: PropTypes.string,
    contacts: PropTypes.arrayOf(PropTypes.shape({
        lightningID: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    })),
    contactsSearch: PropTypes.string,
    disableLightningId: PropTypes.bool,
    disabled: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    id: PropTypes.string,
    newContactAddedName: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    onRef: PropTypes.func,
    placeholder: PropTypes.string,
    refreshed: PropTypes.bool,
};

const mapStateToProps = (state) => {
    const { newContactAddedName, contactsSearch, contacts } = state.contacts;
    return { contacts, contactsSearch, newContactAddedName };
};

export default connect(mapStateToProps)(ToField);
