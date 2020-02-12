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
        backgroundColor: 'transparent',
        borderTopLeftRadius: '2px',
        borderTopRightRadius: '2px',
        border: '0px'
    }
}));

const StyledTabs = withStyles({
    indicator: {
        display: 'flex',
        justifyContent: 'center',
        '& > div': {
            width: '100%',
            backgroundColor: 'white'
        },
    },
})(props => <Tabs {...props} style={{ background: 'transparent' }} variant="scrollable" TabIndicatorProps={{ children: <div /> }} />);

const MONTHMAPPING = ["NA", "Jan", "Feb", "Mar", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
 
const MonthTab = React.memo((props) => {
    const classes = useStyles();
    const tabData = props.tabData; // need to implement sort function
    const selectedTab = props.selectedTab;
    var index = -1;

    const handleChange = (event, newValue) => {
        if (selectedTab !== newValue) {
            props.callbackFromParent(newValue);
        }
    };

    return (
        <Paper className={classes.root}>
            <AppBar position="static" style={{ background: 'transparent', boxShadow: 'none' }}>
                <StyledTabs
                    value={selectedTab == null ? 0 : selectedTab}
                    onChange={handleChange}
                    scrollButtons="on"
                    aria-label="scrollable on tabs"
                >
                    {tabData && tabData.map(tab => {
                        const tabName = MONTHMAPPING[tab._id._month] + " " + tab._id._year;
                        index++;
                        return(
                            <Tab key={tabName} style={{
                                borderTopLeftRadius: '5px',
                                borderTopRightRadius: '5px',
                                borderRightColor: '#131313',
                                borderRightWidth: '20px',
                                backgroundColor: '#191f24',
                            }} label={tabName} {...a11yProps(index)} />
                        );
                    })}
                </StyledTabs>
            </AppBar>
        </Paper>
    );
});
//MonthTab.whyDidYouRender = true;

export default MonthTab;