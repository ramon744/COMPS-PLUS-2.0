import { useState, useEffect, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  value?: number; // Value in cents
  onChange?: (valueInCents: number) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value = 0, onChange, label, placeholder = "0,00", error, required }, ref) => {
    const { config } = useSettings();
    const [displayValue, setDisplayValue] = useState("");

    // Format value from cents to BRL display
    const formatValue = (cents: number): string => {
      if (cents === 0) return "";
      const reais = cents / 100;
      return reais.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Parse display value to cents
    const parseValue = (input: string): number => {
      const digitsOnly = input.replace(/\D/g, "");
      if (!digitsOnly) return 0;
      return parseInt(digitsOnly, 10);
    };

    useEffect(() => {
      setDisplayValue(formatValue(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const digitsOnly = input.replace(/\D/g, "");
      
      const cents = parseValue(input);
      
      // Use max value from settings
      if (cents <= config.valorMaximoComp) {
        const formatted = formatValue(cents);
        setDisplayValue(formatted);
        onChange?.(cents);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace, delete, tab, escape, enter
      if ([8, 9, 27, 13, 46].includes(e.keyCode)) return;
      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (e.ctrlKey || e.metaKey) return;
      // Ensure that it's a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
      }
    };

    return (
      <div className="space-y-2">
        {label && (
          <Label className="text-sm sm:text-base font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base">
            R$
          </span>
          <Input
            ref={ref}
            type="text"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "pl-10 h-10 sm:h-11 text-base sm:text-lg font-mono",
              error ? "border-destructive" : ""
            )}
            inputMode="numeric"
          />
        </div>
        {error && (
          <p className="text-xs sm:text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

MoneyInput.displayName = "MoneyInput";