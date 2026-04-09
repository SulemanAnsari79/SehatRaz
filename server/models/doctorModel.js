import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true,unique:true},
  password:{type:String,required:true},
  phone:{type:String,default:""},
  specialization:{type:String,default:""},
  licenseNumber:{type:String,default:""},
  experience:{type:Number,default:0},
  qualifications:{type:String,default:""},
  feesPerConsultation:{type:Number,default:0},
  timings:{type:Array,default:[]},
  leaveDates:{type:[String],default:[]},
  verified:{type:Boolean,default:false},
  rejectionReason:{type:String,default:""}
},{timestamps:true});

export default mongoose.model("Doctor",doctorSchema);
