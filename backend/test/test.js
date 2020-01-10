var assert = require('assert');
const mongoose = require('mongoose');
var request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const app = express();
var rp = require('request-promise');
var _ = require('lodash');

const mon = require('../mongoose.js');

// set up mongoose models
const Corp = require('../Models/corpModel.js');
const corpKMSchema = require('../Models/killmailModel.js');


// set up express
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// use Test DB rather than the usual main db to avoid polluting existing data
var conn = mongoose.connect('mongodb://localhost:27017/MyDb', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

before(function (done) {
    // clearing db first
    mongoose.connection.on('connected', function () {
        mongoose.connection.db.dropDatabase();
    });
    done();
});

// TODO : Better test coverage is needed

describe('Creating corporations', () => {
        it('should create new corporation entries in corporations collection and check if they exist', async () => {
            await Promise.all([
                mon.addNewCorp(1, '123', 'testing corp test corp1', 'test1'),
                mon.addNewCorp(1, '234', 'testing corp test corp2', 'test2'),
                mon.addNewCorp(1, '345', 'testing corp test corp3', 'test3'),
                mon.addNewCorp(1, '456', 'testing corp test corp4', 'test4')
            ]);

            const result1 = await mon.corpExistInDB('123');
            assert.equal(true, result1);

            const result2 = await mon.corpExistInDB('234');
            assert.equal(true, result2);

            const result3 = await mon.corpExistInDB('345');
            assert.equal(true, result3);

            const result4 = await mon.corpExistInDB('456');
            assert.equal(true, result4);
        });
});