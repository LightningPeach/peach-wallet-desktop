import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactTable from "react-table";
import { filterTypes } from "modules/filter";
import { DEFAULT_TABLE_RECORDS_PER_PAGE } from "config/consts";
import Filter from "components/filter";
import Pagination from "./pagination";

class RecordsTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            page: 0,
        };
    }

    onPageChange = (page) => {
        this.setState({ page });
    };

    handleFilterChange = () => {
        this.onPageChange(0);
    };

    renderEmptyList = () => {
        const { emptyPlaceholder } = this.props;
        return (
            <div className="placeholder_text">
                {emptyPlaceholder || "No records found"}
            </div>
        );
    };

    renderData = () => {
        const {
            title, emptyPlaceholder, source, filters, recordsPerPage, ...table
        } = this.props;
        return (
            <ReactTable
                {...table}
                page={this.state.page}
                resizable={false}
                showPageSizeOptions={false}
                defaultPageSize={recordsPerPage || DEFAULT_TABLE_RECORDS_PER_PAGE}
                PaginationComponent={Pagination}
                customPagination={this.onPageChange}
            />
        );
    };

    render() {
        const {
            title, source, filters, searchPlaceholder,
        } = this.props;

        return (
            <div className="records">
                {title &&
                    <div className="records__title" key={0}>
                        {title}
                    </div>
                }
                {filters &&
                    <Filter
                        onChange={this.handleFilterChange}
                        source={source}
                        filterKinds={filters}
                        searchPlaceholder={searchPlaceholder}
                    />
                }
                {!this.props.data.length
                    ? this.renderEmptyList()
                    : this.renderData()
                }
            </div>
        );
    }
}

RecordsTable.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({
        Header: PropTypes.any,
        accessor: PropTypes.any,
    })).isRequired,
    data: PropTypes.arrayOf(PropTypes.shape().isRequired).isRequired,
    emptyPlaceholder: PropTypes.string,
    filters: PropTypes.arrayOf(PropTypes.oneOf(filterTypes.FILTER_KIND_LIST)),
    recordsPerPage: PropTypes.number,
    searchPlaceholder: PropTypes.string,
    source: PropTypes.oneOf(filterTypes.FILTER_SOURCES),
    title: PropTypes.string,
};

export default RecordsTable;
