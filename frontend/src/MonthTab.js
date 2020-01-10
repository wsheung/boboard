import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles } from '@material-ui/core/styles';
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

const styles = {
    tabStyle: {
        
    }
}

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
    }
}));

const StyledTabs = withStyles({
    indicator: {
        display: 'flex',
        justifyContent: 'center',
        '& > div': {
            width: '100%',
            backgroundColor: '#BB86FC',
        },
    },
})(props => <Tabs {...props} style={{ backgroundColor: '#424242' }} variant="scrollable" TabIndicatorProps={{ children: <div /> }} />);


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
                <StyledTabs
                    value={value}
                    onChange={handleChange}
                    scrollButtons="on"
                    aria-label="scrollable on tabs"
                >
                    <Tab style={{ color: "white" }} label="Aug 2019" {...a11yProps(0)} />
                    <Tab style={{ color: "white" }} label="Sept 2019" {...a11yProps(1)} />
                    <Tab style={{ color: "white" }} label="Oct 2019" {...a11yProps(2)} />
                    <Tab style={{ color: "white" }} label="Nov 2019" {...a11yProps(3)} />
                    <Tab style={{ color: "white" }} label="Dec 2019" {...a11yProps(4)} />
                    <Tab style={{ color: "white" }} label="Jan 2020" {...a11yProps(5)} />
                </StyledTabs>
            </AppBar>
        </Paper>
    );
}
