import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <Typography
            component="div"
            role="tabpanel"
            hidden={value !== index}
            id={`scrollable-auto-tabpanel-${index}`}
            aria-labelledby={`scrollable-auto-tab-${index}`}
            {...other}
        >
            {value === index && <Box p={3}>{children}</Box>}
        </Typography>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

function a11yProps(index) {
    return {
        id: `scrollable-auto-tab-${index}`,
        'aria-controls': `scrollable-auto-tabpanel-${index}`,
    };
}

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        overflowX: 'auto',
        backgroundColor: theme.palette.background.paper,
    },
}));


export default function MonthTab() {
    const classes = useStyles();
    const initialTabIndex = 5; // we only display last 6 months of data
    const [value, setValue] = React.useState(initialTabIndex);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Paper className={classes.root}>
            <AppBar position="static" color="default">
                <Tabs
                    //style={{ maxWidth: '500px' }}
                    value={value}
                    onChange={handleChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="on"
                    aria-label="scrollable auto tabs example"
                >
                    <Tab label="Aug 2019" {...a11yProps(0)} />
                    <Tab label="Sept 2019" {...a11yProps(1)} />
                    <Tab label="Oct 2019" {...a11yProps(2)} />
                    <Tab label="Nov 2019" {...a11yProps(3)} />
                    <Tab label="Dec 2019" {...a11yProps(4)} />
                    <Tab label="Jan 2020" {...a11yProps(5)} />
                </Tabs>
            </AppBar>
        </Paper>
    );
}
