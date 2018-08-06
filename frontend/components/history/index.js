import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ReactTable from "react-table";
import Pagination from "./pagination";

class History extends Component {
    constructor(props) {
        super(props);
        this.onPageChange = this.onPageChange.bind(this);
        this.renderEmptyList = this.renderEmptyList.bind(this);
        this.state = {
            page: 0,
        };
    }

    onPageChange(i) {
        this.setState({ page: i });
    }

    renderEmptyList() {
        const { emptyPlaceholder } = this.props;
        return (
            <div className="placeholder_text">
                {emptyPlaceholder || "Here all your transactions will be displayed"}
            </div>
        );
    }

    render() {
        const renderData = () => (
            <ReactTable
                {...this.props}
                page={this.state.page}
                resizable={false}
                showPageSizeOptions={false}
                defaultPageSize={5}
                PaginationComponent={Pagination}
                customPagination={this.onPageChange}
            />
        );
        const renderTitle = () => {
            if (this.props.withoutTitle) {
                return null;
            }
            return [
                <div className="history__title" key={0}>History</div>,
                <div className="separator" key={1} />,
            ];
        };

        return (
            <div className="history">
                {renderTitle()}
                {!this.props.data.length ? this.renderEmptyList() : renderData()}
            </div>
        );
    }
}

History.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({
        Header: PropTypes.any,
        accessor: PropTypes.any,
    })).isRequired,
    data: PropTypes.arrayOf(PropTypes.shape().isRequired).isRequired,
    dispatch: PropTypes.func.isRequired,
    emptyPlaceholder: PropTypes.string,
    withoutTitle: PropTypes.bool,
};

export default connect()(History);
