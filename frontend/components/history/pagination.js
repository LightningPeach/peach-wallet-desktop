import React, { Component } from "react";
import PropTypes from "prop-types";

const PAGES_NEAR = 2;

class Pagination extends Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.renderPages = this.renderPages.bind(this);
    }

    handleChange(index) {
        this.props.customPagination(index);
    }

    renderPages() {
        const { page, pages, pageSize } = this.props;
        const content = [];
        let spreadBeforeUsed = false;
        let spreadAfterUsed = false;

        // TODO bad logic, rewrite
        for (let i = 0; i < pages; i += 1) {
            let className = page === i ? "pagination__current" : "";
            className += " pagination__item";
            const button = <button className={className} onClick={() => this.handleChange(i)} key={i}>{i + 1}</button>;
            if (i === 0) {
                content.push(button);
            } else if (i < page - PAGES_NEAR && !spreadBeforeUsed) {
                content.push(<button className={`${className} pagination__not-item`} key={i}>...</button>);
                spreadBeforeUsed = true;
            } else if (i >= page - PAGES_NEAR && i <= page + PAGES_NEAR) {
                content.push(button);
            } else if (i > page + PAGES_NEAR && !spreadAfterUsed) {
                content.push(<button className={`${className} pagination__not-item`} key={i}>...</button>);
                spreadAfterUsed = true;
            } else if (i === pages - 1) {
                content.push(button);
            }
        }

        return content;
    }

    render() {
        const {
            canNext, canPrevious, page, pages, pageSize,
        } = this.props;
        if (pages <= 1) {
            return null;
        }
        let content = [];
        if (canPrevious) {
            const prev = (
                <button
                    className="pagination__item pagination__prev"
                    onClick={() => this.handleChange(page - 1)}
                    key={-1}
                >
                    &lsaquo;
                </button>
            );
            content.push(prev);
        }
        content = [...content, ...this.renderPages()];
        if (canNext) {
            const next = (
                <button
                    className="pagination__item pagination__next"
                    onClick={() => this.handleChange(page + 1)}
                    key={pages}
                >
                    &rsaquo;
                </button>
            );
            content.push(next);
        }
        return content;
    }
}

Pagination.propTypes = {
    canNext: PropTypes.bool.isRequired,
    canPrevious: PropTypes.bool.isRequired,
    customPagination: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    pageSize: PropTypes.number.isRequired,
    pages: PropTypes.number.isRequired,
};

export default Pagination;
