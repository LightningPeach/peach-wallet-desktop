import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import orderBy from "lodash/orderBy";
import isEqual from "lodash/isEqual";
import { helpers, validators } from "additional";
import { appOperations } from "modules/app";
import { chatOperations, chatSelectors } from "modules/chat";
import { LIGHTNING_ID_LENGTH } from "config/consts";

import SubHeader from "components/subheader";
import ErrorFieldTooltip from "components/ui/error-field-tooltip";

class ChatPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            disabled: false,
            lightningIdError: null,
            messages: orderBy([...this.props.messages, ...this.props.sendedMessages], "date", "asc"),
            msgError: null,
        };
    }

    componentDidUpdate(prevProps) {
        const { messages, sendedMessages } = this.props;
        if (!isEqual(prevProps.messages, messages) || !isEqual(prevProps.sendedMessages, sendedMessages)) {
            this.formatMessages([...messages, ...sendedMessages]);
        }
    }

    formatMessages = messages => this.setState({ messages: orderBy(messages, "date", "asc") });

    handleSubmit = async (event) => {
        event.preventDefault();
        this.setState({ disabled: true });
        const lightningId = this.lightningId.value.trim();
        const msg = this.msg.value.trim();
        const lightningIdError = this.props.validateLightning(lightningId);
        const msgError = validators.validateRequired(msg);
        if (msgError || lightningIdError) {
            this.setState({ disabled: false, lightningIdError, msgError });
            return;
        }
        await this.props.sendMsg(lightningId, msg);
        this.setState({ disabled: false });
    };

    renderItem = (item) => {
        const date = new Date(parseInt(item.date, 10));
        const [ymd, hms] = helpers.formatDate(date).split(" ");
        return (
            <div className={`chat__msg chat__msg--${item.type}`} key={item.date}>
                {item.memo}
                <div dateTime={date} className="chat__date">
                    <span className="date__ymd">{ymd}</span>
                    <span className="date__hms">{hms}</span>
                </div>
            </div>
        );
    };

    render() {
        const { messages, disabled } = this.state;
        const submitDisabled = disabled ||
            !this.lightningId ||
            !this.msg ||
            (
                (this.lightningId && !this.lightningId.value) ||
                (this.msg && !this.msg.value)
            );
        return [
            <SubHeader key={1} />,
            <div key={2} className="contacts-page">
                <div className="container">
                    <div className="chat__msg-container">
                        {messages.map(this.renderItem)}
                    </div>
                    <div className="chat__reply-container">
                        <form onSubmit={this.handleSubmit}>
                            <div className="row form-row">
                                <div className="col-xs-12">
                                    <div className="form-label">
                                        <label htmlFor="contact__name">
                                            Lightning address
                                        </label>
                                    </div>
                                </div>
                                <div className="col-xs-12">
                                    <input
                                        className={`form-text ${this.state.lightningIdError ? "form-text__error" : ""}`}
                                        placeholder="Enter Lightning Address"
                                        ref={(ref) => {
                                            this.lightningId = ref;
                                        }}
                                        max={LIGHTNING_ID_LENGTH}
                                        maxLength={LIGHTNING_ID_LENGTH}
                                        onChange={() => this.setState({ lightningIdError: null })}
                                        disabled={disabled}
                                    />
                                    <ErrorFieldTooltip text={this.state.lightningIdError} />
                                </div>
                            </div>
                            <div className="row form-row">
                                <div className="col-xs-12">
                                    <div className="form-label">
                                        <label htmlFor="contact__name">
                                            Message
                                        </label>
                                    </div>
                                </div>
                                <div className="col-xs-12">
                                    <textarea
                                        ref={(ref) => {
                                            this.msg = ref;
                                        }}
                                        className="form-textarea"
                                        placeholder="Write here"
                                        onChange={() => this.setState({ msgError: null })}
                                        disabled={disabled}
                                    />
                                    <ErrorFieldTooltip text={this.state.msgError} />
                                </div>
                            </div>
                            <div className="row form-row">
                                <div className="col-xs-12 text-right">
                                    <button
                                        className="button button__orange button__create"
                                        type="submit"
                                        disabled={submitDisabled}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>,
        ];
    }
}

ChatPage.propTypes = {
    messages: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    sendMsg: PropTypes.func.isRequired,
    sendedMessages: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    validateLightning: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    messages: chatSelectors.getMessages(state.lightning.history),
    sendedMessages: state.chat.messages,
});

const mapDispatchToProps = dispatch => ({
    sendMsg: (lightningId, msg) => dispatch(chatOperations.sendMsg(lightningId, msg)),
    validateLightning: lightningId => dispatch(appOperations.validateLightning(lightningId)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChatPage);
