import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true,unique:true},
  password:{type:String,required:true},
  forgotPasswordOtp:{type:String,default:""},
  forgotPasswordOtpExpiry:{type:Date,default:null},
  forgotPasswordOtpVerified:{type:Boolean,default:false},
  address:{type:String,default:""},
  city:{type:String,default:""},
  state:{type:String,default:""},
  zipCode:{type:String,default:""},
  phone:{type:String,default:""},
  image:{type:String,default:""},
  role:{type:String,default:"user"},
  isActive:{type:Boolean,default:true},
  cart: [
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },
    quantity: {
      type: Number,
      required: true
    },
    size: {
      type: String,
      default: ""
    }
  }
]
}, { timestamps: true });
 
export default mongoose.model("User",userSchema);
