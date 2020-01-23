import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { fade, makeStyles, useTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import SearchIcon from '@material-ui/icons/Search';
import InputBase from '@material-ui/core/InputBase';

import MonthTab from './MonthTab.js';
import EnhancedTable from './table';
import { config } from './config.js';

import axios from 'axios';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        overflowX: 'auto',
        height: '100vh',
        width: '100vw',
    },
    appBar: {
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        backgroundColor: '#191f24'
    },
    appBarShift: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    hide: {
        display: 'none',
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {  // this is the actual paper to color
        width: drawerWidth,
        backgroundColor: '#202020',
        borderRightWidth: '1px',
        borderRightColor: '#333333'
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
    drawerListText: {
        color: '#ffffff'
    },
    title: {
        flexGrow: 1,
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        }
    },
    searchIcon: {
        width: theme.spacing(7),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(1),
            width: 'auto',
        },
    },
    inputRoot: {
        color: 'inherit',
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 7),
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            width: 120,
            '&:focus': {
                width: 200,
            },
        },
    },
}));




export default function Main() {
    const classes = useStyles();
    const theme = useTheme();
    const [open, setOpen] = React.useState(false);
    const [data, setData] = useState([]);
    const [tabData, setTabData] = useState([]);
    const [selectedTab, setSelectedTab] = useState(null);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };


    useEffect(() => {
        async function fetchData(m, y) {
            const result = await axios(
                config.baseUrl + '/stats/monthyear',
                {
                    params: {
                        year: y,
                        month: m
                    }
                }
            );
            setData(result.data);
        }
        async function fetchTabs() {
            const result = await axios(
                config.baseUrl + '/stats/timerange',
            );
            setTabData(result.data);
        }
        if (selectedTab == null) {
            let today = new Date();
            let month = today.getUTCMonth() + 1;
            let year = today.getUTCFullYear();
            fetchTabs();
            fetchData(month, year);
        } else {
            const year = tabData[selectedTab]._id._year;
            const month = tabData[selectedTab]._id._month;
            fetchData(month, year);
        }
    }, [tabData, selectedTab]);



    const myCallBack = (dataFromChild) => {
        changeSelectedTab(dataFromChild);
    }

    const changeSelectedTab = async (data) => {
        setSelectedTab(data);
    }

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar
                position="fixed"
                className={clsx(classes.appBar, {
                    [classes.appBarShift]: open,
                })}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        className={clsx(classes.menuButton, open && classes.hide)}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography className={classes.title} variant="h3" noWrap>
                        Wormboard
                    </Typography>
                    <div className={classes.search}>
                        <div className={classes.searchIcon}>
                            <SearchIcon />
                        </div>
                        <InputBase
                            placeholder="Search…"
                            classes={{
                                root: classes.inputRoot,
                                input: classes.inputInput,
                            }}
                            inputProps={{ 'aria-label': 'search' }}
                        />
                    </div>
                </Toolbar>
            </AppBar>
            <Drawer
                className={classes.drawer}
                variant="persistent"
                anchor="left"
                open={open}
                classes={{
                    paper: classes.drawerPaper,
                }}
            >
                <div className={classes.drawerHeader}>
                    <IconButton className={classes.drawerListText} onClick={handleDrawerClose}>
                        {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                </div>
                <Divider />
                <List>
                    {['Home'].map((text, index) => (
                        <ListItem button key={text}>
                            <ListItemIcon className={classes.drawerListText} >{index % 1 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                            <ListItemText className={classes.drawerListText} primary={text} />
                        </ListItem>
                    ))}
                </List>
                <Divider />
                <List>
                    {['About Wormboard', ].map((text, index) => (
                        <ListItem button key={text}>
                            <ListItemIcon className={classes.drawerListText}>{index % 1 !== 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                            <ListItemText className={classes.drawerListText} primary={text} />
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <main
                className={clsx(classes.content, {
                    [classes.contentShift]: open,
                })}
            >
                <div className={classes.drawerHeader} />
                <Grid justify="center" alignItems="flex-start" direction="row" container>
                    <Grid item lg={12} xs={12} sm={12}>
                        <Grid item>
                            <MonthTab tabData={tabData} callbackFromParent={myCallBack}/>
                        </Grid>
                        <Grid item>
                            <EnhancedTable data={data} />
                        </Grid>
                    </Grid>
                </Grid>
            </main>
        </div>
    );
};