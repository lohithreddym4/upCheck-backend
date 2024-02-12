const express = require('express');
const router = express.Router();
const upCheck = require('../upCheck/upCheck.js');
const Website = require('../Models/Websites.js');
const Reports=require('../Models/Reports.js')
const Disrupts=require('../Models/Disrupts.js')

router.post('/add-website', async (req, res) => {
    try {
        let { name, url } = req.body;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }
        const hostname = new URL(url).hostname;
        const existingSite = await Website.findOne({ hostname });
        if (existingSite) {
            return res.send("Website already exists");
        } else {
            const newSite = new Website({ name, url, hostname });
            await newSite.save();
            return res.send("Website added");
        }
    } catch (error) {
        console.error('Error adding website:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.get('/get-all-websites', async (req, res) => {
    try {
        const websites = await Website.find().select('name url');
        res.send(websites);
    } catch (error) {
        console.error('Error fetching websites:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/delete-website', async (req, res) => {
    try {
        let { url } = req.body;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }
        const existingSite = await Website.findOne({ hostname: new URL(url).hostname});
        if (!existingSite) {
            return res.send("Website does not exist");
        } else {
            await Website.deleteOne({ hostname: new URL(url).hostname});
            return res.send("Website Deleted");
        }
    } catch (error) {
        console.error('Error deleting website:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.get('/get-status', async (req, res) => {
    try {
        let { url } = req.body;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }
        const status = await upCheck(url);
        res.send(status);
    } catch (error) {
        console.error('Error getting status:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/add-comment', async (req, res) => {
    try {
        let { url, comment, user } = req.body;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }
        const website = await Website.findOne({ url });

        if (!website) {
            return res.status(404).send("Website not found");
        }

        const newComment = {
            text: comment,
            user: user,
            createdAt: new Date().toUTCString(),
            upvotes: 0,
        };

        website.comments.push(newComment);
        await website.save();
        res.send("Comment added successfully");
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/delete-comment', async (req, res) => {
    try {
        let { url, commentId } = req.body;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }
        const website = await Website.findOne({ hostname: new URL(url).hostname});

        if (!website) {
            return res.status(404).send("Website not found");
        }

        await website.comments.pull({ _id: commentId });

        await website.save();
        res.send("Comment deleted successfully");
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/upvote-comment', async (req, res) => {
    try {
        let  { url, commentId } = req.body;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }
        const website = await Website.findOne({ hostname: new URL(url).hostname});

        if (!website) {
            return res.status(404).send("Website not found");
        }

        const comment = website.comments.id(commentId);
        if (!comment) {
            return res.status(404).send("Comment not found");
        }

        comment.upvotes += 1;
        await website.save();
        res.send("Comment upvoted successfully");
    } catch (error) {
        console.error('Error upvoting comment:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/downvote-comment', async (req, res) => {
    try {
        let { url, commentId } = req.body;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }
        const website = await Website.findOne({ url });

        if (!website) {
            return res.status(404).send("Website not found");
        }

        const comment = website.comments.id(commentId);
        if (!comment) {
            return res.status(404).send("Comment not found");
        }

        comment.upvotes -= 1; // Assuming you allow downvotes to reduce upvotes
        await website.save();
        res.send("Comment downvoted successfully");
    } catch (error) {
        console.error('Error downvoting comment:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/add-report', async (req, res) => {
    try {
        let { url, feedback ,country} = req.body;
        let status=await upCheck(url);
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }
        const website = await Website.findOne({ hostname: new URL(url).hostname});

        if (!website) {
            return res.status(404).send("Website not found");
        }

        const newReport = {
            status: status,
            feedback: feedback,
            country:country,
            date: new Date().toUTCString()
        };

        website.reports.push(newReport);
        await website.save();
        res.send("Report added successfully");
    } catch (error) {
        console.error('Error adding report:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/remove-report', async (req, res) => {
    try {
        let { url, reportId } = req.body;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }
        const website = await Website.findOne({ hostname: new URL(url).hostname});

        if (!website) {
            return res.status(404).send("Website not found");
        }

        website.reports.pull({ _id: reportId });
        await website.save();
        res.send("Report removed successfully");
    } catch (error) {
        console.error('Error removing report:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.get('/get-reports', async (req, res) => {
    try {
        const reports = await Website.find({},'reports');
        res.send(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).send("Internal Server Error");
}})
router.get('/get-comments', async (req, res) => {
    try {
        const comments = await Website.find({},'comments');
        res.send(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/add-recent-report', async (req, res) => {
    try {
        let { url } = req.body;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }

        const newReport = {
            date: new Date().toUTCString(),
        };

        const existingReports = await Reports.findOne({ hostname:new URL(url).hostname });

        if (existingReports) {
            existingReports.reports[0].date = newReport.date;
            await existingReports.save();
        } else {
            const newReports = new Reports({
                url,
                hostname: new URL(url).hostname,
                reports: [newReport],
            });
            await newReports.save();
        }

        res.send("Report added successfully");
    } catch (error) {
        console.error('Error adding report:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.post('/add-recent-disrupt', async (req, res) => {
    try {
        let { url } = req.body;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            url = `http://${url}`;
        }

        
        const existingReports = await Disrupts.findOne({ hostname:new URL(url).hostname });

        if (existingReports) {
            existingReports.disrupts[0].date = new Date().toUTCString();
            await existingReports.save();
        } else {
            const newReports = new Disrupts({
                url,
                hostname: new URL(url).hostname,
                disrupts: [{date: new Date().toUTCString()}],
            });
            await newReports.save();
        }

        res.send("Disrupt added successfully");
    } catch (error) {
        console.error('Error adding disrupt:', error);
        res.status(500).send("Internal Server Error");
    }
});
router.get('/get-recent-reports',async(req,res)=>{
    try {        
        const sortedReports = await Reports.find().sort({ 'reports.date': -1 }).limit(10);
        res.send(sortedReports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).send("Internal Server Error");
    }
})
router.get('/get-recent-disrupts',async(req,res)=>{
    try {
        const sortedReports = await Disrupts.find().sort({ 'disrupts.date': -1 }).limit(10);

        res.send(sortedReports);
    } catch (error) {
        console.error('Error fetching disrupts:', error);
        res.status(500).send("Internal Server Error");
    }
})




module.exports = router;