import express from "express";
import auth from "../middlewares/auth.js";
import {
  endConsultationSession,
  getConsultationSession,
  startConsultationSession,
} from "../controllers/consultationController.js";

const consultationRouter = express.Router();

consultationRouter.get("/appointment/:appointmentId", auth, getConsultationSession);
consultationRouter.post("/appointment/:appointmentId/start", auth, startConsultationSession);
consultationRouter.post("/appointment/:appointmentId/end", auth, endConsultationSession);

export default consultationRouter;
