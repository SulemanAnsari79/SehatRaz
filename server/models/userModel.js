import mongoose from "mongoose";
// import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true,unique:true},
  password:{type:String,required:true},
  address:{type:String,default:""},
  phone:{type:String,default:""},
  cart:{type:Object,default:[]},
});
 
export default mongoose.model("User",userSchema);
