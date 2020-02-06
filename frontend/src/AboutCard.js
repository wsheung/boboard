import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import clsx from 'clsx';

const drawerWidth = 240;

const muiTheme = createMuiTheme({
    palette: {
        type: "dark"
    }
});

const useStyles = makeStyles(theme => ({
    root: {
        minWidth: 400,
        maxWidth: 1000,
        minHeight: 200,
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
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
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    }
}));

export default function AboutCard(props) {
    const classes = useStyles();

    return (
        <MuiThemeProvider theme={muiTheme}>
            <div>
                <main
                    className={clsx(classes.content, {
                        [classes.contentShift]: props.open,
                    })}
                >
                    <div className={classes.drawerHeader} />
                    <Card className={classes.root} variant="outlined">
                        <CardContent>
                            <Typography className={classes.title} color="textSecondary" gutterBottom>
                                About BOBoard
                    </Typography>
                            <Typography variant="h5" component="h2">
                                BOBoard
                    </Typography>
                            <Typography component="a" href="https://forums.eveonline.com/t/sad-news-and-wormboard/90489" className={classes.pos} color="textSecondary">
                                A tribute to fetox74
                    </Typography>
                            <Typography variant="body2" component="p">
                                Thanks to fetox74 wormboard was born,
                    <br />
                                it was something special to all of us,
                    <br />
                                and now BOBoard hopes to carry on his inspiration,
                    <br />
                                so his legacy can live on forever!
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button component="a" href="https://forums.eveonline.com/t/sad-news-and-wormboard/90489" size="small">Github Repo</Button>
                        </CardActions>
                    </Card>
                </main>
            </div>
        </MuiThemeProvider>
    );
}