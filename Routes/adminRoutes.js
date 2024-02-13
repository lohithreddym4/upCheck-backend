const express = require('express');
const router = express.Router();
const User = require('../Models/User.js');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.secret
const fetchuser = require('../middleware/fetchuser');
router.use(express.json());
const cors = require('cors');
router.use(cors());
const Website = require('../Models/Website');
const Reports=require('../Models/Report');
const Disrupts=require('../Models/Disrupt');
const upCheck = require('../upCheck/upCheck');
const getWhoisData = require('../utils`/whois.js');



const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };
  
  router.post('/create-user', [
    check('name', 'Enter a valid name').isLength({ min: 3 }),
    check('email', 'Enter a valid email').isEmail(),
    check('password', 'Enter a valid password with minimum 5 characters').isLength({ min: 5 }),
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }
  
      const hashedPassword = await hashPassword(req.body.password);
  
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      });
      return res.json({ status: 'success', user });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  router.post('/forgot-pass', [
    check('email', 'Enter a valid email').isEmail(),
    check('password', 'Enter a valid password with minimum 5 characters').isLength({ min: 5 }),
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      let user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(404).json({ error: 'User Not Found' });
      }
  
      const hashedPassword = await hashPassword(req.body.password);
      user.password = hashedPassword;
      await user.save();
      return res.json({ status: 'success', user });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.post('/login', [
    check('email', 'Enter a valid email').isEmail(),
    check('password', 'Enter a valid password').isLength({ min: 5 }),
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
  
      let user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(400).json({ error: 'Wrong Credentials!!!' });
      }
  
      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Wrong Credentials!!!' });
      }
  
      const authToken = jwt.sign({ email: user.email }, jwtSecret);
      res.json({ status: 'success', name: user.name, authToken, email: user.email });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.get('/', (req, res) => {
    res.send('Admin Homepage');
  });
router.post('/getuser', fetchuser, async (req, res) => {
    try {
      let userId = req.user.id
      const user = await User.findById(userId).select("-password")
      res.send(user)
    } catch (error) {
      res.status(500).send("Internal Server Error")
    }
})
router.post('/add-multiple-urls',async(req,res)=>{
    try {
        let urls = req.body.urls;
        let i=0;
        for (const url of urls) {
            if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
                if(url.startsWith('www.')){
                    urls[i] = `http://${url}`;
                }
            }
          const hostname = new URL(url).hostname;
          const existingSite = await Website.findOne({ hostname });
          if (existingSite) {
            console.log(`Website ${hostname} already exists`);
            continue;
          }
          const status = await upCheck(url);
            const whois = await getWhoisData(hostname);
            let domain=whois.domain_name[0];
            let name=hostname.startsWith('www.') ? hostname.slice(4,hostname.lastIndexOf('.')) : hostname.slice(0,hostname.lastIndexOf('.'))
            const newSite = new Website({ name, url,status,hostname, whois });
            await newSite.save();
            console.log(`Website ${hostname} added`);
        }
        res.send("Websites added successfully");
      } catch (error) {
        console.error('Error adding websites:', error);
        res.status(500).send("Internal Server Error");
      }
})
router.post('/add-url',async(req,res)=>{
    try {
        let url = req.body.url;
        if (!(url.startsWith('http://') || url.startsWith('https://') || url.startsWith('www.'))) {
            if(url.startsWith('www.')){
                url = `http://${url}`;
            }
        }
        const hostname = new URL(url).hostname;
        const existingSite = await Website.findOne({ hostname });
        if (existingSite) {
          console.log(`Website ${hostname} already exists`);
          res.send("Website already exists");
        }
        const status = await upCheck(url);
        const whois = await getWhoisData(hostname);
        let domain=whois.domain_name[0];
        let name=hostname.startsWith('www.') ? hostname.slice(4,hostname.lastIndexOf('.')) : hostname.slice(0,hostname.lastIndexOf('.'))
        const newSite = new Website({ name, url,status,hostname, whois });
        await newSite.save();
        console.log(`Website ${hostname} added`);
        res.send("Website added successfully");
      } catch (error) {
        console.error('Error adding website:', error);
        res.status(500).send("Internal Server Error");
      }
})
router.get('/websites',async(req,res)=>{
    try {
        const websites = await Website.find({});
        res.send(websites);
      } catch (error) {
        console.error('Error fetching websites:', error);
        res.status(500).send("Internal Server Error");
      }
})
router.get('/website/:id',async(req,res)=>{
    try {
        const website = await Website.findById(req.params.id);
        res.send(website);
      } catch (error) {
        console.error('Error fetching website:', error);
        res.status(500).send("Internal Server Error");
      }
})
router.put('/update-website/:id',async(req,res)=>{
    try {
        const website = await Website.findByIdAndUpdate(req.params)
        res.send(website);
        } catch (error) {
        console.error('Error updating website:', error);
        res.status(500).send("Internal Server Error");
        }
}
)
router.delete('/delete-website/:id',async(req,res)=>{
    try {
        const website = await Website.findByIdAndDelete(req.params.id);
        res.send(website);
      } catch (error) {
        console.error('Error deleting website:', error);
        res.status(500).send("Internal Server Error");
      }
})
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

        const report = {
            status: status,
            feedback: feedback,
            country:country,
            date: new Date().toUTCString()
        };
        website.reports.push(report);
        await website.save();
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
router.put('/update-report-options/:id',async(req,res)=>{
    try {
        const website = await Website.findByIdAndUpdate({ _id: req.params.id }, { $set: { feedback_options: req.body.feedback_options } })
        res.send(website);
        } catch (error) {
          console.error('Error updating website:', error);
        res.status(500).send("Internal Server Error");
        }
}
)


module.exports = router;