import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name:{type:String, required:true},
  description:{type:String, required:true},
  price:{type:Number, required:true},
  stock:{type:Number, default:0 },
  category:{type:String, required:true},
  sizes:{type:Array, default:[]},
  tags:{type:Array, default:[]},
  bestSeller:{type:Boolean, default:false},
  discount:{type:Number, default:0},
  images:{type:Array, default:[]},
  isActive:{type:Boolean, default:true},
  date:{type:Number, default: Date.now()},
},{timestamps:true});

export default mongoose.model("Product",productSchema);
