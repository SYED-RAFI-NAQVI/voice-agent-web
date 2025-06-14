export default function ProgressSteps({ steps, currentStep, onStepClick }) {
  return (
    <div className="flex justify-center mb-12">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center cursor-pointer ${
                step.id <= currentStep ? "text-blue-600" : "text-gray-400"
              }`}
              onClick={() => step.id < currentStep && onStepClick(step.id)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step.id === currentStep
                    ? "bg-blue-600 text-white border-blue-600"
                    : step.id < currentStep
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-white text-gray-400 border-gray-300"
                }`}
              >
                {step.id < currentStep ? "✓" : step.id}
              </div>
              <div className="ml-3 hidden sm:block">
                <p className="font-medium">{step.title}</p>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-1 mx-4 transition-colors ${
                  step.id < currentStep ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
