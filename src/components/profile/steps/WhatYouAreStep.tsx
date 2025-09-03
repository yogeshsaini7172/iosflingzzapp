import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Plus, X } from "lucide-react";
import { useState } from "react";

interface WhatYouAreStepProps {
  data: any;
  onChange: (data: any) => void;
}

const WhatYouAreStep = ({ data, onChange }: WhatYouAreStepProps) => {
  const [newInterest, setNewInterest] = useState("");
  const [newGoal, setNewGoal] = useState("");

  const updateField = (field: string, value: any) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !data.interests.includes(newInterest.trim())) {
      updateField('interests', [...data.interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    updateField('interests', data.interests.filter(i => i !== interest));
  };

  const addGoal = () => {
    if (newGoal.trim() && !data.relationshipGoals.includes(newGoal.trim())) {
      updateField('relationshipGoals', [...data.relationshipGoals, newGoal.trim()]);
      setNewGoal("");
    }
  };

  const removeGoal = (goal: string) => {
    updateField('relationshipGoals', data.relationshipGoals.filter(g => g !== goal));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <Heart className="w-12 h-12 text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Tell us about your personality and what makes you unique</p>
      </div>

      {/* Physical Attributes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Height (cm)</Label>
          <Input
            placeholder="170"
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
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="athletic">Athletic</SelectItem>
              <SelectItem value="curvy">Curvy</SelectItem>
              <SelectItem value="plus-size">Plus Size</SelectItem>
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
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="olive">Olive</SelectItem>
            <SelectItem value="brown">Brown</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Personality */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Personality Type</Label>
          <Select value={data.personalityType} onValueChange={(value) => updateField('personalityType', value)}>
            <SelectTrigger className="rounded-xl h-12">
              <SelectValue placeholder="How would you describe yourself?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="introvert">Introvert</SelectItem>
              <SelectItem value="extrovert">Extrovert</SelectItem>
              <SelectItem value="ambivert">Ambivert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Values</Label>
          <Select value={data.values} onValueChange={(value) => updateField('values', value)}>
            <SelectTrigger className="rounded-xl h-12">
              <SelectValue placeholder="What matters to you?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="family">Family-oriented</SelectItem>
              <SelectItem value="career">Career-focused</SelectItem>
              <SelectItem value="spiritual">Spiritual</SelectItem>
              <SelectItem value="adventurous">Adventurous</SelectItem>
              <SelectItem value="traditional">Traditional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Mindset</Label>
        <Select value={data.mindset} onValueChange={(value) => updateField('mindset', value)}>
          <SelectTrigger className="rounded-xl h-12">
            <SelectValue placeholder="Your general outlook" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="optimistic">Optimistic</SelectItem>
            <SelectItem value="realistic">Realistic</SelectItem>
            <SelectItem value="pragmatic">Pragmatic</SelectItem>
            <SelectItem value="creative">Creative</SelectItem>
            <SelectItem value="analytical">Analytical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Interests */}
      <div className="space-y-3">
        <Label>Interests & Hobbies</Label>
        <div className="flex space-x-2">
          <Input
            placeholder="Add an interest..."
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            className="rounded-xl h-10"
            onKeyPress={(e) => e.key === 'Enter' && addInterest()}
          />
          <Button onClick={addInterest} size="sm" className="rounded-xl">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.interests.map((interest, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {interest}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0"
                onClick={() => removeInterest(interest)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Relationship Goals */}
      <div className="space-y-3">
        <Label>Relationship Goals</Label>
        <div className="flex space-x-2">
          <Input
            placeholder="Add a relationship goal..."
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="rounded-xl h-10"
            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
          />
          <Button onClick={addGoal} size="sm" className="rounded-xl">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.relationshipGoals.map((goal, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {goal}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0"
                onClick={() => removeGoal(goal)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea
          placeholder="Tell us about yourself in a few sentences..."
          value={data.bio}
          onChange={(e) => updateField('bio', e.target.value)}
          className="rounded-xl min-h-[100px]"
          maxLength={300}
        />
        <div className="text-xs text-muted-foreground text-right">
          {data.bio.length}/300 characters
        </div>
      </div>
    </div>
  );
};

export default WhatYouAreStep;