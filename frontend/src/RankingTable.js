import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import isEqual from 'react-fast-compare';

import MonthTab from './MonthTab.js';
import CorpTable from './table';
import { config } from './config.js';

import axios from 'axios';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        height: '100vh',
        width: '100vw',
    },
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    },
    content: {
        flexGrow: 1,
        width: '100%',
        padding: theme.spacing(3),
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: -drawerWidth,
    },
    contentShift: {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
    },
}));

const RankingTable = React.memo((props) => {
    const classes = useStyles();
    const theme = useTheme();
    const [data, setData] = useState([]);
    const [tabData, setTabData] = useState([]);
    const [selectedTab, setSelectedTab] = useState(null);

    useEffect(() => {
        function fetchData(m, y) {
            axios.get(
                config.baseUrl + '/stats/monthyear',
                {
                    params: {
                        year: y,
                        month: m
                    }
                }
            )
                .then(res => {
                    if (!isEqual(res.data.stats, data)) {
                        setData(res.data.stats);
                    }
                    if (selectedTab == null && res != null) {
                        setTabData(res.data.range)
                        setSelectedTab(res.data.range.length - 1);
                    }
                })
                .catch(err => {
                    console.log(err);
                })
        }
        const date = new Date();
        const year = tabData.length !== 0 ? tabData[selectedTab]._id._year : date.getUTCFullYear();
        const month = tabData.length !== 0 ? tabData[selectedTab]._id._month : date.getUTCMonth() + 1;
        fetchData(month, year);
    }, [selectedTab]);

    const myCallBack = (childData) => {
        if (childData !== selectedTab) {
            setSelectedTab(childData);
        }
    }

    return (
        <div className={classes.root}>
            <main
                className={clsx(classes.content, {
                    [classes.contentShift]: props.open,
                })}
            >
                <div className={classes.drawerHeader} />
                <Grid justify="center" alignItems="flex-start" direction="row" container>
                    <Grid item lg={12} xs={12} sm={12}>
                        <Grid item>
                            <MonthTab selectedTab={selectedTab} tabData={tabData} callbackFromParent={myCallBack} />
                        </Grid>
                        <Grid item>
                            <CorpTable searchValue={props.searchValue} data={data} />
                        </Grid>
                    </Grid>
                </Grid>
            </main>
        </div>
    );
});
//RankingTable.whyDidYouRender = true;

export default RankingTable;
