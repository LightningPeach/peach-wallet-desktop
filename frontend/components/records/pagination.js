import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { DEFAULT_PAGINNATION_SPREAD_PAGES } from "config/consts";

class Pagination extends Component {
    handleChange = (index) => {
        this.props.customPagination(index);
    };

    renderPages = () => {
        const { page, pages } = this.props;

        return [...Array(pages).keys()].map((index) => {
            if (
                index !== 0
                && index !== pages - 1
                && !(Math.abs(page - index) <= DEFAULT_PAGINNATION_SPREAD_PAGES + 1)
            ) {
                return null;
            }
            const isSpread =
                Math.abs(index - page) === DEFAULT_PAGINNATION_SPREAD_PAGES + 1
                && index !== 0
                && index !== pages - 1;
            return (
                <button
                    className={`pagination__item ${
                        index === page ? "pagination__current" : ""} ${isSpread ? "pagination__not-item" : ""}`}
                    onClick={!isSpread ? () => this.handleChange(index) : null}
                    key={index}
                >
                    {isSpread ? "..." : index + 1}
                </button>
            );
        });
    };

    renderPrevious = () => {
        const { canPrevious, page } = this.props;
        return canPrevious ?
            <button
                className="pagination__item pagination__prev"
                onClick={() => this.handleChange(page - 1)}
                key={-1}
            >
                &lsaquo;
            </button> :
            null;
    };

    renderNext = () => {
        const { canNext, page, pages } = this.props;
        return canNext ?
            <button
                className="pagination__item pagination__next"
                onClick={() => this.handleChange(page + 1)}
                key={pages}
            >
                &rsaquo;
            </button> :
            null;
    };

    render() {
        const { pages } = this.props;
        if (pages < 2) {
            return null;
        }
        return (
            <Fragment>
                { this.renderPrevious() }
                { this.renderPages() }
                { this.renderNext() }
            </Fragment>
        );
    }
}

Pagination.propTypes = {
    canNext: PropTypes.bool.isRequired,
    canPrevious: PropTypes.bool.isRequired,
    customPagination: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    pages: PropTypes.number.isRequired,
};

export default Pagination;
