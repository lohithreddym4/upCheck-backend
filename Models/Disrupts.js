const mongoose = require('mongoose');

const DisruptSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
    },
});

const Disrupt = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        unique: true,
    },    hostname: {
        type: String,
        required: true,
    },
    disrupts: [DisruptSchema], 
});

const Reports = mongoose.model('Disrupt', Disrupt);

module.exports = Reports;
