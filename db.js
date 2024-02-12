const mongoose=require('mongoose');
require('dotenv').config();
const URI=process.env.uri;
const connectToMongo = async () => {
    await mongoose
      .connect(URI)
      .then(() => {
        console.log("connected to DB!");
      })
      .catch((error) => console.log(error));
  };
  
  module.exports = connectToMongo;