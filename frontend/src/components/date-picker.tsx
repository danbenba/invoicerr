import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";

import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { languageToLocale } from "@/lib/i18n";
import { useTranslation } from "react-i18next";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  showOutsideDays?: boolean;
  'data-cy'?: string;
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value, onChange, placeholder, className, showOutsideDays, 'data-cy': dataCy, ...props }, ref) => {
    const { i18n } = useTranslation()

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[240px] pl-3 text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
            data-cy={dataCy}
            ref={ref}
            {...props}
          >
            {value ? (
              format(value, "PPP", {
                locale: languageToLocale(i18n.language)
              })
            ) : (
              <span>{placeholder || "Pick a date"}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-500 w-full p-0 mt-2 rounded-lg outline-1" align="start">
          <Calendar
            required
            mode="single"
            selected={value || undefined}
            onSelect={onChange}
            captionLayout="dropdown"
            showOutsideDays={showOutsideDays || true}
          />
        </PopoverContent>
      </Popover>
    );
  });
DatePicker.displayName = "DatePicker";

export { DatePicker };