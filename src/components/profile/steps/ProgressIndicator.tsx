import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const ProgressIndicator = ({ currentStep, totalSteps, stepTitles }: ProgressIndicatorProps) => {
  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-2 w-full max-w-md">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                ${index + 1 < currentStep 
                  ? 'bg-success text-white' 
                  : index + 1 === currentStep 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {index + 1 < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Progress Line */}
              {index < totalSteps - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-2 transition-all duration-300
                  ${index + 1 < currentStep ? 'bg-success' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Labels */}
      <div className="hidden md:flex justify-center">
        <div className="flex justify-between w-full max-w-lg text-xs text-center">
          {stepTitles.map((title, index) => (
            <div 
              key={index}
              className={`
                transition-all duration-300 font-medium
                ${index + 1 === currentStep 
                  ? 'text-primary' 
                  : index + 1 < currentStep 
                  ? 'text-success' 
                  : 'text-muted-foreground'
                }
              `}
            >
              {title}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Step Label */}
      <div className="md:hidden text-center">
        <div className="text-sm font-medium text-primary">
          {stepTitles[currentStep - 1]}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;