import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiSend, FiLoader } from "react-icons/fi";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext.jsx";
import {
  createConsultationSocket,
  endConsultationSession,
  getConsultationSession,
  saveConsultationPrescription,
  startConsultationSession,
} from "../services/ConsultationService.js";

const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const attachStreamToVideo = async (videoElement, stream) => {
  if (!videoElement || !stream) return;

  videoElement.srcObject = stream;

  try {
    await videoElement.play();
  } catch {
    videoElement.onloadedmetadata = () => {
      videoElement.play().catch(() => {});
    };
  }
};

const OnlineConsultation = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [prescriptionInput, setPrescriptionInput] = useState("");
  const [prescriptionSaving, setPrescriptionSaving] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);

  const role = useMemo(() => user?.role || "user", [user]);

  const setupPeerConnection = async () => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    pc.ontrack = (event) => {
      const remoteStream = remoteStreamRef.current;
      if (event.track && remoteStream) {
        remoteStream.addTrack(event.track);
      }

      if (remoteVideoRef.current) {
        attachStreamToVideo(remoteVideoRef.current, remoteStream);
      }
      setRemoteConnected(true);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("consultation:ice-candidate", {
          appointmentId,
          candidate: event.candidate,
        });
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  };

  useEffect(() => {
    attachStreamToVideo(localVideoRef.current, localStream);
  }, [localStream]);

  const connectSocket = () => {
    const socket = createConsultationSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("consultation:join-room", { appointmentId }, (ack) => {
        if (!ack?.success) {
          toast.error(ack?.message || "Unable to join consultation room");
        }
      });
    });

    socket.on("consultation:participant-joined", async () => {
      if (role === "doctor" && pcRef.current) {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit("consultation:offer", { appointmentId, sdp: offer });
      }
    });

    socket.on("consultation:offer", async ({ sdp }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("consultation:answer", { appointmentId, sdp: answer });
    });

    socket.on("consultation:answer", async ({ sdp }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("consultation:ice-candidate", async ({ candidate }) => {
      if (!pcRef.current || !candidate) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // Ignore invalid candidates from race conditions.
      }
    });

    socket.on("consultation:chat-new", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("consultation:participant-left", () => {
      setRemoteConnected(false);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      remoteStreamRef.current = new MediaStream();
    });
  };

  const loadSession = async () => {
    try {
      setLoading(true);
      const response = await getConsultationSession(appointmentId);
      const payload = response?.data;
      let nextSession = payload?.session || null;

      if (role === "doctor" && nextSession && nextSession.consultationStatus !== "live") {
        const startResponse = await startConsultationSession(appointmentId);
        nextSession = {
          ...nextSession,
          ...(startResponse?.data?.session || {}),
          consultationStatus: "live",
          canJoinNow: true,
        };
      }

      setSession(nextSession);
      setMessages(payload?.messages || []);
      setPrescriptionInput(nextSession?.prescription || "");

      if (role !== "doctor" && !nextSession?.canJoinNow && nextSession?.consultationStatus !== "live") {
        toast.info("Consultation join window is not open yet.");
      }

      await setupPeerConnection();
      connectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load consultation");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();

    return () => {
      socketRef.current?.disconnect();
      pcRef.current?.close();
      localStreamRef.current?.getTracks()?.forEach((track) => track.stop());
      remoteStreamRef.current = new MediaStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const handleSend = () => {
    const content = messageInput.trim();
    if (!content || !socketRef.current) return;

    socketRef.current.emit("consultation:chat-send", { appointmentId, content }, (ack) => {
      if (!ack?.success) {
        toast.error(ack?.message || "Failed to send message");
      }
    });

    setMessageInput("");
  };

  const toggleMic = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const tracks = stream.getAudioTracks();
    tracks.forEach((track) => {
      track.enabled = !micOn;
    });
    setMicOn((prev) => !prev);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const tracks = stream.getVideoTracks();
    tracks.forEach((track) => {
      track.enabled = !cameraOn;
    });
    setCameraOn((prev) => !prev);
  };

  const handleLeave = async () => {
    try {
      await endConsultationSession(appointmentId);
    } catch {
      // ignore leave API errors
    }
    navigate(-1);
  };

  const handleSavePrescription = async () => {
    if (role !== "doctor") return;

    try {
      setPrescriptionSaving(true);
      const response = await saveConsultationPrescription(appointmentId, prescriptionInput);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              prescription: response?.data?.prescription ?? prescriptionInput,
              prescriptionUpdatedAt: response?.data?.prescriptionUpdatedAt || new Date().toISOString(),
            }
          : prev
      );
      toast.success("Prescription saved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save prescription");
    } finally {
      setPrescriptionSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <FiLoader className="animate-spin" /> Joining consultation...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-slate-800 p-3">
            <p className="text-sm text-slate-300">Appointment #{appointmentId}</p>
            <p className="font-semibold">{session?.doctor?.name ? `Dr. ${session.doctor.name}` : "Doctor"} Consultation</p>
          </div>

          <div className="rounded-xl bg-black/40 border border-slate-700 p-3">
            <p className="text-xs text-slate-400 mb-2">Remote {remoteConnected ? "(connected)" : "(waiting...)"}</p>
            <div className="relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black aspect-video min-h-80 object-cover"
              />

              <div className="absolute bottom-3 right-3 w-36 md:w-52 rounded-lg border border-slate-600 bg-slate-900/90 p-1.5 shadow-lg">
                <p className="text-[10px] text-slate-300 mb-1">You ({role})</p>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-md bg-black aspect-video object-cover"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={toggleMic} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 inline-flex items-center gap-2">
              {micOn ? <FiMic /> : <FiMicOff />} {micOn ? "Mute" : "Unmute"}
            </button>
            <button onClick={toggleCamera} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 inline-flex items-center gap-2">
              {cameraOn ? <FiVideo /> : <FiVideoOff />} {cameraOn ? "Camera Off" : "Camera On"}
            </button>
            <button onClick={handleLeave} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 inline-flex items-center gap-2">
              <FiPhoneOff /> Leave
            </button>
          </div>
        </div>

        <div className="h-[75vh] flex flex-col gap-4">
          <div className="rounded-xl bg-slate-800 border border-slate-700 flex flex-col flex-1 min-h-0">
            <div className="p-3 border-b border-slate-700">
              <p className="font-semibold">Consultation Chat</p>
              <p className="text-xs text-slate-400">Chat is retained for 30 days.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((message) => {
                const mine = String(message.senderId) === String(user?._id);
                return (
                  <div key={message._id} className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${mine ? "bg-cyan-600 ml-auto" : "bg-slate-700"}`}>
                    <p className="text-[11px] opacity-80 mb-1">{message.senderName || message.senderRole}</p>
                    <p>{message.content}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-700 flex gap-2">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Type a message"
                className="flex-1 rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-sm outline-none focus:border-cyan-500"
              />
              <button onClick={handleSend} className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3">
                <FiSend />
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-800 border border-slate-700 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Prescription</p>
                <p className="text-xs text-slate-400">Saved with consultation and visible later.</p>
              </div>
              {session?.prescriptionUpdatedAt ? (
                <span className="text-[11px] text-slate-400">
                  Updated {new Date(session.prescriptionUpdatedAt).toLocaleString()}
                </span>
              ) : null}
            </div>

            {role === "doctor" ? (
              <div className="space-y-3">
                <textarea
                  value={prescriptionInput}
                  onChange={(e) => setPrescriptionInput(e.target.value)}
                  placeholder="Write the prescription, dosage, and follow-up notes here..."
                  rows={4}
                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-sm outline-none focus:border-cyan-500 resize-y"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSavePrescription}
                    disabled={prescriptionSaving}
                    className="rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 px-4 py-2 text-sm font-semibold"
                  >
                    {prescriptionSaving ? "Saving..." : "Save Prescription"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 min-h-24 text-sm text-slate-100 whitespace-pre-wrap">
                {session?.prescription?.trim() ? session.prescription : "No prescription has been added yet."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineConsultation;
