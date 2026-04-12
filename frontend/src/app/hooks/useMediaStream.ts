import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to manage media streams (video and audio)
 * Handles getting user media, toggling camera/mic, and screen sharing
 */
export const useMediaStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Initialize media stream
  const initializeStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setStream(mediaStream);
      setError(null);
    } catch (err: any) {
      // Don't log permission errors to console - they're expected
      if (err.name !== 'NotAllowedError' && err.name !== 'PermissionDeniedError') {
        console.error('Error accessing media devices:', err);
      }
      
      // Provide specific error messages based on error type
      let errorMessage = 'Could not access camera/microphone.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone access denied. Please allow permissions in your browser settings and refresh the page.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera/microphone does not meet the required settings.';
      } else if (err.name === 'TypeError') {
        errorMessage = 'Invalid camera/microphone constraints. Please check your browser settings.';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Access to camera/microphone blocked by security settings. This app requires HTTPS.';
      }
      
      setError(errorMessage);
    }
  };

  // Toggle camera on/off
  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  // Toggle microphone on/off
  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      // Listen for when user stops sharing via browser controls
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      // Don't log permission errors to console - they're expected when user cancels
      if (err.name !== 'NotAllowedError' && err.name !== 'PermissionDeniedError') {
        console.error('Error sharing screen:', err);
      }
      // Only set error for non-permission issues
      if (err.name !== 'NotAllowedError' && err.name !== 'PermissionDeniedError') {
        setError('Could not share screen. Please try again.');
      }
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    }
  };

  // Stop all streams
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return {
    stream,
    isCameraOn,
    isMicOn,
    isScreenSharing,
    error,
    initializeStream,
    toggleCamera,
    toggleMic,
    startScreenShare,
    stopScreenShare,
    stopStream
  };
};