import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  doctor:{type:mongoose.Schema.Types.ObjectId,ref:"Doctor"},
  mode:{type:String,enum:["in_person","online"],default:"in_person"},
  date:String,
  time:String,
  comment:{type:String,default:""},
  status:{type:String,default:"Booked"},
  consultationStatus:{type:String,enum:["scheduled","live","ended","missed"],default:"scheduled"},
  onlineSessionId:{type:mongoose.Schema.Types.ObjectId,ref:"OnlineSession",default:null},
  joinWindowStart:{type:Date,default:null},
  joinWindowEnd:{type:Date,default:null},
  paymentStatus:{type:String,enum:["Pending","Paid","Failed","Refund Pending","Refunded","Refund Rejected","Refund Failed"],default:"Pending"},
  amount:{type:Number,default:0},
  razorpayOrderId:{type:String,default:""},
  razorpayPaymentId:{type:String,default:""},
  razorpaySignature:{type:String,default:""},
  paidAt:{type:Date}
  ,cancelReason:{type:String,default:""}
  ,cancelledBy:{type:String,enum:["user","admin","system",""],default:""}
  ,cancelledAt:{type:Date,default:null}
  ,refundControl:{
    eligible:{type:Boolean,default:false},
    policyTier:{type:String,enum:["none","partial","full"],default:"none"},
    policyPercent:{type:Number,default:0},
    policyReason:{type:String,default:""},
    status:{type:String,enum:["None","PendingApproval","Approved","Rejected","Processing","Refunded","Failed"],default:"None"},
    requestedAt:{type:Date,default:null},
    decisionAt:{type:Date,default:null},
    refundedAt:{type:Date,default:null},
    amount:{type:Number,default:0},
    adminNotes:{type:String,default:""},
    decidedBy:{type:String,default:""},
    gateway:{type:String,default:""},
    gatewayRefundId:{type:String,default:""},
    failureReason:{type:String,default:""}
  }
  ,rescheduledByLeave:{type:Boolean,default:false}
  ,originalDate:{type:String,default:""}
  ,originalTime:{type:String,default:""}
  ,reminderSentAt:{type:Date,default:null}
  ,reminderSentFor:{type:String,default:""}
  ,isDeleted: {type:Boolean,default:false}
  ,deletedAt: {type:Date,default:null}
  ,deletedReason: {type:String,default:""}
},{timestamps:true});

export default mongoose.model("Appointment",appointmentSchema);
