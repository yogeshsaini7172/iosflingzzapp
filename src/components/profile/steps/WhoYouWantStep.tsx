import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface WhoYouWantStepProps {
  data: any;
  onChange: (data: any) => void;
}

const WhoYouWantStep = ({ data, onChange }: WhoYouWantStepProps) => {
  const updateField = (field: string, value: any) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    const currentArray = data[field] || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateField(field, newArray);
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'any', label: 'Any' }
  ];

  const bodyTypeOptions = [
    'Slim', 'Average', 'Athletic', 'Curvy', 'Plus Size'
  ];

  const valueOptions = [
    'Family-oriented', 'Career-focused', 'Spiritual', 'Adventurous', 'Traditional'
  ];

  const mindsetOptions = [
    'Optimistic', 'Realistic', 'Pragmatic', 'Creative', 'Analytical'
  ];

  const personalityOptions = [
    'Introvert', 'Extrovert', 'Ambivert'
  ];

  const goalOptions = [
    'Casual Dating', 'Serious Relationship', 'Marriage', 'Friendship', 'Networking'
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <Search className="w-12 h-12 text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Tell us about your ideal partner and preferences</p>
      </div>

      {/* Gender Preference */}
      <div className="space-y-3">
        <Label>Gender Preference</Label>
        <div className="grid grid-cols-2 gap-3">
          {genderOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`gender-${option.value}`}
                checked={data.preferredGender.includes(option.value)}
                onCheckedChange={() => toggleArrayItem('preferredGender', option.value)}
              />
              <Label htmlFor={`gender-${option.value}`} className="text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Age Range */}
      <div className="space-y-3">
        <Label>Age Range: {data.ageRangeMin} - {data.ageRangeMax} years</Label>
        <div className="px-2">
          <Slider
            value={[data.ageRangeMin, data.ageRangeMax]}
            onValueChange={([min, max]) => {
              updateField('ageRangeMin', min);
              updateField('ageRangeMax', max);
            }}
            min={18}
            max={60}
            step={1}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>18</span>
          <span>60</span>
        </div>
      </div>

      {/* Height Range */}
      <div className="space-y-3">
        <Label>Height Range: {data.heightRangeMin}cm - {data.heightRangeMax}cm</Label>
        <div className="px-2">
          <Slider
            value={[data.heightRangeMin, data.heightRangeMax]}
            onValueChange={([min, max]) => {
              updateField('heightRangeMin', min);
              updateField('heightRangeMax', max);
            }}
            min={140}
            max={220}
            step={1}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>140cm</span>
          <span>220cm</span>
        </div>
      </div>

      {/* Preferred Body Types */}
      <div className="space-y-3">
        <Label>Preferred Body Types (Optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          {bodyTypeOptions.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`body-${type}`}
                checked={data.preferredBodyTypes.includes(type)}
                onCheckedChange={() => toggleArrayItem('preferredBodyTypes', type)}
              />
              <Label htmlFor={`body-${type}`} className="text-sm">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Preferred Values */}
      <div className="space-y-3">
        <Label>Preferred Values (Optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          {valueOptions.map((value) => (
            <div key={value} className="flex items-center space-x-2">
              <Checkbox
                id={`value-${value}`}
                checked={data.preferredValues.includes(value)}
                onCheckedChange={() => toggleArrayItem('preferredValues', value)}
              />
              <Label htmlFor={`value-${value}`} className="text-sm">
                {value}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Preferred Mindset */}
      <div className="space-y-3">
        <Label>Preferred Mindset (Optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          {mindsetOptions.map((mindset) => (
            <div key={mindset} className="flex items-center space-x-2">
              <Checkbox
                id={`mindset-${mindset}`}
                checked={data.preferredMindset.includes(mindset)}
                onCheckedChange={() => toggleArrayItem('preferredMindset', mindset)}
              />
              <Label htmlFor={`mindset-${mindset}`} className="text-sm">
                {mindset}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Preferred Personality */}
      <div className="space-y-3">
        <Label>Preferred Personality (Optional)</Label>
        <div className="grid grid-cols-2 gap-3">
          {personalityOptions.map((personality) => (
            <div key={personality} className="flex items-center space-x-2">
              <Checkbox
                id={`personality-${personality}`}
                checked={data.preferredPersonality.includes(personality)}
                onCheckedChange={() => toggleArrayItem('preferredPersonality', personality)}
              />
              <Label htmlFor={`personality-${personality}`} className="text-sm">
                {personality}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Goals */}
      <div className="space-y-3">
        <Label>Preferred Relationship Goals</Label>
        <div className="grid grid-cols-2 gap-3">
          {goalOptions.map((goal) => (
            <div key={goal} className="flex items-center space-x-2">
              <Checkbox
                id={`goal-${goal}`}
                checked={data.preferredRelationshipGoals.includes(goal)}
                onCheckedChange={() => toggleArrayItem('preferredRelationshipGoals', goal)}
              />
              <Label htmlFor={`goal-${goal}`} className="text-sm">
                {goal}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhoYouWantStep;