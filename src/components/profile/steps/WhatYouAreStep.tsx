import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User, X } from "lucide-react";

interface WhatYouAreStepProps {
  data: any;
  onChange: (data: any) => void;
}

const WhatYouAreStep = ({ data, onChange }: WhatYouAreStepProps) => {
  const updateField = (field: string, value: any) => {
    onChange((prev: any) => ({ ...prev, [field]: value }));
  };

  const personalityTypes = [
    "Adventurous", "Analytical", "Creative", "Outgoing", "Introverted", 
    "Empathetic", "Ambitious", "Laid-back", "Intellectual", "Spontaneous"
  ];

  const valueOptions = [
    "Family-oriented", "Career-focused", "Adventure-seeking", "Spiritual", 
    "Health-conscious", "Creative", "Intellectual", "Social justice", 
    "Environmental", "Traditional"
  ];

  const relationshipGoalOptions = [
    "Serious relationship", "Casual dating", "Marriage", "Friendship first", 
    "Open to anything", "Long-term commitment"
  ];

  const interestOptions = [
    "Travel", "Reading", "Music", "Movies", "Sports", "Cooking", "Art", 
    "Technology", "Nature", "Photography", "Dancing", "Gaming", "Fitness", 
    "Writing", "Volunteering", "Fashion", "Food", "History", "Science", "Politics"
  ];

  const toggleArrayItem = (field: string, item: string, maxItems: number = 10) => {
    const currentArray = data[field] || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i: string) => i !== item)
      : currentArray.length < maxItems
      ? [...currentArray, item]
      : currentArray;
    
    updateField(field, newArray);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <User className="w-12 h-12 text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Tell us about yourself</p>
      </div>

      {/* Physical Attributes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Height (cm)</Label>
          <Input
            type="number"
            placeholder="175"
            value={data.height}
            onChange={(e) => updateField('height', e.target.value)}
            className="rounded-xl h-12"
          />
        </div>
        <div className="space-y-2">
          <Label>Body Type</Label>
          <Select value={data.bodyType} onValueChange={(value) => updateField('bodyType', value)}>
            <SelectTrigger className="rounded-xl h-12">
              <SelectValue placeholder="Select body type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slim">Slim</SelectItem>
              <SelectItem value="athletic">Athletic</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="curvy">Curvy</SelectItem>
              <SelectItem value="plus_size">Plus Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Skin Tone</Label>
        <Select value={data.skinTone} onValueChange={(value) => updateField('skinTone', value)}>
          <SelectTrigger className="rounded-xl h-12">
            <SelectValue placeholder="Select skin tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="very_fair">Very Fair</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="olive">Olive</SelectItem>
            <SelectItem value="brown">Brown</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Personality */}
      <div className="space-y-2">
        <Label>Personality Type</Label>
        <Select value={data.personalityType} onValueChange={(value) => updateField('personalityType', value)}>
          <SelectTrigger className="rounded-xl h-12">
            <SelectValue placeholder="Select personality type" />
          </SelectTrigger>
          <SelectContent>
            {personalityTypes.map((type) => (
              <SelectItem key={type} value={type.toLowerCase().replace(' ', '_')}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Values</Label>
        <Select value={data.values} onValueChange={(value) => updateField('values', value)}>
          <SelectTrigger className="rounded-xl h-12">
            <SelectValue placeholder="Select your values" />
          </SelectTrigger>
          <SelectContent>
            {valueOptions.map((value) => (
              <SelectItem key={value} value={value.toLowerCase().replace(' ', '_').replace('-', '_')}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Mindset</Label>
        <Select value={data.mindset} onValueChange={(value) => updateField('mindset', value)}>
          <SelectTrigger className="rounded-xl h-12">
            <SelectValue placeholder="Select your mindset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="growth">Growth Mindset</SelectItem>
            <SelectItem value="positive">Positive Thinking</SelectItem>
            <SelectItem value="pragmatic">Pragmatic</SelectItem>
            <SelectItem value="optimistic">Optimistic</SelectItem>
            <SelectItem value="realistic">Realistic</SelectItem>
            <SelectItem value="ambitious">Ambitious</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Relationship Goals */}
      <div className="space-y-3">
        <Label>Relationship Goals (select up to 3)</Label>
        <div className="flex flex-wrap gap-2">
          {relationshipGoalOptions.map((goal) => {
            const isSelected = data.relationshipGoals?.includes(goal);
            return (
              <Button
                key={goal}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleArrayItem('relationshipGoals', goal, 3)}
                className="rounded-full text-xs"
                disabled={!isSelected && (data.relationshipGoals?.length >= 3)}
              >
                {goal}
                {isSelected && <X className="w-3 h-3 ml-1" />}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-3">
        <Label>Interests (select up to 10)</Label>
        <div className="flex flex-wrap gap-2">
          {interestOptions.map((interest) => {
            const isSelected = data.interests?.includes(interest);
            return (
              <Button
                key={interest}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleArrayItem('interests', interest, 10)}
                className="rounded-full text-xs"
                disabled={!isSelected && (data.interests?.length >= 10)}
              >
                {interest}
                {isSelected && <X className="w-3 h-3 ml-1" />}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea
          placeholder="Tell us about yourself in a few sentences..."
          value={data.bio}
          onChange={(e) => updateField('bio', e.target.value)}
          className="rounded-xl min-h-[100px] resize-none"
          maxLength={500}
        />
        <div className="text-right text-xs text-muted-foreground">
          {data.bio?.length || 0}/500
        </div>
      </div>
    </div>
  );
};

export default WhatYouAreStep;