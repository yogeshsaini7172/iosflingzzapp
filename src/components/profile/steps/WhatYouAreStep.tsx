import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { User, X } from "lucide-react";

interface ProfileData {
  height?: string;
  bodyType?: string;
  exerciseHabits?: string;
  drinkingHabits?: string;
  smokingHabits?: string;
  dietPreference?: string;
  petPreference?: string;
  childrenPlans?: string;
  personalityType?: string[];
  values?: string[];
  mindset?: string[];
  loveLanguage?: string;
  lifestyle?: string;
  relationshipGoals?: string[];
  interests?: string[];
  bio?: string;
  heightRangeMin?: number;
  heightRangeMax?: number;
}

interface WhatYouAreStepProps {
  data: ProfileData;
  onChange: (updater: (prev: ProfileData) => ProfileData) => void;
}

const WhatYouAreStep = ({ data, onChange }: WhatYouAreStepProps) => {
  const updateField = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    onChange((prev: ProfileData) => ({ ...prev, [field]: value }));
  };
const mindsetOptions = [
  "Growth Mindset", "Positive Thinking", "Pragmatic", "Optimistic", 
  "Realistic", "Ambitious", "Balanced", "Mindful", "Flexible", 
  "Open-minded", "Passionate", "Spiritual"
];
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

// handle multi-select toggle
const toggleArrayItem = (field: 'personalityType' | 'values' | 'mindset' | 'relationshipGoals' | 'interests', item: string, maxItems: number = 10) => {
  const currentArray = data[field] || [];
  const newArray = currentArray.includes(item)
    ? currentArray.filter((i: string) => i !== item)
    : currentArray.length < maxItems
    ? [...currentArray, item]
    : currentArray;
  
  updateField(field, newArray);
};

// render tag-based multi-select
const renderMultiSelectTags = (
  field: 'personalityType' | 'values' | 'mindset',
  options: string[],
  maxItems: number,
  label: string
) => {
  const currentArray = data[field] || [];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{label}</Label>
        <span className="text-sm text-muted-foreground">
          {currentArray.length}/{maxItems}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = currentArray.includes(option);
          return (
            <Button
              key={option}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleArrayItem(field, option, maxItems)}
              className="rounded-2xl text-sm h-12 px-4 min-w-0 transition-colors"
              disabled={!isSelected && (currentArray.length >= maxItems)}
            >
              {option}
              {isSelected && <X className="w-3 h-3 ml-2" />}
            </Button>
          );
        })}
      </div>
    </div>
  );
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
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="175"
              value={data.height || ''}
              onKeyDown={(e) => {
                // Prevent all non-numeric characters from being typed
                const allowedKeys = [
                  'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                  'Home', 'End'
                ];
                
                // Allow numbers 0-9
                const isNumber = e.key >= '0' && e.key <= '9';
                
                // Allow Ctrl/Cmd combinations for copy/paste/select all
                const isCtrlCmd = e.ctrlKey || e.metaKey;
                
                if (!isNumber && !allowedKeys.includes(e.key) && !isCtrlCmd) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                // Handle paste events to only allow numeric content
                e.preventDefault();
                const paste = e.clipboardData.getData('text');
                const numericOnly = paste.replace(/[^0-9]/g, '').slice(0, 3);
                if (numericOnly) {
                  const numValue = parseInt(numericOnly);
                  if (numValue >= 100 && numValue <= 250) {
                    updateField('height', numericOnly);
                  } else if (numValue > 250) {
                    updateField('height', '250');
                  } else if (numValue < 100 && numericOnly.length === 3) {
                    updateField('height', '100');
                  } else {
                    updateField('height', numericOnly);
                  }
                }
              }}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow digits and limit to reasonable height range
                const numericValue = value.replace(/[^0-9]/g, '');
                // Limit to 3 digits and reasonable height range (100-250 cm)
                const limitedValue = numericValue.slice(0, 3);
                const numValue = parseInt(limitedValue);
                
                // Only update if it's empty or within reasonable range
                if (limitedValue === '' || (numValue >= 100 && numValue <= 250)) {
                  updateField('height', limitedValue);
                } else if (numValue > 250) {
                  updateField('height', '250');
                } else if (numValue < 100 && limitedValue.length === 3) {
                  updateField('height', '100');
                } else {
                  updateField('height', limitedValue);
                }
              }}
              className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors"
            />
            {data.height && (parseInt(data.height) < 100 || parseInt(data.height) > 250) && (
              <p className="text-sm text-destructive mt-1">
                Please enter a height between 100-250 cm
              </p>
            )}
          </div>
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

      {/* Lifestyle Habits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">Exercise Habits</Label>
          <Select value={data.exerciseHabits} onValueChange={(value) => updateField('exerciseHabits', value)}>
            <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
              <SelectValue placeholder="How often do you exercise?" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="few_times_week">Few times a week</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="occasionally">Occasionally</SelectItem>
              <SelectItem value="rarely">Rarely</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Drinking Habits</Label>
          <Select value={data.drinkingHabits} onValueChange={(value) => updateField('drinkingHabits', value)}>
            <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
              <SelectValue placeholder="Do you drink?" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="socially">Socially</SelectItem>
              <SelectItem value="regularly">Regularly</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">Smoking Habits</Label>
          <Select value={data.smokingHabits} onValueChange={(value) => updateField('smokingHabits', value)}>
            <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
              <SelectValue placeholder="Do you smoke?" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="socially">Socially</SelectItem>
              <SelectItem value="regularly">Regularly</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Diet Preference</Label>
          <Select value={data.dietPreference} onValueChange={(value) => updateField('dietPreference', value)}>
            <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
              <SelectValue placeholder="Your dietary preference" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="vegetarian">Vegetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
              <SelectItem value="pescatarian">Pescatarian</SelectItem>
              <SelectItem value="omnivore">Omnivore</SelectItem>
              <SelectItem value="halal">Halal</SelectItem>
              <SelectItem value="kosher">Kosher</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Life Goals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">Pets</Label>
          <Select value={data.petPreference} onValueChange={(value) => updateField('petPreference', value)}>
            <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
              <SelectValue placeholder="Your pet situation" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="have_pets">Have pets and love them</SelectItem>
              <SelectItem value="want_pets">Want pets someday</SelectItem>
              <SelectItem value="allergic">Allergic to pets</SelectItem>
              <SelectItem value="no_pets">Don't want pets</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-base font-medium">Children Plans</Label>
          <Select value={data.childrenPlans} onValueChange={(value) => updateField('childrenPlans', value)}>
            <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
              <SelectValue placeholder="Your plans about children" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="want_children">Want children someday</SelectItem>
              <SelectItem value="dont_want_children">Don't want children</SelectItem>
              <SelectItem value="have_children">Have children</SelectItem>
              <SelectItem value="open_to_children">Open to children</SelectItem>
              <SelectItem value="not_sure">Not sure yet</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* personality multi-select */}
      {renderMultiSelectTags(
        'personalityType',
        personalityTypes,
        5,
        'Personality Type (select up to 5)'
      )}

      {/* values multi-select */}
      {renderMultiSelectTags(
        'values',
        valueOptions,
        5,
        'Values (select up to 5)'
      )}

      {/* mindset multi-select */}
      {renderMultiSelectTags(
        'mindset',
        mindsetOptions,
        3,
        'Mindset (select up to 3)'
      )}

      {/* Love Language */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Love Language</Label>
        <Select value={data.loveLanguage} onValueChange={(value) => updateField('loveLanguage', value)}>
          <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
            <SelectValue placeholder="Select your love language" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="words_of_affirmation">Words of Affirmation</SelectItem>
            <SelectItem value="acts_of_service">Acts of Service</SelectItem>
            <SelectItem value="receiving_gifts">Receiving Gifts</SelectItem>
            <SelectItem value="quality_time">Quality Time</SelectItem>
            <SelectItem value="physical_touch">Physical Touch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lifestyle */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Lifestyle</Label>
        <Select value={data.lifestyle} onValueChange={(value) => updateField('lifestyle', value)}>
          <SelectTrigger className="rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 focus:border-primary transition-colors">
            <SelectValue placeholder="Select your lifestyle" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="active">Active & Outdoorsy</SelectItem>
            <SelectItem value="social">Social & Party</SelectItem>
            <SelectItem value="quiet">Quiet & Homebody</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="adventurous">Adventurous</SelectItem>
            <SelectItem value="studious">Studious & Academic</SelectItem>
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