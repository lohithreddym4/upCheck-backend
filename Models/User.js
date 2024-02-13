const mg=require('mongoose')
const User=mg.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    type:{
        type:String,
        default:"Admin"
    }
})

module.exports=mg.model("user",User)