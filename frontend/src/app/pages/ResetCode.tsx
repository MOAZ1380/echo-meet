import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Video, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

/**
 * Reset Code Page Component
 * Verify OTP/reset code sent to email
 */

export const ResetCode: React.FC = () => {
  const { verifyPasswordResetOtp, getResetToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /**
   * Auto-focuses the first OTP input when the screen loads.
   */
  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  /**
   * Writes one OTP digit and advances focus when appropriate.
   */
  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handles backspace and arrow navigation across OTP input slots.
   */
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Allows pasting a full six-digit code into the OTP inputs.
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    // Only process if it's 6 digits
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  /**
   * Verifies OTP code and navigates to password reset form on success.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    try {
      const resetToken = getResetToken();
      await verifyPasswordResetOtp(resetToken, { otp: fullCode });
      navigate("/new-password", { state: { email, resetToken } });
    } catch (error) {
      console.error("OTP verification failed:", error);
      setError("Invalid code. Please try again.");
    } finally {
      setIsLoading(false);
    }
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);

      // Simulate verification success
      // In real app, check if code is valid from backend
      navigate("/new-password");
    }, 1500);
  };

  /**
   * Clears existing OTP input and requests a resend from backend.
   */
  const handleResendCode = () => {
    // TODO: Connect to your backend API to resend code
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="bg-[var(--echo-primary)] p-3 rounded-xl">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Echo Meet</h1>
          </motion.div>
          <p className="text-gray-400">Verify your email</p>
        </div>

        {/* Reset Code Form */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              Enter Verification Code
            </h2>
            <p className="text-gray-400 text-sm">
              We sent a 6-digit code to{" "}
              <span className="text-white font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <div className="flex gap-2 sm:gap-3 justify-center">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 bg-gray-700 text-white text-xl sm:text-2xl font-bold text-center rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--echo-primary)] transition-all"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || code.join("").length !== 6}
              className="w-full bg-[var(--echo-primary)] hover:bg-[var(--echo-primary-hover)] text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Verify Code"
              )}
            </motion.button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-sm text-[var(--echo-primary)] hover:text-[var(--echo-primary-hover)] font-semibold transition-colors"
              >
                Resend Code
              </button>
            </div>
          </form>

          {/* Back to Login */}
          <div className="mt-6">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
