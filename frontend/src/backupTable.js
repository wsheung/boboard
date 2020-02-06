import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

const useStyles = makeStyles({
    container: {
        height: '100vh',
    },
    root: {
        display: 'flex'
    },
    tableStickyHeader: {
        color: '#000000',
        backgroundColor: '#000000'
    }
});

const styles = {
    tableStickyHeader: {
        backgroundColor: '#000000',
        color: 'white',
        fontWeight: 500,
        fontSize: 15
    },
    tableRow: {
        backgroundColor: '#424242',
        color: 'white'
    }
}

function numberWithCommas(x) {
    if (Math.abs(x) / 1000000000 >= 1) {
        x = Math.round(x / 1000000000);
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " B";
    } else {
        if (Math.abs(x) / 1000000 >= 1) {
            x = Math.round(x / 1000000);
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " M";
        } else {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
    }

}

function createRow(_corpid, _killCount, _lossCount, _iskKilled, _iskLossed, _activePVPCount, _totalMember, _netPoints) {
    const corpid = _corpid || 0;
    const killCount = _killCount || 0;
    const lossCount = _lossCount || 0;
    const iskKilled = Math.round(_iskKilled || 0);
    const iskLossed = Math.round(_iskLossed || 0);
    const activePVPCount = _activePVPCount || 0;
    const totalMember = _totalMember || 0;
    const netPoints = _netPoints || 0;

    const netKill = killCount - lossCount;
    const netIsk = Math.round(iskKilled - iskLossed);
    const activePVPRatio = Math.round(activePVPCount/ totalMember * 100);
    return { corpid, killCount, lossCount, netKill, iskKilled, iskLossed, netIsk, activePVPRatio, activePVPCount, totalMember, netPoints };
}


// const rows = [
//     createRow('Hard Hawks', 150, 60, 100, 40, 15, 60, 16.0),
//     createRow('Lazer Citizens', 250, 60, 100, 40, 15, 60, 26.0),
//     createRow('KIKI LOKI', 350, 160, 24, 40, 6, 60, 36.0),
//     createRow('Scary Highsec people', 450, 60, 67, 40, 6, 60, 46.0),
//     createRow('Yes Vacancy', 550, 60, 100, 40, 15, 60, 56.0),
//     createRow('Athanor Party', 650, 60, 100, 40, 15, 60, 66.0),
//     createRow('ALL-IN', 750, 160, 24, 40, 6, 60, 76.0),
// ];

function createTable(data) {
    let newTable = [];
    data.forEach(corp => {
        newTable.push(createRow(corp._corpid, corp.killCount, corp.lossCount, corp.iskKilled, corp.iskLossed, corp.activePVP.length, corp.totalMember, corp.netPoints));
    });
    return newTable;
}

export default function SimpleTable({ data }) {
    const classes = useStyles;
    var rows = createTable(data);
    console.log(data);
    
    return (
        <Paper className={classes.root}>
            <TableContainer className={classes.container}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell style={styles.tableStickyHeader}>Corp</TableCell>
                            <TableCell style={styles.tableStickyHeader} align="right">Kill Count</TableCell>
                            <TableCell style={styles.tableStickyHeader} align="right">Loss Count</TableCell>
                            <TableCell style={styles.tableStickyHeader} align="right">Net Kill Count</TableCell>
                            <TableCell style={styles.tableStickyHeader} align="right">Isk Killed (M)</TableCell>
                            <TableCell style={styles.tableStickyHeader} align="right">Isk Lossed (M)</TableCell>
                            <TableCell style={styles.tableStickyHeader} align="right">Net Isk (M)</TableCell>
                            <TableCell style={styles.tableStickyHeader} align="right">Active PVP %</TableCell>
                            <TableCell style={styles.tableStickyHeader} align="right">Net Point</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow key={row.corpid}>
                                <TableCell style={styles.tableRow} component="th" scope="row">
                                    {row.corpid}
                                </TableCell>
                                <TableCell style={styles.tableRow} align="right">{row.killCount}</TableCell>
                                <TableCell style={styles.tableRow} align="right">{row.lossCount}</TableCell>
                                <TableCell style={styles.tableRow} align="right">{row.netKill}</TableCell>
                                <TableCell style={styles.tableRow} align="right">{numberWithCommas(row.iskKilled)}</TableCell>
                                <TableCell style={styles.tableRow} align="right">{numberWithCommas(row.iskLossed)}</TableCell>
                                <TableCell style={styles.tableRow} align="right">{numberWithCommas(row.netIsk)}</TableCell>
                                <TableCell style={styles.tableRow} align="right">{row.activePVPRatio} %</TableCell>
                                <TableCell style={styles.tableRow} align="right">{row.netPoints}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
