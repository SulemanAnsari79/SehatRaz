import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  items:{type:Array,required:true},
  totalAmount:{type:Number,required:true},
  status:{type:String, default:"Pending"}
},{timestamps:true});

export default mongoose.model("Order",orderSchema);
