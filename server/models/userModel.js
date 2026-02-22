import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true,unique:true},
  password:{type:String,required:true},
  address:{type:String,default:""},
  city:{type:String,default:""},
  state:{type:String,default:""},
  zipCode:{type:String,default:""},
  phone:{type:String,default:""},
  role:{type:String,default:"user"},
  isActive:{type:Boolean,default:true},
  cart:{type:Object,default:[]},
}, { timestamps: true });
 
export default mongoose.model("User",userSchema);
