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
  "Student",
  "Corporate Employee (IT / Finance / Marketing / HR / Operations)",
  "Entrepreneur / Business Owner",
  "Government Employee",
  "Doctor / Healthcare Professional",
  "Nurse / Paramedical Staff",
  "Engineer (Software / Civil / Mechanical / Electrical)",
  "Lawyer / Legal Professional",
  "Teacher / Professor / Researcher",
  "Banker / Finance Professional",
  "Chartered Accountant / Company Secretary",
  "Politician / Civil Servant (IAS / IPS / IRS etc.)",
  "Social Worker / NGO Worker",
  "Artist / Designer / Writer / Content Creator",
  "Journalist / Media Professional",
  "Actor / Musician / Performer",
  "Sportsperson / Athlete / Coach",
  "Armed Forces (Army / Navy / Air Force)",
  "Police / Firefighter",
  "Farmer / Agriculture Professional",
  "Skilled Worker (Electrician / Mechanic / Carpenter / Tailor / Driver etc.)",
  "Freelancer / Self-Employed",
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
