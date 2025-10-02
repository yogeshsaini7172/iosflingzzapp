import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, GraduationCap, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { validateMinimumAge, getMaxAllowedDate, getAgeValidationError, MINIMUM_AGE } from "@/utils/ageValidation";
import { ProfessionCombobox } from "@/components/profile/ProfessionCombobox";

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
        <Label className="text-base font-medium">Profession</Label>
        <ProfessionCombobox
          value={data.profession}
          onChange={(value) => updateField('profession', value)}
          placeholder="Search or select your profession"
        />
      </div>

      {/* Conditional fields based on profession */}
      {data.profession && data.profession === 'Student' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
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
                <SelectItem value="postgraduate">Postgraduate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-base font-medium">Field of Study</Label>
            <Select value={data.fieldOfStudy} onValueChange={(value) => updateField('fieldOfStudy', value)}>
              <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl max-h-[300px]">
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Information Technology">Information Technology</SelectItem>
                <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                <SelectItem value="Electronics Engineering">Electronics Engineering</SelectItem>
                <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                <SelectItem value="Business Administration">Business Administration</SelectItem>
                <SelectItem value="Commerce">Commerce</SelectItem>
                <SelectItem value="Economics">Economics</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Accounting">Accounting</SelectItem>
                <SelectItem value="Medicine (MBBS)">Medicine (MBBS)</SelectItem>
                <SelectItem value="Dentistry">Dentistry</SelectItem>
                <SelectItem value="Nursing">Nursing</SelectItem>
                <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                <SelectItem value="Law">Law</SelectItem>
                <SelectItem value="Arts">Arts</SelectItem>
                <SelectItem value="Literature">Literature</SelectItem>
                <SelectItem value="History">History</SelectItem>
                <SelectItem value="Psychology">Psychology</SelectItem>
                <SelectItem value="Sociology">Sociology</SelectItem>
                <SelectItem value="Political Science">Political Science</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
                <SelectItem value="Architecture">Architecture</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Mass Communication">Mass Communication</SelectItem>
                <SelectItem value="Journalism">Journalism</SelectItem>
                <SelectItem value="Hotel Management">Hotel Management</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {data.profession && data.profession === 'Other' && (
        <div className="space-y-3 animate-fade-in">
          <Label className="text-base font-medium">Please specify your profession</Label>
          <Input
            placeholder="Enter your profession"
            value={data.customProfession || ''}
            onChange={(e) => updateField('customProfession', e.target.value)}
            className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Show profession description for all professions except Student and Other */}
      {data.profession && data.profession !== 'Student' && data.profession !== 'Other' && (
        <div className="space-y-3 animate-fade-in">
          <Label className="text-base font-medium">Explain about your profession</Label>
          <Input
            placeholder="Tell us about what you do"
            value={data.professionDescription || ''}
            onChange={(e) => updateField('professionDescription', e.target.value)}
            className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors"
          />
        </div>
      )}
    </div>
  );
};

export default BasicDetailsStep;