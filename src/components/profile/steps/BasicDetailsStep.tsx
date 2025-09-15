import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, GraduationCap, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { validateMinimumAge, getMaxAllowedDate, getAgeValidationError, MINIMUM_AGE } from "@/utils/ageValidation";

interface BasicDetailsStepProps {
  data: any;
  onChange: (data: any) => void;
}

const BasicDetailsStep = ({ data, onChange }: BasicDetailsStepProps) => {
  const [dobError, setDobError] = useState<string>("");

  const updateField = (field: string, value: string) => {
    // Special handling for date of birth
    if (field === 'dateOfBirth') {
      if (value && !validateMinimumAge(value)) {
        const errorMessage = getAgeValidationError(value);
        setDobError(errorMessage || "");
        toast.error(`Age requirement not met. You must be ${MINIMUM_AGE} or older.`);
        return; // Don't update the field if validation fails
      } else {
        setDobError(""); // Clear error if validation passes
      }
    }
    
    onChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <User className="w-16 h-16 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">Let's start with your basic information</p>
      </div>

      {/* Mobile-first: Stack on small screens, grid on larger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">First Name</Label>
          <Input
            placeholder="John"
            value={data.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Last Name</Label>
          <Input
            placeholder="Doe"
            value={data.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Date of Birth</Label>
        <div className="relative">
          <Input
            type="date"
            value={data.dateOfBirth}
            max={getMaxAllowedDate()} // Restrict to dates that make user 18+
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            className={`rounded-2xl h-14 text-base px-4 bg-background/50 border-2 transition-colors ${
              dobError 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-border/50 focus:border-primary'
            }`}
          />
          <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        </div>
        {dobError && (
          <div className="flex items-center space-x-2 text-red-500 text-sm mt-2">
            <AlertCircle className="w-4 h-4" />
            <span>{dobError}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          You must be at least {MINIMUM_AGE} years old to create an account
        </p>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Gender</Label>
        <Select value={data.gender} onValueChange={(value) => updateField('gender', value)}>
          <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
            <SelectValue placeholder="Select your gender" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non_binary">Non-binary</SelectItem>
            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">University/College</Label>
        <Input
          placeholder="Harvard University"
          value={data.university}
          onChange={(e) => updateField('university', e.target.value)}
          className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">Year of Study</Label>
          <Select value={data.yearOfStudy} onValueChange={(value) => updateField('yearOfStudy', value)}>
            <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
              <SelectItem value="graduate">Graduate</SelectItem>
              <SelectItem value="phd">PhD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Field of Study</Label>
          <Input
            placeholder="Computer Science"
            value={data.fieldOfStudy}
            onChange={(e) => updateField('fieldOfStudy', e.target.value)}
            className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicDetailsStep;