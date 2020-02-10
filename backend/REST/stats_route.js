const express = require('express');
const Stats = require('../Models/killmailModel');
const statsRouter = express.Router();


// get all stats
statsRouter.route('/')
    .get((req, res) => {
        Stats.find({}, (err, item) => {
            res.json(item)
        })
    });


statsRouter.route('/top100')
    .get((req, res) => {
        Stats.find({ isNPC: false }).sort({ netPoints: -1 }).limit(100).exec((err, item) => {
            res.json(item);
        });
    });

statsRouter.route('/monthyear')
    .get((req, res) => {
        var month = req.query.month;
        var year = req.query.year;
        var result = {};
        Stats.find({ _year: year, _month: month, isNPC: false, completed: true }).sort({ iskKilled: -1 }).limit(200).exec((err, item) => {
            //res.json(item);
            result.stats = item;
            Stats.aggregate([
                { "$match": { "completed": true, "isNPC": false } },
                { "$group": { "_id": { _year: "$_year", _month: "$_month" } } }, {
                    $sort:
                        { "_id": 1 }
                },
            ]).exec((err, item) => {
                result.range = item;
                res.json(result);
            });
        });
    });

statsRouter.route('/timeRange')
    .get((req, res) => {
        Stats.aggregate([
            { "$match": { "completed": true, "isNPC": false } },
            { "$group": { "_id": { _year: "$_year", _month: "$_month" } } }, {
                $sort:
                    { "_id": 1 }
            },
        ]).exec((err, item) => {
            res.json(item);
        });
    });

module.exports = statsRouter;