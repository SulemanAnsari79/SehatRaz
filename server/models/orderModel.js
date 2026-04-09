import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  items:{type:Array,required:true},
  totalAmount:{type:Number,required:true},
  status:{type:String, default:"Pending"},
  paymentStatus:{type:String, default:"Pending"},
  paymentMethod:{type:String, required:true},
  notes:{type:String, default:""},
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  paidAt: { type: Date },
  deliveredAt: { type: Date },
  cancelReason: { type: String, default: '' },
  returnRequest: {
    status: { type: String, enum: ['None', 'Requested', 'Approved', 'Rejected', 'Completed'], default: 'None' },
    reason: { type: String, default: '' },
    requestDate: { type: Date },
    approvalDate: { type: Date },
    adminNotes: { type: String, default: '' }
  },
  replaceRequest: {
    status: { type: String, enum: ['None', 'Requested', 'Approved', 'Rejected', 'Completed'], default: 'None' },
    reason: { type: String, default: '' },
    requestDate: { type: Date },
    approvalDate: { type: Date },
    adminNotes: { type: String, default: '' }
  },
  returnDeadlineDate: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryMan", default: null },
  shippingDetails:{
    fullName:{type:String,required:true},
    email:{type:String,required:true},
    phone:{type:String,required:true},
    address:{type:String,required:true},
    city:{type:String,required:true},
    state:{type:String,required:true},
    country:{type:String,required:true},
    zip:{type:String,required:true}
  },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  deletedReason: { type: String, default: '' }
},{timestamps:true});

export default mongoose.model("Order",orderSchema);
