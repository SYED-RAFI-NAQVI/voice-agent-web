"use client";
import { useState } from "react";
import { getAgentRecommendations } from "@/utils/api";

export default function AgentTypeSelector({ onNext, isLoading, setIsLoading }) {
  const [agentType, setAgentType] = useState("");
  const [customType, setCustomType] = useState("");

  const predefinedTypes = [
    {
      id: "receptionist",
      title: "Receptionist",
      description: "Handle calls, appointments, and customer inquiries",
      icon: "📞",
    },
    {
      id: "support",
      title: "Customer Support",
      description: "Provide technical help and resolve issues",
      icon: "🛠️",
    },
    {
      id: "sales",
      title: "Sales Assistant",
      description: "Qualify leads and provide product information",
      icon: "💼",
    },
    {
      id: "assistant",
      title: "Virtual Assistant",
      description: "General purpose AI assistant for various tasks",
      icon: "🤖",
    },
  ];

  const handlePresetClick = async (preset) => {
    setIsLoading(true);
    try {
      const response = await getAgentRecommendations();
      onNext(preset.id, response.recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      alert("Error getting recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedType = agentType === "custom" ? customType : agentType;

    if (!selectedType.trim()) return;

    setIsLoading(true);
    try {
      const response = await getAgentRecommendations(selectedType);
      onNext(selectedType, response.recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      alert("Error getting recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center gap-2 items-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
              <span className="text-2xl">✨</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create Your AI Voice Agent
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Describe what you want your voice agent to do, or choose from our
            popular templates below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Custom Input */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              What should your voice agent do?
            </label>
            <textarea
              value={customType}
              onChange={(e) => {
                setCustomType(e.target.value);
                setAgentType("custom");
              }}
              placeholder="Create your own custom agent"
              className="w-full h-32 p-6 text-gray-900 placeholder-gray-500 border border-blue-600/50 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-lg leading-relaxed outline-none"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="h-px bg-gray-300 w-24"></div>
              <span className="text-gray-500 font-medium">
                or choose a template
              </span>
              <div className="h-px bg-gray-300 w-24"></div>
            </div>
          </div>

          {/* Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {predefinedTypes.map((type) => {
              const isSelected = agentType === type.id;

              return (
                <div
                  key={type.id}
                  className={`group relative rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                    isSelected
                      ? "border-blue-500 shadow-lg scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setAgentType(type.id);
                    setCustomType("");
                  }}
                >
                  <div className="px-6 py-5">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{type.icon}</span>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {type.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {type.description}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2  rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit */}
          <div className="text-center pt-8">
            <button
              type="submit"
              disabled={(!agentType && !customType.trim()) || isLoading}
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg hover:scale-105 min-w-64"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <span className="mr-2">✨</span>
                  Create My Agent
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
