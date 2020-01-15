const express = require('express');
const Corps = require('../Models/corpModel');
const corpsRouter = express.Router();


// get all stats
corpsRouter.route('')
    .get((req, res) => {
        Corps.find({}, (err, item) => {
            res.json(item)
        })
    });


corpsRouter.route('/top100')
    .get((req, res) => {
        Corps.find({}, (err, item) => {
            res.json(item)
        })
    });

module.exports = corpsRouter;