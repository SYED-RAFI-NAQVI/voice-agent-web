"use client";
import { useState, useEffect } from "react";
import AgentTypeSelector from "@/components/AgentTypeSelector";
import DocumentUploader from "@/components/DocumentUploader";
import VoiceChat from "@/components/VoiceChat";
import ProgressSteps from "@/components/ProgressSteps";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionId] = useState(() => Date.now().toString());
  const [agentType, setAgentType] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { id: 1, title: "Agent Type", description: "Define your voice agent" },
    { id: 2, title: "Documents", description: "Upload knowledge base" },
    { id: 3, title: "Voice Chat", description: "Test your agent" },
  ];

  const handleAgentTypeSet = (type, recs) => {
    setAgentType(type);
    setRecommendations(recs);
    setCurrentStep(2);
  };

  const handleDocumentsUploaded = (docs) => {
    setDocuments(docs);
    setCurrentStep(3);
  };

  const resetToStep = (step) => {
    setCurrentStep(step);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        {/* <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎙️ Voice Agent Builder
          </h1>
          <p className="text-gray-600 text-lg">
            Create your custom AI voice assistant in 3 easy steps
          </p>
        </div> */}

        {/* Progress Steps */}
        {/* <ProgressSteps
          steps={steps}
          currentStep={currentStep}
          onStepClick={resetToStep}
        /> */}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <AgentTypeSelector
              onNext={handleAgentTypeSet}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {currentStep === 2 && (
            <DocumentUploader
              sessionId={sessionId}
              agentType={agentType}
              recommendations={recommendations}
              onNext={handleDocumentsUploaded}
              onBack={() => setCurrentStep(1)}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}

          {currentStep === 3 && (
            <VoiceChat
              sessionId={sessionId}
              agentType={agentType}
              documents={documents}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
