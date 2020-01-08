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
        height: '1000vh',
    },
    root: {
        display: 'flex'
    },
    table: {
    }
});

function createRow(corpid, killCount, lossCount, iskKilled, iskLossed, activePVPCount, totalMember, netPoints) {
    const netKill = killCount - lossCount;
    const netIsk = iskKilled - iskLossed;
    const activePVPRatio = activePVPCount/ totalMember * 100;
    return { corpid, killCount, lossCount, netKill, iskKilled, iskLossed, netIsk, activePVPRatio, activePVPCount, totalMember, netPoints };
}


const rows = [
    createRow('Hard Hawks', 150, 60, 100, 40, 15, 60, 16.0),
    createRow('Lazer Citizens', 250, 60, 100, 40, 15, 60, 26.0),
    createRow('KIKI LOKI', 350, 160, 24, 40, 6, 60, 36.0),
    createRow('Scary Highsec people', 450, 60, 67, 40, 6, 60, 46.0),
    createRow('Yes Vacancy', 550, 60, 100, 40, 15, 60, 56.0),
    createRow('Athanor Party', 650, 60, 100, 40, 15, 60, 66.0),
    createRow('ALL-IN', 750, 160, 24, 40, 6, 60, 76.0),
];

export default function SimpleTable() {
    const classes = useStyles;

    return (
        <Paper className={classes.root}>
            <TableContainer className={classes.container}>
                <Table className={classes.table} stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Corp</TableCell>
                            <TableCell align="right">Kill Count</TableCell>
                            <TableCell align="right">Loss Count</TableCell>
                            <TableCell align="right">Net Kill Count</TableCell>
                            <TableCell align="right">Isk Killed (M)</TableCell>
                            <TableCell align="right">Isk Lossed (M)</TableCell>
                            <TableCell align="right">Net Isk (M)</TableCell>
                            <TableCell align="right">Active PVP %</TableCell>
                            <TableCell align="right">Net Point</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map(row => (
                            <TableRow key={row.corpid}>
                                <TableCell component="th" scope="row">
                                    {row.corpid}
                                </TableCell>
                                <TableCell align="right">{row.killCount}</TableCell>
                                <TableCell align="right">{row.lossCount}</TableCell>
                                <TableCell align="right">{row.netKill}</TableCell>
                                <TableCell align="right">{row.iskKilled}</TableCell>
                                <TableCell align="right">{row.iskLossed}</TableCell>
                                <TableCell align="right">{row.netIsk}</TableCell>
                                <TableCell align="right">{row.activePVPRatio} %</TableCell>
                                <TableCell align="right">{row.netPoints}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
