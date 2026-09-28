import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiClock, FiLoader, FiUser } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import {createAppointmentPaymentOrder, getDoctorAvailability,getVerifiedDoctors,verifyAppointmentPayment} from "../../services/DoctorService.js";

const DEFAULT_SLOTS = ["09:00 AM", "09:20 AM", "09:40 AM", "10:00 AM", "10:20 AM", "10:40 AM", "11:00 AM", "11:20 AM", "11:40 AM", "12:00 PM", "12:20 PM", "12:40 PM", "02:00 PM", "02:20 PM", "02:40 PM", "03:00 PM", "03:20 PM", "03:40 PM", "04:00 PM", "04:20 PM"];

const pad2 = (value) => String(value).padStart(2, "0");

const timeLabelToMinutes = (label) => {
  const match = String(label || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const ampm = match[3].toUpperCase();

  if (hour === 12) hour = 0;
  if (ampm === "PM") hour += 12;

  return hour * 60 + minute;
};

const minutesToLabel = (minutes) => {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad2(m)} ${suffix}`;
};

const expandTimingToSlots = (timingText) => {
  const raw = String(timingText || "").trim();
  if (!raw) return [];

  const rangeMatch = raw.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))$/i);
  if (!rangeMatch) {
    return [raw];
  }

  const start = timeLabelToMinutes(rangeMatch[1]);
  const end = timeLabelToMinutes(rangeMatch[2]);
  if (start === null || end === null || end <= start) return [];

  const slots = [];
  for (let t = start; t < end; t += 20) {
    slots.push(minutesToLabel(t));
  }
  return slots;
};

const getUniqueSortedSlots = (timingsArray) => {
  const flat = timingsArray.flatMap((item) => expandTimingToSlots(item));
  const unique = Array.from(new Set(flat));
  return unique.sort((a, b) => (timeLabelToMinutes(a) ?? 0) - (timeLabelToMinutes(b) ?? 0));
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Appointment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialDoctorId = location.state?.doctorId || "";

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const mode = "online";
  const [comment, setComment] = useState("");

  const [availability, setAvailability] = useState({
    totalBookings: 0,
    maxPerDay: 20,
    isDateFull: false,
    isLeaveDate: false,
    bookedSlots: [],
  });

  const [pageError, setPageError] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!doctorId || !date) {
      setAvailability({ totalBookings: 0, maxPerDay: 20, isDateFull: false, isLeaveDate: false, bookedSlots: [] });
      return;
    }

    fetchAvailability(doctorId, date);
  }, [doctorId, date]);

  const minDate = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const selectedDoctor = useMemo(
    () => doctors.find((doc) => String(doc._id) === String(doctorId)) || null,
    [doctors, doctorId]
  );

  const parsedSlots = useMemo(() => {
    if (Array.isArray(selectedDoctor?.timings) && selectedDoctor.timings.length > 0) {
      return getUniqueSortedSlots(selectedDoctor.timings);
    }
    return DEFAULT_SLOTS;
  }, [selectedDoctor]);

  const bookedSlotsSet = useMemo(() => new Set(availability.bookedSlots || []), [availability.bookedSlots]);

  const extractDoctors = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.doctors)) return payload.doctors;
    if (payload && typeof payload === "object") {
      const key = Object.keys(payload).find((item) => Array.isArray(payload[item]));
      return key ? payload[key] : [];
    }
    return [];
  };

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setPageError("");

      const response = await getVerifiedDoctors();
      const rows = extractDoctors(response?.data);
      setDoctors(rows);

      if (!doctorId && rows.length > 0) {
        setDoctorId(String(rows[0]._id));
      }
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load doctors.");
    } finally {
      setLoadingDoctors(false);
    }
  };

  const fetchAvailability = async (selectedDoctorId, selectedDate) => {
    try {
      setLoadingAvailability(true);
      const response = await getDoctorAvailability(selectedDoctorId, selectedDate);
      const payload = response?.data || {};

      setAvailability({
        totalBookings: payload.totalBookings || 0,
        maxPerDay: payload.maxPerDay || 20,
        isDateFull: Boolean(payload.isDateFull),
        isLeaveDate: Boolean(payload.isLeaveDate),
        bookedSlots: Array.isArray(payload.bookedSlots) ? payload.bookedSlots : [],
      });

      if (time && Array.isArray(payload.bookedSlots) && payload.bookedSlots.includes(time)) {
        setTime("");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load slot availability");
      setAvailability({ totalBookings: 0, maxPerDay: 20, isDateFull: false, isLeaveDate: false, bookedSlots: [] });
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!doctorId || !date || !time) {
      toast.error("Please select doctor, date and time slot");
      return;
    }

    if (availability.isDateFull) {
      toast.error("This doctor is fully booked for selected date");
      return;
    }

    if (availability.isLeaveDate) {
      toast.error("Doctor is on leave for the selected date");
      return;
    }

    if (bookedSlotsSet.has(time)) {
      toast.error("Selected slot is already booked");
      return;
    }

    try {
      setSubmitting(true);
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Payment gateway failed to load. Please try again.");
        return;
      }

      const orderRes = await createAppointmentPaymentOrder({ doctorId, date, time, mode, comment });
      const data = orderRes?.data || {};

      if (!data?.success || !data?.razorpayOrderId || !data?.keyId) {
        toast.error(data?.message || "Unable to initiate payment");
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "SehatRazz",
        description: "Doctor Appointment Payment",
        order_id: data.razorpayOrderId,
        handler: async (paymentResponse) => {
          try {
            await verifyAppointmentPayment({
              doctorId,
              date,
              time,
              comment,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              mode,
            });

            toast.success("Payment successful. Appointment booked.");
            navigate("/my-appointments");
          } catch (verifyErr) {
            toast.error(verifyErr?.response?.data?.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
          },
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#06b6d4",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      setTime("");
      setComment("");
      await fetchAvailability(doctorId, date);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-indigo-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 md:p-7 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Book Appointment</h1>
            <p className="text-slate-600 mt-1 text-sm">
              Choose a doctor, select date and available time slot.
            </p>

            {pageError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {pageError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor</label>
                {loadingDoctors ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 inline-flex items-center gap-2">
                    <FiLoader className="animate-spin" /> Loading doctors...
                  </div>
                ) : (
                  <select
                    value={doctorId}
                    onChange={(e) => {
                      setDoctorId(e.target.value);
                      setTime("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                    required
                  >
                    <option value="">Select doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.name} - {doctor.specialization || "General"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Booking allowed from today up to 1 month.</p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="block text-sm font-semibold text-slate-700">Time Slot</label>
                  {loadingAvailability ? (
                    <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                      <FiLoader className="animate-spin" /> Checking slots...
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      {availability.totalBookings}/{availability.maxPerDay} booked
                    </span>
                  )}
                </div>

                {availability.isDateFull ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    This doctor already has 20 appointments for this date. Please pick another date.
                  </div>
                ) : null}

                {availability.isLeaveDate ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 mt-2">
                    Doctor is on leave for this date. Please choose another date.
                  </div>
                ) : null}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {parsedSlots.map((slot) => {
                    const isBooked = bookedSlotsSet.has(slot);
                    const isSelected = time === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!date || availability.isDateFull || availability.isLeaveDate || isBooked || loadingAvailability}
                        onClick={() => setTime(slot)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          isSelected
                            ? "border-cyan-600 bg-cyan-600 text-white"
                            : isBooked
                              ? "border-red-200 bg-red-50 text-red-500 cursor-not-allowed"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Brief Comment (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Add symptoms or booking note for verification"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800">
                Consultation Type: <span className="font-semibold">Online (Video Call + Chat)</span>
              </div>

              <button
                type="submit"
                disabled={submitting || !doctorId || !date || !time || availability.isDateFull || availability.isLeaveDate}
                className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-60"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <FiLoader className="animate-spin" /> Booking...
                  </span>
                ) : (
                  "Proceed to Payment"
                )}
              </button>
            </form>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-slate-900">Selected Doctor</h2>

            {selectedDoctor ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
                    <FiUser />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Dr. {selectedDoctor.name}</p>
                    <p className="text-xs text-slate-500">{selectedDoctor.specialization || "General"}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="text-slate-500 text-xs">Consultation Fee</p>
                  <p className="font-semibold text-slate-800">INR {selectedDoctor.feesPerConsultation || 0}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="text-slate-500 text-xs">Experience</p>
                  <p className="font-semibold text-slate-800">{selectedDoctor.experience || 0} years</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="text-slate-500 text-xs">Selected Date</p>
                  <p className="font-semibold text-slate-800 inline-flex items-center gap-2">
                    <FiCalendar /> {date || "Not selected"}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="text-slate-500 text-xs">Selected Time</p>
                  <p className="font-semibold text-slate-800 inline-flex items-center gap-2">
                    <FiClock /> {time || "Not selected"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-3">Select a doctor to view summary.</p>
            )}
          </aside>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Appointment;
