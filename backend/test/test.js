var assert = require('assert');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

import {
    findAndInsertNewMonth,
    corpExistInDB
} from '../API/mongodb';

// set up express
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// use Test DB rather than the usual main db to avoid polluting existing data
var conn = mongoose.connect('mongodb://localhost:27017/Test', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

before(function (done) {
    // clearing db first
    mongoose.connection.on('connected', function () {
        mongoose.connection.db.dropDatabase();
    });
    done();
});

// TODO : Better test coverage is needed

describe('Creating corporations', async () => {
        it('should create new corporation entries in killmail collection and confirm that they exist', async () => {
            await Promise.all([
                findAndInsertNewMonth(2019, 12, 98290394),
                findAndInsertNewMonth(2019, 11, 98040755)
            ]);

            const result1 = await corpExistInDB(2019, 12, 98290394);
            assert.equal(true, result1);

            const result2 = await corpExistInDB(2019, 11, 98040755);
            assert.equal(true, result2);
        });
});