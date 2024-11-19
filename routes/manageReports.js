const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// Get all reports
router.get('/reports', async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'username')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reports',
            error: error.message
        });
    }
});

// Get single report by ID
router.get('/reports/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const report = await Report.findById(reportId)
            .populate('reporter', 'username');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching report',
            error: error.message
        });
    }
});

// Update report status
router.put('/reports/:reportId/status', async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status } = req.body;

        const report = await Report.findByIdAndUpdate(
            reportId,
            { status },
            { new: true }
        ).populate('reporter', 'username');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating report status',
            error: error.message
        });
    }
});

module.exports = router;
