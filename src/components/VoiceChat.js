"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

// Global audio variables (outside component to persist)
let globalAudioContext = null;
let audioQueue = [];
let isPlaying = false;

export default function VoiceChat({ sessionId, agentType, documents, onBack }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [tokenUsage, setTokenUsage] = useState(0);
  const [error, setError] = useState("");
  const [debugLog, setDebugLog] = useState([]);

  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);

  // Use refs for state that needs to be accessed in callbacks
  const isRecordingRef = useRef(false);
  const isAISpeakingRef = useRef(false);

  const addToDebugLog = useCallback((message) => {
    console.log(message);
    setDebugLog((prev) => [
      ...prev.slice(-4),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  }, []);

  useEffect(() => {
    initializeVoiceChat();
    return () => {
      cleanup();
    };
  }, []);

  // Update refs when state changes
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    isAISpeakingRef.current = isAISpeaking;
  }, [isAISpeaking]);

  const initializeVoiceChat = () => {
    addToDebugLog("🔌 Connecting to WebSocket...");
    // const WEBSOCKET_URL =
    //   process.env.NODE_ENV === "production"
    //     ? process.env.NEXT_PUBLIC_BASE_URL
    //     : "http://localhost:8080";
    socketRef.current = io(
      "https://voice-agent-rest-production.up.railway.app"
    );

    socketRef.current.on("connect", () => {
      addToDebugLog("✅ WebSocket connected");
      setIsConnected(true);
      setConnectionStatus("connected");
      setError("");
    });

    socketRef.current.on("disconnect", () => {
      addToDebugLog("❌ WebSocket disconnected");
      setIsConnected(false);
      setConnectionStatus("disconnected");
    });

    socketRef.current.on("voice-session-started", () => {
      addToDebugLog("🎙️ Voice session started");
      setConnectionStatus("voice-ready");
      initializeAudio();
    });

    socketRef.current.on("voice-connected", () => {
      addToDebugLog("🔗 Voice connected to Gemini");
      setConnectionStatus("voice-connected");
    });

    socketRef.current.on("ai-speaking-start", () => {
      addToDebugLog("🗣️ AI started speaking");
      setIsAISpeaking(true);
      stopRecording();
    });

    socketRef.current.on("ai-speaking-end", () => {
      addToDebugLog("✅ AI finished speaking");
      setIsAISpeaking(false);
    });

    socketRef.current.on("audio-response", async (data) => {
      addToDebugLog("🔊 Received audio response");
      await playAudio(data.audioData);
    });

    socketRef.current.on("token-usage", (data) => {
      addToDebugLog(`📊 Token usage: ${data.totalTokens}`);
      setTokenUsage(data.totalTokens);
    });

    socketRef.current.on("error", (data) => {
      addToDebugLog(`❌ Socket error: ${data.message}`);
      setError(data.message);
      setConnectionStatus("error");
    });

    socketRef.current.on("voice-error", (data) => {
      addToDebugLog(`❌ Voice error: ${data.message}`);
      setError(data.message);
    });

    socketRef.current.on("voice-disconnected", () => {
      addToDebugLog("📱 Voice session disconnected");
      setConnectionStatus("disconnected");
      setIsAISpeaking(false);
      setIsRecording(false);
    });

    addToDebugLog("🚀 Starting voice session...");
    socketRef.current.emit("start-voice-session", { sessionId });
  };

  const initializeAudio = async () => {
    try {
      addToDebugLog("🎤 Initializing audio...");

      // Get microphone access first
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      addToDebugLog("✅ Microphone access granted");

      // Create audio context AFTER getting the stream
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)({
        sampleRate: 16000,
      });

      addToDebugLog(
        `🎵 Audio context created: ${audioContextRef.current.sampleRate}Hz`
      );

      // Create source from microphone
      sourceRef.current = audioContextRef.current.createMediaStreamSource(
        streamRef.current
      );
      addToDebugLog("🎤 Audio source created");

      // Create ScriptProcessor
      processorRef.current = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1
      );
      addToDebugLog("🔧 ScriptProcessor created");

      // Set up audio processing callback
      processorRef.current.onaudioprocess = (event) => {
        // Use refs to get current state
        const recording = isRecordingRef.current;
        const aiSpeaking = isAISpeakingRef.current;
        const socket = socketRef.current;

        console.log("🎵 Audio process callback fired:", {
          recording,
          aiSpeaking,
          hasSocket: !!socket,
          socketConnected: socket?.connected,
        });

        if (recording && socket && socket.connected && !aiSpeaking) {
          const inputBuffer = event.inputBuffer;
          const inputData = inputBuffer.getChannelData(0);

          // Check for actual audio
          const maxSample = Math.max(...inputData.map(Math.abs));
          const hasAudio = maxSample > 0.001;

          console.log("🎵 Audio stats:", {
            samples: inputData.length,
            maxSample: maxSample.toFixed(4),
            hasAudio,
          });

          if (!hasAudio) {
            console.log("⚠️ Silent audio, skipping...");
            return;
          }

          // Convert to Int16
          const int16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const sample = Math.max(-1, Math.min(1, inputData[i]));
            int16Data[i] = sample * 32767;
          }

          // Convert to base64
          const uint8Data = new Uint8Array(int16Data.buffer);
          const base64Audio = btoa(String.fromCharCode.apply(null, uint8Data));

          console.log("📤 Sending audio data:", {
            base64Length: base64Audio.length,
            int16Length: int16Data.length,
          });

          addToDebugLog(`📤 Audio sent: ${base64Audio.length} chars`);
          socket.emit("audio-data", base64Audio);
        } else {
          console.log("❌ Not sending audio:", {
            recording,
            hasSocket: !!socket,
            connected: socket?.connected,
            aiSpeaking,
          });
        }
      };

      addToDebugLog("🔧 Audio processor callback set");
      setConnectionStatus("ready");
      addToDebugLog("✅ Audio system ready!");
    } catch (error) {
      console.error("Error initializing audio:", error);
      addToDebugLog(`❌ Audio init error: ${error.message}`);
      setError(`Failed to initialize audio: ${error.message}`);
    }
  };

  const playAudio = async (base64Audio) => {
    try {
      // Create a single global audio context
      if (!globalAudioContext || globalAudioContext.state === "closed") {
        globalAudioContext = new (window.AudioContext ||
          window.webkitAudioContext)({
          sampleRate: 24000,
        });
        addToDebugLog("🔊 Created global audio context");
      }

      // Convert base64 to audio buffer
      const binaryString = atob(base64Audio);
      const byteLength = binaryString.length;
      const arrayBuffer = new ArrayBuffer(byteLength);
      const uint8View = new Uint8Array(arrayBuffer);

      for (let i = 0; i < byteLength; i++) {
        uint8View[i] = binaryString.charCodeAt(i);
      }

      // Convert to audio buffer
      const samples = byteLength / 2;
      const int16View = new Int16Array(arrayBuffer);
      const float32Array = new Float32Array(samples);

      for (let i = 0; i < samples; i++) {
        float32Array[i] = int16View[i] / 32768.0;
      }

      const audioBuffer = globalAudioContext.createBuffer(1, samples, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      // Add to queue instead of playing immediately
      audioQueue.push(audioBuffer);

      // Start playing if not already playing
      if (!isPlaying) {
        playQueuedAudio();
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      addToDebugLog(`❌ Audio error: ${error.message}`);
    }
  };

  // Function to play queued audio continuously
  const playQueuedAudio = async () => {
    if (isPlaying || audioQueue.length === 0) return;

    isPlaying = true;
    let startTime = globalAudioContext.currentTime;

    addToDebugLog(`🔊 Playing ${audioQueue.length} audio chunks continuously`);

    // Play all queued audio chunks back-to-back
    while (audioQueue.length > 0) {
      const audioBuffer = audioQueue.shift();
      const source = globalAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(globalAudioContext.destination);

      // Schedule this chunk to play exactly when the previous one ends
      source.start(startTime);
      startTime += audioBuffer.duration;
    }

    // Schedule the end of playback
    setTimeout(() => {
      isPlaying = false;
      addToDebugLog("🔊 Finished playing audio stream");

      // Check if more audio arrived while playing
      if (audioQueue.length > 0) {
        playQueuedAudio();
      }
    }, (startTime - globalAudioContext.currentTime) * 1000);
  };

  const startRecording = () => {
    if (!sourceRef.current || !processorRef.current) {
      addToDebugLog("❌ Audio components not ready");
      return;
    }

    addToDebugLog("🎤 Connecting audio chain...");

    try {
      // Connect the audio chain
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      setIsRecording(true);
      addToDebugLog("🎤 Recording started - audio chain connected");

      // Test the callback
      setTimeout(() => {
        console.log("🧪 Testing audio processor state:", {
          isRecording: isRecordingRef.current,
          processorConnected: !!processorRef.current,
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      addToDebugLog(`❌ Recording start error: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    addToDebugLog("⏹️ Disconnecting audio chain...");

    try {
      if (sourceRef.current && processorRef.current) {
        sourceRef.current.disconnect();
        processorRef.current.disconnect();
      }

      setIsRecording(false);
      addToDebugLog("⏹️ Recording stopped");
    } catch (error) {
      console.error("Error stopping recording:", error);
      addToDebugLog(`❌ Recording stop error: ${error.message}`);
    }
  };

  const toggleRecording = () => {
    console.log("🔄 Toggle recording called. Current state:", isRecording);
    addToDebugLog(`🔄 Toggle: ${isRecording ? "stopping" : "starting"}`);

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const cleanup = () => {
    addToDebugLog("🧹 Cleaning up...");

    // Stop recording
    if (isRecording) {
      stopRecording();
    }

    // Clear audio queue and stop playback
    audioQueue = [];
    isPlaying = false;
    if (globalAudioContext && globalAudioContext.state !== "closed") {
      globalAudioContext.close();
      globalAudioContext = null;
    }

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.emit("stop-voice-session");
      socketRef.current.disconnect();
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-blue-600";
      case "voice-ready":
        return "text-yellow-600";
      case "voice-connected":
        return "text-green-600";
      case "ready":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected to server";
      case "voice-ready":
        return "Setting up voice...";
      case "voice-connected":
        return "Voice session active";
      case "ready":
        return "Ready to chat!";
      case "error":
        return "Connection error";
      default:
        return "Connecting...";
    }
  };

  return (
    <div className="rounded-xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🎙️ Voice Chat with your {agentType} Agent
        </h2>
        <p className="text-gray-600">
          Your agent is ready with {documents.length} documents loaded
        </p>
      </div>

      {/* Debug Log
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">🐛 Debug Log:</h3>
        <div className="text-sm font-mono text-gray-600 space-y-1 max-h-40 overflow-y-auto">
          {debugLog.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div> */}

      {/* Status Display */}
      <div className="rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">
              Connection Status
            </h3>
            <p className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Recording</h3>
            <p
              className={`font-medium ${
                isRecording ? "text-red-600" : "text-gray-500"
              }`}
            >
              {isRecording ? "🔴 Recording (Streaming)" : "⭕ Stopped"}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">AI Status</h3>
            <p
              className={`font-medium ${
                isAISpeaking ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {isAISpeaking ? "🗣️ Speaking" : "👂 Listening"}
            </p>
          </div>
        </div>

        {tokenUsage > 0 && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">Token usage: {tokenUsage}</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">⚠️ {error}</p>
        </div>
      )}

      {/* Voice Controls */}
      <div className="text-center mb-8">
        {connectionStatus === "ready" ? (
          <div className="space-y-4">
            <button
              onClick={toggleRecording}
              disabled={isAISpeaking}
              className={`w-32 h-32 rounded-full text-white font-bold text-xl transition-all transform hover:scale-105 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-blue-500 hover:bg-blue-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? "🛑 Stop" : "🎤 Start"}
            </button>
            <p className="text-gray-600">
              {isRecording
                ? "Speak now... (Continuous audio streaming)"
                : "Click the microphone to start talking to your agent"}
            </p>
            <p className="text-sm text-green-600">
              ✅ Audio streaming enabled for clear speech
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-32 h-32 mx-auto rounded-full bg-gray-300 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
            <p className="text-gray-600">Setting up voice chat...</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-800 mb-3">💡 How to use:</h3>
        <ul className="text-blue-700 space-y-2">
          <li>• Click the microphone to start recording</li>
          <li>• Speak your question or request</li>
          <li>• Click stop when you're done talking</li>
          <li>• Wait for the AI to process and respond</li>
          <li>• Now with continuous audio streaming for clear speech!</li>
        </ul>
      </div> */}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Documents
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          🔄 Start Over
        </button>
      </div>
    </div>
  );
}
