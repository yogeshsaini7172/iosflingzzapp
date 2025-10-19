import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Target, X, Briefcase } from "lucide-react";
import { ProfessionCombobox } from "@/components/profile/ProfessionCombobox";

interface WhoYouWantStepProps {
  data: any;
  onChange: (data: any) => void;
}

const WhoYouWantStep = ({ data, onChange }: WhoYouWantStepProps) => {
  const updateField = (field: string, value: any) => {
    onChange((prev: any) => ({ ...prev, [field]: value }));
  };

  const genderOptions = ["Male", "Female", "Non-binary", "All"];
  
  const bodyTypeOptions = [
    "Slim", "Athletic", "Average", "Curvy", "Plus Size", "Any"
  ];

  const valueOptions = [
    "Family-oriented", "Career-focused", "Adventure-seeking", "Spiritual", 
    "Health-conscious", "Creative", "Intellectual", "Social justice", 
    "Environmental", "Traditional"
  ];

  const mindsetOptions = [
    "Growth Mindset", "Positive Thinking", "Pragmatic", "Optimistic", 
    "Realistic", "Ambitious"
  ];

  const personalityOptions = [
    "Adventurous", "Analytical", "Creative", "Outgoing", "Introverted", 
    "Empathetic", "Ambitious", "Laid-back", "Intellectual", "Spontaneous"
  ];

  const relationshipGoalOptions = [
    "Serious relationship", "Casual dating", "Marriage", "Friendship first", 
    "Open to anything", "Long-term commitment"
  ];

  const skinToneOptions = [
    "Fair", "Light", "Medium", "Olive", "Tan", "Dark", "Any"
  ];

  const faceTypeOptions = [
    "Oval", "Round", "Square", "Heart", "Diamond", "Long", "Any"
  ];

  const toggleArrayItem = (field: string, item: string, maxItems: number = 10) => {
    const currentArray = data[field] || [];
    
    // Special handling for "Any" or "All" - they mean "all options accepted"
    if (item === "Any" || item === "All") {
      if (!currentArray.includes(item)) {
        // Selecting "Any"/"All" clears all specific selections
        updateField(field, [item]);
      } else {
        // Deselecting "Any"/"All" clears the preference
        updateField(field, []);
      }
      return;
    }
    
    // If selecting a specific option, remove "Any"/"All" first
    const filteredArray = currentArray.filter((i: string) => i !== "Any" && i !== "All");
    
    const newArray = filteredArray.includes(item)
      ? filteredArray.filter((i: string) => i !== item)
      : filteredArray.length < maxItems
      ? [...filteredArray, item]
      : filteredArray;
    
    updateField(field, newArray);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <Heart className="w-12 h-12 text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">What are you looking for in a partner?</p>
      </div>

      {/* Physical Preferences */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2 text-primary">
            <Heart className="w-6 h-6 text-primary animate-pulse" />
            Physical Preferences
          </CardTitle>
          <p className="text-sm text-muted-foreground">Select your preferred physical attributes</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preferred Skin Tone */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Preferred Skin Tone</Label>
            <div className="flex flex-wrap gap-2">
              {["Porcelain", "Fair", "Light", "Light Medium", "Medium", "Tan", "Olive", "Brown", "Dark Brown", "Deep", "Ebony", "Any"].map((tone) => {
                const isSelected = data.preferredSkinTone?.includes(tone);
                return (
                  <Button
                    key={tone}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredSkinTone', tone)}
                    className="rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  >
                    {tone}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Preferred Face Shape */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Preferred Face Shape</Label>
            <div className="flex flex-wrap gap-2">
              {["Oval", "Round", "Square", "Rectangle", "Heart", "Diamond", "Triangle", "Any"].map((type) => {
                const isSelected = data.preferredFaceType?.includes(type);
                return (
                  <Button
                    key={type}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredFaceType', type)}
                    className="rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  >
                    {type}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle Preferences */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Target className="w-5 h-5" />
            Lifestyle Preferences
          </CardTitle>
          <p className="text-sm text-muted-foreground">What lifestyle habits are important to you?</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exercise Habits */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Exercise Habits</Label>
            <div className="flex flex-wrap gap-2">
              {["Daily", "Few times a week", "Weekly", "Occasionally", "Rarely", "Any"].map((habit) => {
                const isSelected = data.preferredExercise?.includes(habit);
                return (
                  <Button
                    key={habit}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredExercise', habit)}
                    className="rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  >
                    {habit}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Drinking Habits */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Drinking Habits</Label>
            <div className="flex flex-wrap gap-2">
              {["Never", "Socially", "Regularly", "Any"].map((habit) => {
                const isSelected = data.preferredDrinking?.includes(habit);
                return (
                  <Button
                    key={habit}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredDrinking', habit)}
                    className="rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  >
                    {habit}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Smoking Habits */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Smoking Habits</Label>
            <div className="flex flex-wrap gap-2">
              {["Never", "Socially", "Regularly", "Any"].map((habit) => {
                const isSelected = data.preferredSmoking?.includes(habit);
                return (
                  <Button
                    key={habit}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredSmoking', habit)}
                    className="rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  >
                    {habit}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Diet Preference */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Diet Preference</Label>
            <div className="flex flex-wrap gap-2">
              {["Vegetarian", "Vegan", "Pescatarian", "Omnivore", "Halal", "Kosher", "Any"].map((diet) => {
                const isSelected = data.preferredDiet?.includes(diet);
                return (
                  <Button
                    key={diet}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredDiet', diet)}
                    className="rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  >
                    {diet}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Pet Preference */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Pet Preference</Label>
            <div className="flex flex-wrap gap-2">
              {["Have pets", "Want pets", "No pets", "Any"].map((pref) => {
                const isSelected = data.preferredPets?.includes(pref);
                return (
                  <Button
                    key={pref}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredPets', pref)}
                    className="rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  >
                    {pref}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Children Plans */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Children Plans</Label>
            <div className="flex flex-wrap gap-2">
              {["Want children", "Don't want", "Have children", "Open to children", "Any"].map((plan) => {
                const isSelected = data.preferredChildren?.includes(plan);
                return (
                  <Button
                    key={plan}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredChildren', plan)}
                    className="rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  >
                    {plan}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Preferences */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Basic Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gender Preference */}
          <div className="space-y-3">
            <Label>Interested in</Label>
            <div className="flex flex-wrap gap-2">
              {genderOptions.map((gender) => {
                const isSelected = data.preferredGender?.includes(gender);
                return (
                  <Button
                    key={gender}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredGender', gender, 4)}
                    className="rounded-full"
                  >
                    {gender}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-3">
            <Label>Age Range: {data.ageRangeMin} - {data.ageRangeMax} years</Label>
            <div className="px-2">
              <Slider
                value={[data.ageRangeMin || 18, data.ageRangeMax || 30]}
                onValueChange={([min, max]) => {
                  updateField('ageRangeMin', min);
                  updateField('ageRangeMax', max);
                }}
                min={18}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Height Range */}
          <div className="space-y-3">
            <Label>Height Range: {data.heightRangeMin} - {data.heightRangeMax} cm</Label>
            <div className="px-2">
              <Slider
                value={[data.heightRangeMin || 150, data.heightRangeMax || 200]}
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
          </div>

          {/* Body Type Preference */}
          <div className="space-y-3">
            <Label>Preferred Body Types</Label>
            <div className="flex flex-wrap gap-2">
              {bodyTypeOptions.map((type) => {
                const isSelected = data.preferredBodyTypes?.includes(type);
                return (
                  <Button
                    key={type}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredBodyTypes', type)}
                    className="rounded-full text-xs"
                  >
                    {type}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Values & Personality */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Values & Personality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preferred Values */}
          <div className="space-y-3">
            <Label>Preferred Values</Label>
            <div className="flex flex-wrap gap-2">
              {valueOptions.map((value) => {
                const isSelected = data.preferredValues?.includes(value);
                return (
                  <Button
                    key={value}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredValues', value)}
                    className="rounded-full text-xs"
                  >
                    {value}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Preferred Mindset */}
          <div className="space-y-3">
            <Label>Preferred Mindset</Label>
            <div className="flex flex-wrap gap-2">
              {mindsetOptions.map((mindset) => {
                const isSelected = data.preferredMindset?.includes(mindset);
                return (
                  <Button
                    key={mindset}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredMindset', mindset)}
                    className="rounded-full text-xs"
                  >
                    {mindset}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Preferred Personality */}
          <div className="space-y-3">
            <Label>Preferred Personality</Label>
            <div className="flex flex-wrap gap-2">
              {personalityOptions.map((personality) => {
                const isSelected = data.preferredPersonality?.includes(personality);
                return (
                  <Button
                    key={personality}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredPersonality', personality)}
                    className="rounded-full text-xs"
                  >
                    {personality}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Preferred Love Language */}
          <div className="space-y-3">
            <Label>Preferred Love Language</Label>
            <div className="flex flex-wrap gap-2">
              {["Words of Affirmation", "Acts of Service", "Receiving Gifts", "Quality Time", "Physical Touch"].map((language) => {
                const isSelected = data.preferredLoveLanguage?.includes(language);
                return (
                  <Button
                    key={language}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredLoveLanguage', language)}
                    className="rounded-full text-xs"
                  >
                    {language}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Preferred Lifestyle */}
          <div className="space-y-3">
            <Label>Preferred Lifestyle</Label>
            <div className="flex flex-wrap gap-2">
              {["Active & Outdoorsy", "Social & Party", "Quiet & Homebody", "Balanced", "Adventurous", "Studious & Academic"].map((lifestyle) => {
                const isSelected = data.preferredLifestyle?.includes(lifestyle);
                return (
                  <Button
                    key={lifestyle}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredLifestyle', lifestyle)}
                    className="rounded-full text-xs"
                  >
                    {lifestyle}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Relationship Goals */}
          <div className="space-y-3">
            <Label>Preferred Relationship Goals</Label>
            <div className="flex flex-wrap gap-2">
              {relationshipGoalOptions.map((goal) => {
                const isSelected = data.preferredRelationshipGoals?.includes(goal);
                return (
                  <Button
                    key={goal}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredRelationshipGoals', goal)}
                    className="rounded-full text-xs"
                  >
                    {goal}
                    {isSelected && <X className="w-3 h-3 ml-1" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Preferences */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Professional Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Preferred Professions</Label>
            <p className="text-xs text-muted-foreground">
              Select multiple professions you'd prefer in a partner
            </p>
            <ProfessionCombobox
              value=""
              onChange={() => {}}
              multiple
              selectedValues={data.preferredProfessions || []}
              onMultiChange={(values) => updateField('preferredProfessions', values)}
              placeholder="Select preferred professions"
            />
            {data.preferredProfessions && data.preferredProfessions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 max-w-full overflow-hidden">
                {data.preferredProfessions.map((profession: string) => (
                  <Button
                    key={profession}
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleArrayItem('preferredProfessions', profession)}
                    className="rounded-full text-xs max-w-full"
                  >
                    <span className="truncate max-w-[250px]">{profession}</span>
                    <X className="w-3 h-3 ml-1 flex-shrink-0" />
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhoYouWantStep;