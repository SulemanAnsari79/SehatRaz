import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true,unique:true},
  password:{type:String,required:true}, 
  specialization:{type:String,required:true},
  experience:{type:Number,required:true},
  feesPerConsultation:{type:Number,required:true},
  timings:{type:Array,required:true},
  verified:{type:Boolean,default:false}
},{timestamps:true});

export default mongoose.model("Doctor",doctorSchema);
