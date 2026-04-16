import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { Video, Plus, LogIn, ArrowRight, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { createRoom } from "../api/roomApi";

/**
 * Home Page Component
 * Landing page with options to create or join a meeting
 */

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const { isAuthenticated, logout, token, user } = useAuth();

  const handleCreateMeeting = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const newRoom = await createRoom(token);
    console.log("Created room:", newRoom);
    navigate(`/meeting/${newRoom.code}`, {
      state: {
        userName: user?.name,
        mediaPreferences: {
          micOn: true,
          cameraOn: true,
        },
      },
    });
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/lobby/${joinCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header with Login/Register */}
      <div className="absolute top-0 right-0 p-4 sm:p-6 z-10">
        {/* if isAuthenticated is True block signIn and signUp if False display it  and display logout*/}
        {!isAuthenticated && (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base text-white hover:text-[var(--echo-primary)] transition-colors font-medium"
              >
                Sign In
              </motion.button>
            </Link>

            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-[var(--echo-primary)] hover:bg-[var(--echo-primary-hover)] text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Up</span>
                <span className="sm:hidden">Join</span>
              </motion.button>
            </Link>
          </div>
        )}
        {isAuthenticated && (
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base text-white hover:text-[var(--echo-primary)] transition-colors font-medium"
              onClick={logout}
            >
              Logout
            </motion.button>
          </Link>
        )}
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 sm:gap-12 items-center mt-16 sm:mt-0">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center md:text-left"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 mb-6">
            <div className="bg-[var(--echo-primary)] p-3 sm:p-4 rounded-2xl">
              <Video className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white">
              Echo Meet
            </h1>
          </div>

          <p className="text-lg sm:text-xl text-gray-300 mb-6 sm:mb-8 px-4 sm:px-0">
            Connect with your team anywhere, anytime. High-quality video
            conferencing made simple.
          </p>

          <div className="space-y-3 sm:space-y-4 text-gray-400 text-sm sm:text-base">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-2 h-2 bg-[var(--echo-primary)] rounded-full flex-shrink-0"></div>
              <span>Crystal clear HD video & audio</span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-2 h-2 bg-[var(--echo-primary)] rounded-full flex-shrink-0"></div>
              <span>Screen sharing & real-time chat</span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-2 h-2 bg-[var(--echo-primary)] rounded-full flex-shrink-0"></div>
              <span>Secure & encrypted connections</span>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Actions */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {/* Create New Meeting */}
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Start a new meeting
            </h2>
            <p className="text-gray-400 mb-6">
              Create an instant meeting and invite others to join
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateMeeting}
              className="w-full bg-[var(--echo-primary)] hover:bg-[var(--echo-primary-hover)] text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-indigo-500/30"
            >
              <Plus className="w-5 h-5" />
              Start New Meeting
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Join Meeting */}
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Join a meeting
            </h2>
            <p className="text-gray-400 mb-6">
              Enter the meeting code to join an existing meeting
            </p>
            <form onSubmit={handleJoinMeeting} className="space-y-4">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter meeting code"
                className="w-full bg-gray-700 text-white px-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--echo-primary)] placeholder-gray-400"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!joinCode.trim()}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="w-5 h-5" />
                Join Meeting
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
