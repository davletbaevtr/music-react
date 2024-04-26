import React, {useEffect, useState} from 'react';
import {useTable, useSortBy} from 'react-table';
import key from "../../assets/key.svg";
import {ExpandLess, ExpandMore} from "@mui/icons-material";

function RoomTable({data, handleRowClickOuter}) {
    const [selectedRow, setSelectedRow] = useState(null);

    function handleRowClick(roomId) {
        setSelectedRow(roomId);
        handleRowClickOuter(roomId);
    }

    const columns = React.useMemo(() => [
        {
            Header: 'Название',
            accessor: 'name'
        },
        {
            Header: 'Доступ',
            accessor: 'has_password',
            Cell: ({value}) => (value ? <img style={{marginLeft: 20}} src={key} alt={'key'}/> : ''),
            style: {width: '75px'}
        }
    ], []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({columns, data}, useSortBy);

    return (
        <div style={{
            border: '1px solid rgba(0, 0, 0, 0.23)',
            height: 'calc(100vh - 255px)',
            overflow: "auto",
            borderRadius: 15,
            position: 'relative'
        }} className={'custom-scroll'}>
            <table {...getTableProps()} style={{width: "100%", borderCollapse: 'collapse'}}>
                <thead>
                {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}
                        style={{borderRight: '2px solid rgba(255, 255, 255, 1)', cursor: "pointer"}}>
                        {headerGroup.headers.map(column => (
                            <th {...column.getHeaderProps(column.getSortByToggleProps())} style={{
                                ...column.style,
                                textAlign: "left",
                                borderRight: '1px solid rgba(0,0,0,0.12)',
                                paddingLeft: 10,
                                paddingTop: 10,
                                paddingBottom: 10
                            }}>
                                {column.render('Header')}
                                {column.isSorted ? (column.isSortedDesc ?
                                    <ExpandMore style={{width: 18, height: 17}}/> :
                                    <ExpandLess style={{width: 18, height: 17}}/>) : ''}
                            </th>
                        ))}
                    </tr>
                ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                {rows.map(row => {
                    prepareRow(row);
                    return (
                        <tr {...row.getRowProps()} onClick={() => handleRowClick(row.original.room_id)}
                            className={`room-row ${row.original.room_id === selectedRow ? 'selected' : ''}`}>
                            {row.cells.map(cell => {
                                return <td {...cell.getCellProps()} style={{
                                    border: '1px solid rgba(0,0,0,0.12)',
                                    paddingLeft: 10,
                                    height: 47
                                }}>{cell.render('Cell')}</td>;
                            })}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

export default RoomTable;
