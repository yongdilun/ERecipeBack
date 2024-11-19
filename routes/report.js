const express = require('express');
const router = express.Router();
const { Report } = require('../models/Index.js');

// Create a new report
router.post('/create', async (req, res) => {
    try {
        const { reporter, reportedContentId, reportedContentType, reason, description } = req.body;

        const newReport = new Report({
            reporter,
            reportedContentId,
            reportedContentType,
            reason,
            description,
            status: 'pending'
        });

        await newReport.save();

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            data: newReport
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting report',
            error: error.message
        });
    }
});

// Get reports for specific content
router.get('/content/:contentId', async (req, res) => {
    try {
        const { contentId } = req.params;
        const reports = await Report.find({ 
            reportedContentId: contentId 
        }).populate('reporter', 'username');

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

module.exports = router;
