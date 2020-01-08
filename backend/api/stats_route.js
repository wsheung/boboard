const express = require('express');
const Stats = require('../Models/killmailModel');
const statsRouter = express.Router();


// get all stats
statsRouter.route('')
    .get((req, res) => {
        Stats.find({}, (err, item) => {
            res.json(item)
        })
    });


statsRouter.route('/top100')
    .get((req, res) => {
        Stats.find({}, (err, item) => {
            res.json(item)
        })
    });

module.exports = statsRouter;