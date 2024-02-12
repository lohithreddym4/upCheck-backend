const express=require('express')
const app=express();
const cron = require('node-cron');
app.use(express.json());
require('dotenv').config();
const connectToMongo=require('./db');
connectToMongo();
const port=3000;
const cors=require('cors');
app.use(cors());
app.use('/user',require('./Routes/userRoutes'));
const Website = require('./Models/Websites');
const Disrupts = require('./Models/Disrupts');
const upCheck = require('./upCheck/upCheck');

cron.schedule('* */20 * * * *', async () => {
    console.log('Running the cron job...');
    const websites = await Website.find().select('url');
    let i=0;
    for (const website of websites) {
        const status = await upCheck(website.url);
        await Website.findOneAndUpdate({url: website.url}, {status: status ? 'up' : 'down'});
        if(!status) {
            const newReport = {
                date: new Date().toUTCString()
            };
            Website.findOne({url:website.url}).disrupts.push(newReport);
            await website.save();
            const url = website.url;
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
        }

        console.log(`Website ${website.url} status: ${status}`);
    }

    console.log('Cron job completed.');
});


app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})