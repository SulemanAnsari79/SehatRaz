import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User as UserIcon } from "lucide-react";
import { toast } from "react-toastify";
import AuthService from "../services/AuthService";
import { AuthContext } from "../context/AuthContext";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";


export default function Login() {
  const [role, setRole] = useState("user"); // 'user' | 'doctor' | 'admin'
  const [mode, setMode] = useState("login"); // 'login' | 'signup' | 'forgot'
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", specialization: "", experience: "", qualifications: "" });
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [forgotStep, setForgotStep] = useState("sendOtp"); // sendOtp | verifyOtp | resetPassword
  const [otp, setOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");

  const { login: contextLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const roles = [
    { value: "user", label: "User", icon: "👤" },
    { value: "doctor", label: "Doctor", icon: "👨‍⚕️" },
    { value: "admin", label: "Admin", icon: "⚙️" },
    { value: "delivery", label: "Delivery Man", icon: "🚚" },
  ];

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    if (mode === "signup" && !form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(form.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (mode === "login" && !form.password.trim()) {
      newErrors.password = "Password is required";
    }

    if (mode === "signup" && form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Doctor-specific validation
    if (mode === "signup" && role === "doctor") {
      if (!form.phone.trim()) {
        newErrors.phone = "Phone number is required";
      }
      if (!form.specialization.trim()) {
        newErrors.specialization = "Specialization is required";
      }
      if (!form.experience || form.experience < 0) {
        newErrors.experience = "Experience (years) is required";
      }
      if (!form.qualifications.trim()) {
        newErrors.qualifications = "Qualifications are required";
      }
    }

    if (mode === "forgot" && forgotStep === "verifyOtp" && !otp.trim()) {
      newErrors.otp = "OTP is required";
    }

    if (mode === "forgot" && forgotStep === "resetPassword") {
      if (!resetPassword.trim()) {
        newErrors.resetPassword = "New password is required";
      } else if (resetPassword.length < 6) {
        newErrors.resetPassword = "Password must be at least 6 characters";
      }

      if (!confirmResetPassword.trim()) {
        newErrors.confirmResetPassword = "Confirm password is required";
      } else if (resetPassword !== confirmResetPassword) {
        newErrors.confirmResetPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    try {
      if (role === "doctor") {
        const response = await AuthService.doctorRegister(
          form.name,
          form.email,
          form.password,
          form.phone,
          form.specialization,
          form.experience,
          form.qualifications
        );
        if (response.success || response.message) {
          toast.success(response.message || "Registered successfully! Please wait for admin verification.");
          setForm({ name: "", email: "", password: "", phone: "", specialization: "", experience: "", qualifications: "" });
          setMode("login");
        } else {
          // Handle password validation errors from server
          if (response.issues && Array.isArray(response.issues)) {
            toast.error("Password requirements: " + response.issues.join(", "));
          } else {
            toast.error(response.message || "Registration failed. Please try again.");
          }
        }
      } else {
        const response = await AuthService.register(form.name, form.email, form.password, role);
        if (response.success || response.message) {
          toast.success(response.message || "Registered successfully! Please login.");
          setForm({ name: "", email: "", password: "", phone: "", specialization: "", experience: "", qualifications: "" });
          setMode("login");
        } else {
          // Handle password validation errors from server
          if (response.issues && Array.isArray(response.issues)) {
            toast.error("Password requirements: " + response.issues.join(", "));
          } else {
            toast.error(response.message || "Registration failed. Please try again.");
          }
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.issues 
        ? "Password requirements: " + error.response.data.issues.join(", ")
        : error.message || "Registration failed";
      toast.error(errorMsg);
      console.error("Register error details:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await AuthService.login(form.email, form.password, role);

      if (response.success) {
        // Extract user data based on role
        let userData = null;

        if (role === "user" && response.user) {
          userData = { ...response.user, role: "user" };
        } else if (role === "doctor" && response.doctor) {
          userData = { ...response.doctor, role: "doctor" };
        } else if (role === "admin" && response.user) {
          userData = { ...response.user, role: "admin" };
        } else if (role === "delivery" && response.user) {
          userData = { ...response.user, role: "delivery" };
        }
        
        contextLogin({
        ...userData,
        token: response.token
      });

        if (userData) {
          toast.success("Logged in successfully!");

          // Redirect based on role
          if (role === "user") {
            navigate("/");
          } else if (role === "doctor") {
            navigate("/doctor");
          } else if (role === "admin") {
            navigate("/admin");
          } else if (role === "delivery") {
            navigate("/delivery");
          }
        } else {
          toast.error("Login failed! Invalid response structure.");
        }
      } else {
        toast.error(response.message || "Login failed! Please check your credentials.");
      }
    } catch (error) {
      const errorMsg = error.message || "Login failed";
      toast.error(errorMsg);
      console.error("Login error:", error);
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (forgotStep === "sendOtp") {
        const response = await AuthService.sendForgotPasswordOtp(form.email);
        if (response.success) {
          toast.success(response.message || "OTP sent to your email");
          setForgotStep("verifyOtp");
        } else {
          toast.error(response.message || "Failed to send OTP");
        }
        return;
      }

      if (forgotStep === "verifyOtp") {
        const response = await AuthService.verifyForgotPasswordOtp(form.email, otp);
        if (response.success) {
          toast.success(response.message || "OTP verified");
          setForgotStep("resetPassword");
        } else {
          toast.error(response.message || "Invalid OTP");
        }
        return;
      }

      if (forgotStep === "resetPassword") {
        const response = await AuthService.resetPasswordWithOtp(form.email, resetPassword);
        if (response.success) {
          toast.success(response.message || "Password reset successfully");
          setMode("login");
          setForgotStep("sendOtp");
          setOtp("");
          setResetPassword("");
          setConfirmResetPassword("");
          setForm({ name: "", email: "", password: "" });
          setErrors({});
        } else {
          toast.error(response.message || "Failed to reset password");
        }
      }
    } catch (error) {
      toast.error(error.message || "Forgot password request failed");
      console.error("Forgot password error:", error);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        await handleRegister();
      } else if (mode === "login") {
        await handleLogin();
      } else if (mode === "forgot") {
        await handleForgotPassword();
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.value === role);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white shadow-md rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="flex items-center justify-center bg-linear-to-br from-indigo-600 to-purple-600 p-6 md:p-8 order-1">
          <div className="text-white text-center px-4 md:px-6">
            <h2 className="text-2xl md:text-3xl font-extrabold">Welcome to SehatRazz</h2>
            <p className="mt-3 md:mt-4 text-sm md:text-base text-indigo-100">Fast, secure access for Patients, Doctors and Admins.</p>
            <img src="/logo192.png" alt="logo" className="mx-auto mt-4 md:mt-6 w-24 md:w-32 h-24 md:h-32 opacity-80" />
          </div>
        </div>

        <div className="p-6 md:p-8 order-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold">
              {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
            </h3>

            {/* Role Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition duration-200"
                title={selectedRole?.label}
              >
                <UserIcon size={18} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setRole(r.value);
                        setDropdownOpen(false);
                        setErrors({}); // Clear errors when role changes
                      }}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-indigo-50 transition duration-150 ${role === r.value ? 'bg-indigo-100 text-indigo-600 font-medium' : 'text-gray-700'
                        }`}
                    >
                      <span className="text-lg">{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              {mode === "forgot" && (
                <p className="mt-1 text-xs text-gray-500">
                  {forgotStep === "sendOtp"
                    ? "We will send a 6-digit OTP to this email."
                    : forgotStep === "verifyOtp"
                    ? "Enter the OTP sent to your email."
                    : "Set a new password after OTP verification."}
                </p>
              )}
            </div>

            {mode === "login" || mode === "signup" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                {mode === "signup" && <PasswordStrengthIndicator password={form.password} />}
              </div>
            ) : null}

            {mode === "signup" && role === "doctor" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={form.specialization}
                    onChange={onChange}
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.specialization ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="e.g., Cardiology, General Medicine"
                  />
                  {errors.specialization && <p className="mt-1 text-sm text-red-500">{errors.specialization}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <input
                    type="number"
                    name="experience"
                    value={form.experience}
                    onChange={onChange}
                    min="0"
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.experience ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter years of experience"
                  />
                  {errors.experience && <p className="mt-1 text-sm text-red-500">{errors.experience}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Qualifications</label>
                  <textarea
                    name="qualifications"
                    value={form.qualifications}
                    onChange={onChange}
                    required
                    rows="3"
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.qualifications ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter your qualifications (e.g., MBBS, MD, etc.)"
                  />
                  {errors.qualifications && <p className="mt-1 text-sm text-red-500">{errors.qualifications}</p>}
                </div>
              </>
            )}

            {mode === "forgot" && forgotStep === "verifyOtp" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                <input
                  type="text"
                  name="otp"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (errors.otp) setErrors({ ...errors, otp: "" });
                  }}
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.otp ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter 6-digit OTP"
                />
                {errors.otp && <p className="mt-1 text-sm text-red-500">{errors.otp}</p>}
              </div>
            )}

            {mode === "forgot" && forgotStep === "resetPassword" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    name="resetPassword"
                    value={resetPassword}
                    onChange={(e) => {
                      setResetPassword(e.target.value);
                      if (errors.resetPassword) setErrors({ ...errors, resetPassword: "" });
                    }}
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.resetPassword ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter new password"
                  />
                  {errors.resetPassword && <p className="mt-1 text-sm text-red-500">{errors.resetPassword}</p>}
                  <PasswordStrengthIndicator password={resetPassword} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmResetPassword"
                    value={confirmResetPassword}
                    onChange={(e) => {
                      setConfirmResetPassword(e.target.value);
                      if (errors.confirmResetPassword) setErrors({ ...errors, confirmResetPassword: "" });
                    }}
                    required
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.confirmResetPassword ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Confirm new password"
                  />
                  {errors.confirmResetPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmResetPassword}</p>}
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm">
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setRole("user");
                      setMode("forgot");
                      setForgotStep("sendOtp");
                      setOtp("");
                      setResetPassword("");
                      setConfirmResetPassword("");
                      setErrors({});
                    }}
                    className="font-medium text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                    ? "Sign in"
                    : mode === "signup"
                    ? "Create account"
                    : forgotStep === "sendOtp"
                    ? "Send OTP"
                    : forgotStep === "verifyOtp"
                    ? "Verify OTP"
                    : "Reset Password"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {mode === "login" && role !== "delivery" && role !== "admin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setForgotStep("sendOtp");
                    setOtp("");
                    setResetPassword("");
                    setConfirmResetPassword("");
                    setErrors({});
                    setForm({ name: "", email: "", password: "", phone: "", specialization: "", experience: "", qualifications: "" });
                  }}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : mode === "login" && (role === "delivery" || role === "admin") ? (
              <span className="text-gray-400 text-xs">Accounts are managed by the administrator.</span>
            ) : mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setForgotStep("sendOtp");
                    setOtp("");
                    setResetPassword("");
                    setConfirmResetPassword("");
                    setErrors({});
                    setForm({ name: "", email: "", password: "" });
                  }}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Remembered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setForgotStep("sendOtp");
                    setOtp("");
                    setResetPassword("");
                    setConfirmResetPassword("");
                    setErrors({});
                    setForm({ name: "", email: "", password: "", phone: "", specialization: "", experience: "", qualifications: "" });
                  }}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
