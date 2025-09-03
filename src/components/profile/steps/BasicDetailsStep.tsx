import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, GraduationCap } from "lucide-react";

interface BasicDetailsStepProps {
  data: any;
  onChange: (data: any) => void;
}

const BasicDetailsStep = ({ data, onChange }: BasicDetailsStepProps) => {
  const updateField = (field: string, value: string) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <User className="w-12 h-12 text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Let's start with your basic information</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input
            placeholder="John"
            value={data.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="rounded-xl h-12"
          />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input
            placeholder="Doe"
            value={data.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="rounded-xl h-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date of Birth</Label>
        <Input
          type="date"
          value={data.dateOfBirth}
          onChange={(e) => updateField('dateOfBirth', e.target.value)}
          className="rounded-xl h-12"
        />
      </div>

      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={data.gender} onValueChange={(value) => updateField('gender', value)}>
          <SelectTrigger className="rounded-xl h-12">
            <SelectValue placeholder="Select your gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non_binary">Non-binary</SelectItem>
            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>University/College</Label>
        <Input
          placeholder="Harvard University"
          value={data.university}
          onChange={(e) => updateField('university', e.target.value)}
          className="rounded-xl h-12"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Year of Study</Label>
          <Select value={data.yearOfStudy} onValueChange={(value) => updateField('yearOfStudy', value)}>
            <SelectTrigger className="rounded-xl h-12">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
              <SelectItem value="graduate">Graduate</SelectItem>
              <SelectItem value="phd">PhD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Field of Study</Label>
          <Input
            placeholder="Computer Science"
            value={data.fieldOfStudy}
            onChange={(e) => updateField('fieldOfStudy', e.target.value)}
            className="rounded-xl h-12"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicDetailsStep;