interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const ProgressIndicator = ({ currentStep, totalSteps, stepTitles }: ProgressIndicatorProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{stepTitles[currentStep - 1]}</span>
        <span>{currentStep} of {totalSteps}</span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-gradient-primary h-2 rounded-full transition-all duration-500 shadow-soft"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
              index < currentStep
                ? 'bg-gradient-primary text-white shadow-soft'
                : index === currentStep - 1
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;