import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { lighten, makeStyles, withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Switch from '@material-ui/core/Switch';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';

function createData(_corpName, _corpTicker, _killCount, _lossCount, _iskKilled, _iskLossed, _activePVPCount, _totalMember, _netPoints) {
  const corpName = _corpName || 0;
  const corpTicker = _corpTicker || 0;
  const corpNameTicker = "[" + corpTicker + "] " + corpName;  
  const killCount = _killCount || 0;
  const lossCount = _lossCount || 0;
  const iskKilled = Math.round(_iskKilled || 0);
  const iskLossed = Math.round(_iskLossed || 0);
  const activePVPCount = _activePVPCount || 0;
  const totalMember = _totalMember || 0;
  const netPoints = _netPoints || 0;

  const netKill = killCount - lossCount;
  const netIsk = Math.round(iskKilled - iskLossed);
  const activePVPRatio = Math.round(activePVPCount / totalMember * 100);

  return { corpNameTicker, killCount, lossCount, netKill, iskKilled, iskLossed, netIsk, activePVPRatio, activePVPCount, totalMember, netPoints  };
}


function createTable(data) {
  let newTable = [];
  data.forEach(corp => {
    newTable.push(createData(corp._corpName, corp._corpTicker, corp.killCount, corp.lossCount, corp.iskKilled, corp.iskLossed, corp.activePVP.length, corp.totalMember, corp.netPoints));
  });
  return newTable;
}

function numberWithCommas(x) {
  if (Math.abs(x) / 1000000 >= 1) {
    x = Math.round(x / 1000000);
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " M";
  } else {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

function desc(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function stableSort(array, cmp) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = cmp(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map(el => el[0]);
}

function getSorting(order, orderBy) {
  return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

const headCells = [
  { id: 'corpNameTicker', numeric: false, disablePadding: false, label: 'Corporation' },
  { id: 'netPoints', numeric: true, disablePadding: false, label: 'Net Point' },
  { id: 'killCount', numeric: true, disablePadding: false, label: 'Kill Count' },
  { id: 'lossCount', numeric: true, disablePadding: false, label: 'Loss Count' },
  { id: 'netKill', numeric: true, disablePadding: false, label: 'Net Kill Count' },
  { id: 'iskKilled', numeric: true, disablePadding: false, label: 'Isk Killed' },
  { id: 'iskLossed', numeric: true, disablePadding: false, label: 'Isk Lossed' },
  { id: 'netIsk', numeric: true, disablePadding: false, label: 'Net Isk' },
  { id: 'activePVPCount', numeric: true, disablePadding: false, label: 'Active PVP' },
];


const styles = {
  tableStickyHeader: {
    backgroundColor: '#242b33',
  },
  tableStickyHeaderText: {
    color: 'white',
  },
  tableCellStyle: {
    backgroundColor: 'rgba(46,56,66,1)',
    color: 'white'
  },
}

const StyledSortLabel = withStyles({
  root: {
    color: 'white',
    "&:hover": {
      color: 'white',
    },
    '&$active': {
      color: 'white',
    },
  },
  active: {},
  icon: {
    color: 'inherit !important'
  },
})(props => <TableSortLabel {...props} />);


function EnhancedTableHead(props) {
  const { classes, order, orderBy, onRequestSort } = props;
  const createSortHandler = property => event => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map(headCell => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'default'}
            sortDirection={orderBy === headCell.id ? order : false}
            style={styles.tableStickyHeader}
          >
            <StyledSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              style={styles.tableStickyHeaderText}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}
            </StyledSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};

const useToolbarStyles = makeStyles(theme => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  title: {
    flex: '1 1 100%',
  },
}));

const EnhancedTableToolbar = props => {
  const classes = useToolbarStyles();
  const { numSelected } = props;

  return (
    <Toolbar
      className={clsx(classes.root, {
        [classes.highlight]: numSelected > 0,
      })}
    >
      {numSelected > 0 ? (
        <Typography className={classes.title} color="inherit" variant="subtitle1">
          {numSelected} selected
        </Typography>
      ) : (
        <Typography className={classes.title} variant="h6" id="tableTitle">
          Wormboard
        </Typography>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton aria-label="delete">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton aria-label="filter list">
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
};

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
    background: 'transparent'
  },
  table: {
    minWidth: 750,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
  container: {
    maxHeight: 600,
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
  }
}));


export default function EnhancedTable({ data }) {
  const classes = useStyles();
  var rows = createTable(data);
  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('netPoints');
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };


  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeDense = event => {
    setDense(event.target.checked);
  };

  const handleClick = (event, corpName) => {
    console.log(corpName);
  }

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <TableContainer className={classes.container}>
          <Table
            stickyHeader
            className={classes.table}
            aria-labelledby="tableTitle"
            size={dense ? 'small' : 'medium'}
            aria-label="enhanced table"
          >
            <EnhancedTableHead
              classes={classes}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {stableSort(rows, getSorting(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      key={row.corpNameTicker}
                      hover
                      role="checkbox"
                    >
                      <TableCell style={styles.tableCellStyle} component="th" id={labelId} scope="row">
                        {row.corpNameTicker}
                      </TableCell>
                      <TableCell style={styles.tableCellStyle} align="right">{row.netPoints}</TableCell>
                      <TableCell style={styles.tableCellStyle} align="right">{row.killCount}</TableCell>
                      <TableCell style={styles.tableCellStyle} align="right">{row.lossCount}</TableCell>
                      <TableCell style={styles.tableCellStyle} align="right">{row.netKill}</TableCell>
                      <TableCell style={styles.tableCellStyle} align="right">{numberWithCommas(row.iskKilled)}</TableCell>
                      <TableCell style={styles.tableCellStyle} align="right">{numberWithCommas(row.iskLossed)}</TableCell>
                      <TableCell style={styles.tableCellStyle} align="right">{numberWithCommas(row.netIsk)}</TableCell>
                      <TableCell style={styles.tableCellStyle} align="right">{row.activePVPCount}</TableCell>
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: (dense ? 33 : 53) * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          style={{
            color: 'white',
            backgroundColor: '#242b33'
          }} 
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onChangePage={handleChangePage}
          onChangeRowsPerPage={handleChangeRowsPerPage}
        />
      </Paper>
      {/* <FormControlLabel
        control={<Switch checked={dense} onChange={handleChangeDense} />}
        label="Dense padding"
      /> */}
    </div>
  );
}
