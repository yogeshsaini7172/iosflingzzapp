import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const RELATIONSHIP_STATUS_OPTIONS = [
  { value: 'single', label: 'Single', description: 'Ready to mingle' },
  { value: 'talking_stage', label: 'Talking Stage', description: 'Getting to know someone' },
  { value: 'situationship', label: 'Situationship', description: 'It\'s complicated but not official' },
  { value: 'soft_launching', label: 'Soft Launching', description: 'Keeping it lowkey on socials' },
  { value: 'cuffing', label: 'Cuffing Season', description: 'Looking for someone for the cold months' },
  { value: 'fwb', label: 'FWB', description: 'Friends with benefits' },
  { value: 'exclusive', label: 'Exclusive', description: 'Only seeing each other' },
  { value: 'serious', label: 'Serious', description: 'In a committed relationship' },
  { value: 'benched', label: 'Benched', description: 'Keeping options open' },
  { value: 'breadcrumbing', label: 'Breadcrumbing', description: 'Getting minimal attention' },
  { value: 'ghosting_recovery', label: 'Ghosting Recovery', description: 'Getting back out there' }
];

interface RelationshipStatusSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function RelationshipStatusSelector({ 
  value, 
  onValueChange, 
  disabled = false 
}: RelationshipStatusSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="relationship-status" className="text-sm font-medium">
        Relationship Status 💕
      </Label>
      <Select 
        value={value} 
        onValueChange={onValueChange} 
        disabled={disabled}
        name="relationship-status"
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="What's your current vibe?" />
        </SelectTrigger>
        <SelectContent>
          {RELATIONSHIP_STATUS_OPTIONS.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="cursor-pointer"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function getRelationshipStatusLabel(value: string): string {
  const option = RELATIONSHIP_STATUS_OPTIONS.find(opt => opt.value === value);
  return option?.label || value;
}

export function getRelationshipStatusDescription(value: string): string {
  const option = RELATIONSHIP_STATUS_OPTIONS.find(opt => opt.value === value);
  return option?.description || '';
}