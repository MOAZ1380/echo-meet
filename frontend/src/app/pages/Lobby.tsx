import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useMediaStream } from "../hooks/useMediaStream";

/**
 * Lobby Page Component
 * Preview screen before joining meeting - test camera/mic
 */

export const Lobby: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [hasRequestedMedia, setHasRequestedMedia] = useState(false);
  const {
    stream,
    isCameraOn,
    isMicOn,
    error,
    initializeStream,
    toggleCamera,
    toggleMic,
    stopStream,
  } = useMediaStream();

  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Don't auto-request permissions - let user decide
  useEffect(() => {
    return () => stopStream();
  }, []);

  // Request media access manually
  const handleRequestMedia = async () => {
    setHasRequestedMedia(true);
    await initializeStream();
  };

  // Attach stream to video preview
  useEffect(() => {
    if (videoRef.current && stream && isCameraOn) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isCameraOn]);

  const handleJoinMeeting = () => {
    if (userName.trim()) {
      navigate(`/meeting/${meetingId}`, {
        state: {
          userName: userName.trim(),
          mediaPreferences: {
            micOn: isMicOn,
            cameraOn: isCameraOn,
          },
        },
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="bg-gray-900 p-6 border-b border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[var(--echo-primary)] p-2 rounded-lg">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Echo Meet</h1>
            </div>
            <p className="text-gray-400">
              Meeting ID:{" "}
              <span className="text-white font-mono">{meetingId}</span>
            </p>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Video Preview */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Camera Preview
                </h2>

                <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                  {isCameraOn && stream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <VideoOff className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-400">Camera is off</p>
                      </div>
                    </div>
                  )}

                  {/* Controls overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleMic}
                      className={`p-4 rounded-full transition-colors ${
                        isMicOn
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                      aria-label={
                        isMicOn ? "Mute microphone" : "Unmute microphone"
                      }
                    >
                      {isMicOn ? (
                        <Mic className="w-5 h-5" />
                      ) : (
                        <MicOff className="w-5 h-5" />
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleCamera}
                      className={`p-4 rounded-full transition-colors ${
                        isCameraOn
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                      aria-label={
                        isCameraOn ? "Turn off camera" : "Turn on camera"
                      }
                    >
                      {isCameraOn ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <VideoOff className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm font-semibold mb-2">
                      ⚠️ Media Access Error
                    </p>
                    <p className="text-red-300 text-sm mb-3">{error}</p>
                    <button
                      onClick={handleRequestMedia}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                    <p className="text-gray-400 text-xs mt-3">
                      Tip: You can still join the meeting without
                      camera/microphone and enable them later.
                    </p>
                  </div>
                )}

                {!stream && !error && !hasRequestedMedia && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-blue-300 text-sm mb-3">
                      📹 Click the button below to test your camera and
                      microphone before joining.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRequestMedia}
                      className="w-full bg-[var(--echo-primary)] hover:bg-[var(--echo-primary-hover)] text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      Enable Camera & Microphone
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Join Form */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Ready to join?
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Check your camera and microphone settings before joining the
                    meeting
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="userName"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Your Name
                    </label>
                    <input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--echo-primary)] placeholder-gray-400"
                    />
                  </div>

                  <div className="bg-gray-700/50 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isMicOn ? (
                          <Mic className="w-4 h-4 text-green-400" />
                        ) : (
                          <MicOff className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-sm text-gray-300">
                          Microphone
                        </span>
                      </div>
                      <span
                        className={`text-sm ${isMicOn ? "text-green-400" : "text-red-400"}`}
                      >
                        {isMicOn ? "On" : "Off"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isCameraOn ? (
                          <Video className="w-4 h-4 text-green-400" />
                        ) : (
                          <VideoOff className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-sm text-gray-300">Camera</span>
                      </div>
                      <span
                        className={`text-sm ${isCameraOn ? "text-green-400" : "text-red-400"}`}
                      >
                        {isCameraOn ? "On" : "Off"}
                      </span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoinMeeting}
                    disabled={!userName.trim()}
                    className="w-full bg-[var(--echo-primary)] hover:bg-[var(--echo-primary-hover)] text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
                  >
                    Join Meeting
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>

                  <button
                    onClick={() => navigate("/")}
                    className="w-full text-gray-400 hover:text-white py-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
