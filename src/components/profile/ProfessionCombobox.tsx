import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const PROFESSIONS = [
  "Actor / Musician / Performer",
  "Armed Forces (Army / Navy / Air Force)",
  "Artist / Designer / Writer / Content Creator",
  "Banker / Finance Professional",
  "Chartered Accountant / Company Secretary",
  "Corporate Employee (IT / Finance / Marketing / HR / Operations)",
  "Doctor / Healthcare Professional",
  "Engineer (Software / Civil / Mechanical / Electrical)",
  "Entrepreneur / Business Owner",
  "Farmer / Agriculture Professional",
  "Freelancer / Self-Employed",
  "Government Employee",
  "Journalist / Media Professional",
  "Lawyer / Legal Professional",
  "Nurse / Paramedical Staff",
  "Police / Firefighter",
  "Politician / Civil Servant (IAS / IPS / IRS etc.)",
  "Skilled Worker (Electrician / Mechanic / Carpenter / Tailor / Driver etc.)",
  "Social Worker / NGO Worker",
  "Sportsperson / Athlete / Coach",
  "Student",
  "Teacher / Professor / Researcher",
  "Other",
];

interface ProfessionComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiple?: boolean;
  selectedValues?: string[];
  onMultiChange?: (values: string[]) => void;
}

export function ProfessionCombobox({
  value,
  onChange,
  placeholder = "Select profession...",
  multiple = false,
  selectedValues = [],
  onMultiChange,
}: ProfessionComboboxProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (currentValue: string) => {
    if (multiple && onMultiChange) {
      const newValues = selectedValues.includes(currentValue)
        ? selectedValues.filter((v) => v !== currentValue)
        : [...selectedValues, currentValue];
      onMultiChange(newValues);
    } else {
      onChange(currentValue === value ? "" : currentValue);
      setOpen(false);
    }
  };

  const displayValue = multiple
    ? selectedValues.length > 0
      ? `${selectedValues.length} selected`
      : placeholder
    : value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-2xl h-14 text-base px-4 bg-background/50 border-2 border-border/50 hover:border-primary transition-colors"
        >
          <span className={cn(!value && !multiple && "text-muted-foreground")}>
            {displayValue}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command className="w-full">
          <CommandInput placeholder="Search profession..." className="h-9" />
          <CommandList>
            <CommandEmpty>No profession found.</CommandEmpty>
            <CommandGroup>
              {PROFESSIONS.map((profession) => {
                const isSelected = multiple
                  ? selectedValues.includes(profession)
                  : value === profession;
                return (
                  <CommandItem
                    key={profession}
                    value={profession}
                    onSelect={() => handleSelect(profession)}
                  >
                    {profession}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
