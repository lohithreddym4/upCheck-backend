const mg = require('mongoose');

const CommentSchema = new mg.Schema({
  text: {
    type: String,
    required: true,
  },
  user: {
    type:String,
    required: true,
  },
  createdAt: {
    type: String
  },
  upvotes: {
    type: Number,
    default: 0,
  }
});
const Reports=mg.Schema({
    status:{
        type:String,
        required:true
    },
    feedback:{
        type:String,
        required:true,
    },
    country:{
        type:String,
        required:true
    },
    date: {
        type: String
    }
    
})
const Disrupts=mg.Schema({
    date: {
        type: String
    }
    
})
const WebsiteSchema = new mg.Schema({
  url: {
    type: String,
    required: true,
    unique: true,
  },
  name:{
    type:String,
    required:true
  },
  hostname: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'up',
  },
  comments: [CommentSchema],
  reports:[Reports],
  disrupts:[Disrupts]
});

const Website = mg.model('Website', WebsiteSchema);

module.exports = Website;
