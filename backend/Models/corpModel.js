var mongoose = require('mongoose');
// Setup schema
var corpSchema = mongoose.Schema({
    corpid: {
        type: String,
        required: true,
        unique: true
    },
    corpName: {
        type: String,
        required: true,
        unique: true
    },
    corpTicker: {
        type: String,
        required: true,
        unique: true
    }
}, { collection: 'corporations' });

var corpSchema = module.exports = mongoose.model('corporation', corpSchema);