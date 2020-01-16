var mongoose = require('mongoose');
// Setup schema

var corpKMSchema = mongoose.Schema({
    _year: {
        type: Number,
        required: true,
    },
    _month: {
        type: Number,
        required: true,
    },
    _corpid: {
        type: String,
        required: true,
    },
    _corpName: {
        type: String,
    },
    _corpTicker: {
        type: String,
    },
    isNPC: {
        type: Boolean
    },
    population: {
        type: Number
    },
    killCount: {
        type: Number
    },
    lossCount: {
        type: Number
    },
    iskKilled: {
        type: Number
    },
    iskLossed: {
        type: Number
    },
    activePVP: [String],
    totalMember: {
        type: Number
    },
    netPoints: {
        type: Number
    }
}, { collection: 'killmails' });

corpKMSchema.index({ _year: 1, _month: 1, _corpid: 1 }, { unique: true });

var corpKMSchema = module.exports = mongoose.model('corpKMSchema', corpKMSchema);