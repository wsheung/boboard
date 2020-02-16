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
        type: Number,
        required: true,
    },
    _corpName: {
        type: String,
    },
    _corpTicker: {
        type: String,
    },
    allianceid: {
        type: Number,
    },
    allianceTicker: {
        type: String
    },
    alliance: {
        type: String
    },
    isNPC: {
        type: Boolean
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
    activePVP: [Number],
    processedKMID: [Number],
    completed: {
        type: Boolean,
        default: false
    },
    totalMember: {
        type: Number
    },
    netPoints: {
        type: Number
    },
    lastUpdate: {
	type: Date, 
	default: Date.now
    }
}, { collection: 'killmails' });

corpKMSchema.index({ _year: 1, _month: 1, _corpid: 1 }, { unique: true });

var corpKMSchema = module.exports = mongoose.model('corpKMSchema', corpKMSchema);
