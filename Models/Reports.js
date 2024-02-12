const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
    },
});

const ReportsSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        unique: true,
    },
    hostname: {
        type: String,
        required: true,
    },
    reports: [ReportSchema], 
});

const Reports = mongoose.model('Reports', ReportsSchema);

module.exports = Reports;
