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
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <User className="w-16 h-16 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">Tell us about yourself</p>
      </div>

      {/* Physical Attributes - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">Height (cm)</Label>
          <Input
            type="number"
            placeholder="175"
            value={data.height}
            onChange={(e) => updateField('height', e.target.value)}
            className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Body Type</Label>
          <Select value={data.bodyType} onValueChange={(value) => updateField('bodyType', value)}>
            <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
              <SelectValue placeholder="Select body type" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="slim">Slim</SelectItem>
              <SelectItem value="athletic">Athletic</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="curvy">Curvy</SelectItem>
              <SelectItem value="plus_size">Plus Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">Skin Tone</Label>
          <Select value={data.skinTone} onValueChange={(value) => updateField('skinTone', value)}>
            <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
              <SelectValue placeholder="Select skin tone" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="very_fair">Very Fair</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="olive">Olive</SelectItem>
              <SelectItem value="brown">Brown</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Face Type</Label>
          <Select value={data.faceType} onValueChange={(value) => updateField('faceType', value)}>
            <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
              <SelectValue placeholder="Select face type" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="round">Round</SelectItem>
              <SelectItem value="oval">Oval</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="heart_shaped">Heart-shaped</SelectItem>
              <SelectItem value="diamond">Diamond</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Personality - Full Width on Mobile */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Personality Type</Label>
        <Select value={data.personalityType} onValueChange={(value) => updateField('personalityType', value)}>
          <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
            <SelectValue placeholder="Select personality type" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {personalityTypes.map((type) => (
              <SelectItem key={type} value={type.toLowerCase().replace(' ', '_')}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Values</Label>
        <Select value={data.values} onValueChange={(value) => updateField('values', value)}>
          <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
            <SelectValue placeholder="Select your values" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {valueOptions.map((value) => (
              <SelectItem key={value} value={value.toLowerCase().replace(' ', '_').replace('-', '_')}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Mindset</Label>
        <Select value={data.mindset} onValueChange={(value) => updateField('mindset', value)}>
          <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
            <SelectValue placeholder="Select your mindset" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="growth">Growth Mindset</SelectItem>
            <SelectItem value="positive">Positive Thinking</SelectItem>
            <SelectItem value="pragmatic">Pragmatic</SelectItem>
            <SelectItem value="optimistic">Optimistic</SelectItem>
            <SelectItem value="realistic">Realistic</SelectItem>
            <SelectItem value="ambitious">Ambitious</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Relationship Goals - Better Mobile Spacing */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Relationship Goals (select up to 3)</Label>
        <div className="flex flex-wrap gap-3">
          {relationshipGoalOptions.map((goal) => {
            const isSelected = data.relationshipGoals?.includes(goal);
            return (
              <Button
                key={goal}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleArrayItem('relationshipGoals', goal, 3)}
                className="rounded-2xl text-sm h-12 px-4 min-w-0 transition-colors"
                disabled={!isSelected && (data.relationshipGoals?.length >= 3)}
              >
                {goal}
                {isSelected && <X className="w-3 h-3 ml-2" />}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Interests - Better Mobile Spacing */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Interests (select up to 10)</Label>
        <div className="flex flex-wrap gap-3">
          {interestOptions.map((interest) => {
            const isSelected = data.interests?.includes(interest);
            return (
              <Button
                key={interest}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => toggleArrayItem('interests', interest, 10)}
                className="rounded-2xl text-sm h-12 px-4 min-w-0 transition-colors"
                disabled={!isSelected && (data.interests?.length >= 10)}
              >
                {interest}
                {isSelected && <X className="w-3 h-3 ml-2" />}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Bio - Mobile Optimized */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Bio</Label>
        <Textarea
          placeholder="Tell us about yourself in a few sentences..."
          value={data.bio}
          onChange={(e) => updateField('bio', e.target.value)}
          className="rounded-2xl min-h-[120px] resize-none text-base px-4 py-3 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors"
          maxLength={500}
        />
        <div className="text-right text-sm text-muted-foreground">
          {data.bio?.length || 0}/500
        </div>
      </div>
    </div>
  );
};

export default WhatYouAreStep;