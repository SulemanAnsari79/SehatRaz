import express from "express";
import auth from "../middlewares/auth.js";
import {
  endConsultationSession,
  getConsultationSession,
  saveConsultationPrescription,
  startConsultationSession,
} from "../controllers/consultationController.js";

const consultationRouter = express.Router();

consultationRouter.get("/appointment/:appointmentId", auth, getConsultationSession);
consultationRouter.post("/appointment/:appointmentId/start", auth, startConsultationSession);
consultationRouter.post("/appointment/:appointmentId/end", auth, endConsultationSession);
consultationRouter.post("/appointment/:appointmentId/prescription", auth, saveConsultationPrescription);

export default consultationRouter;
