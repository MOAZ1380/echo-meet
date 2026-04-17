import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Video, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { renderGoogleButton } from "../services/googleIdentity";

type EnvImportMeta = ImportMeta & {
  env: {
    VITE_GOOGLE_CLIENT_ID?: string;
  };
};

/**
 * Login Page Component
 * User authentication - login with email/password or Google
 */

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const googleButtonRef = useRef<HTMLDivElement>(null);

  /**
   * Validates credentials and signs in the current user.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // check if email and password are not empty
    if (!email || !password) {
      alert("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    // check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // check if password is at least 6 characters
    if (password.length < 6) {
      alert("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      await login({ email, password });
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const container = googleButtonRef.current;
    const clientId = (import.meta as EnvImportMeta).env.VITE_GOOGLE_CLIENT_ID;

    if (!container || !clientId) {
      setGoogleError("Google login is not configured.");
      return;
    }

    let isCancelled = false;

    void renderGoogleButton(container, {
      clientId,
      text: "continue_with",
      onCredential: async (credential) => {
        if (isCancelled) return;

        setIsLoading(true);
        setGoogleError("");

        try {
          await googleLogin({ credential });
          navigate("/");
        } catch {
          setGoogleError("Google sign-in failed. Please try again.");
        } finally {
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      },
    }).catch(() => {
      if (!isCancelled) {
        setGoogleError("Unable to load Google sign-in.");
      }
    });

    return () => {
      isCancelled = true;
      container.innerHTML = "";
    };
  }, [googleLogin, navigate]);

  function handleGoogleLogin() {
    const googleButton = googleButtonRef.current?.querySelector(
      "div[role='button']",
    ) as HTMLElement | null;

    googleButton?.click();
  }

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
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--echo-primary)] placeholder-gray-400 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-700 text-white pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--echo-primary)] placeholder-gray-400 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-[var(--echo-primary)] hover:text-[var(--echo-primary-hover)] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
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
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800 text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div ref={googleButtonRef} className="hidden" />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-3 border border-gray-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </motion.button>

          {googleError && (
            <p className="mt-3 text-sm text-red-400">{googleError}</p>
          )}

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[var(--echo-primary)] hover:text-[var(--echo-primary-hover)] font-semibold transition-colors"
            >
              Sign up
            </Link>
          </p>
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
