import nodemailer from "nodemailer";
import Appointment from "../models/appointmentModel.js";

const createEmailTransporter = () =>
  process.env.EMAIL_HOST
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const formatDate = (dateInput) => {
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return String(dateInput || "N/A");
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const parseAppointmentDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;

  const dateMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]) - 1;
  const day = Number(dateMatch[3]);

  let hour = 0;
  let minute = 0;

  const ampmMatch = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    hour = Number(ampmMatch[1]);
    minute = Number(ampmMatch[2]);
    const marker = ampmMatch[3].toUpperCase();
    if (marker === "AM" && hour === 12) hour = 0;
    if (marker === "PM" && hour !== 12) hour += 12;
  } else {
    const hhmmMatch = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!hhmmMatch) return null;
    hour = Number(hhmmMatch[1]);
    minute = Number(hhmmMatch[2]);
  }

  const scheduled = new Date(year, month, day, hour, minute, 0, 0);
  return Number.isNaN(scheduled.getTime()) ? null : scheduled;
};

const sendMail = async ({ to, subject, html }) => {
  if (!to) return;

  try {
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Appointment notification email failed:", error?.message || error);
  }
};

const makeTemplate = ({ title, intro, rows, footer }) => {
  const rowsHtml = rows.map((row) =>
        `<tr><td style="padding:8px 0;color:#374151;"><strong>${row.label}:</strong> ${row.value}</td></tr>`
    ).join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f9fafb;border-radius:8px;overflow:hidden;">
      <div style="background:#2563eb;padding:16px 20px;color:#fff;">
        <h2 style="margin:0;font-size:20px;">${title}</h2>
      </div>
      <div style="background:#fff;padding:20px;color:#1f2937;line-height:1.6;">
        <p style="margin-top:0;">${intro}</p>
        <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
        <p style="margin-bottom:0;color:#6b7280;font-size:13px;">${footer}</p>
      </div>
    </div>
  `;
};

export const sendAppointmentBookedEmail = async ({ user, doctor, appointment }) => {
  if (!user?.email) return;

  const html = makeTemplate({
    title: "Appointment Booked Successfully",
    intro: `Hello ${user?.name || "there"}, your appointment has been booked by the SehatRazz admin system.`,
    rows: [
      { label: "Doctor", value: doctor?.name || "Doctor" },
      { label: "Date", value: formatDate(appointment?.date) },
      { label: "Time", value: appointment?.time || "N/A" },
      { label: "Status", value: appointment?.status || "Booked" },
    ],
    footer: "This is an automated appointment update from SehatRazz Admin.",
  });

  await sendMail({to: user.email, subject: "SehatRazz: Appointment Booked", html});
};

export const sendAppointmentRescheduledEmail = async ({ user, doctor, fromDate, fromTime, toDate, toTime }) => {
  if (!user?.email) return;

  const html = makeTemplate({
    title: "Appointment Rescheduled",
    intro: `Hello ${user?.name || "there"}, your appointment has been rescheduled by admin due to doctor availability updates.`,
    rows: [
      { label: "Doctor", value: doctor?.name || "Doctor" },
      { label: "Previous Schedule", value: `${formatDate(fromDate)} at ${fromTime || "N/A"}` },
      { label: "New Schedule", value: `${formatDate(toDate)} at ${toTime || "N/A"}` },
    ],
    footer: "This is an automated appointment update from SehatRazz Admin.",
  });

  await sendMail({
    to: user.email,
    subject: "SehatRazz: Appointment Rescheduled",
    html,
  });
};

export const sendAppointmentCancelledByAdminEmail = async ({ user, doctor, appointment }) => {
  if (!user?.email) return;

  const html = makeTemplate({
    title: "Appointment Cancelled",
    intro: `Hello ${user?.name || "there"}, your appointment has been cancelled by admin.`,
    rows: [
      { label: "Doctor", value: doctor?.name || "Doctor" },
      { label: "Date", value: formatDate(appointment?.date) },
      { label: "Time", value: appointment?.time || "N/A" },
      { label: "Status", value: "Cancelled" },
    ],
    footer: "Please book a new slot if needed. This is an automated update from SehatRazz Admin.",
  });

  await sendMail({
    to: user.email,
    subject: "SehatRazz: Appointment Cancelled by Admin",
    html,
  });
};

export const sendAppointmentOneHourReminderEmail = async ({ user, doctor, appointment }) => {
  if (!user?.email) return;

  const html = makeTemplate({
    title: "Appointment Reminder (1 Hour Left)",
    intro: `Hello ${user?.name || "there"}, this is a reminder from SehatRazz Admin that your appointment starts in about 1 hour.`,
    rows: [
      { label: "Doctor", value: doctor?.name || "Doctor" },
      { label: "Date", value: formatDate(appointment?.date) },
      { label: "Time", value: appointment?.time || "N/A" },
    ],
    footer: "Please be available on time. This is an automated update from SehatRazz Admin.",
  });

  await sendMail({
    to: user.email,
    subject: "SehatRazz: Appointment Reminder",
    html,
  });
};

let reminderTimer = null;

export const startAppointmentReminderJob = () => {
  if (reminderTimer) return;

  const run = async () => {
    try {
      const now = new Date();
      const rangeStart = new Date(now);
      rangeStart.setDate(rangeStart.getDate() - 1);

      const rangeEnd = new Date(now);
      rangeEnd.setDate(rangeEnd.getDate() + 2);

      const toYmd = (d) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };

      const appointments = await Appointment.find({
        status: "Booked",
        date: { $gte: toYmd(rangeStart), $lte: toYmd(rangeEnd) },
      })
        .populate("user", "name email")
        .populate("doctor", "name")
        .select("date time status user doctor reminderSentAt reminderSentFor");

      for (const appointment of appointments) {
        const schedule = parseAppointmentDateTime(appointment.date, appointment.time);
        if (!schedule) continue;

        const msUntilAppointment = schedule.getTime() - now.getTime();
        const oneHour = 60 * 60 * 1000;
        const reminderKey = `${appointment.date}|${appointment.time}`;

        if (msUntilAppointment > 0 && msUntilAppointment <= oneHour) {
          if (appointment.reminderSentFor === reminderKey) continue;

          await sendAppointmentOneHourReminderEmail({
            user: appointment.user,
            doctor: appointment.doctor,
            appointment,
          });

          appointment.reminderSentFor = reminderKey;
          appointment.reminderSentAt = new Date();
          await appointment.save();
        }
      }
    } catch (error) {
      console.error("Appointment reminder job failed:", error?.message || error);
    }
  };

  run();
  reminderTimer = setInterval(run, 5 * 60 * 1000);
};
