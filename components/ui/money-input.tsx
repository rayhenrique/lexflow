"use client";

import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

interface MoneyInputProps {
  value: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
}

export function MoneyInput({ value, onValueChange, placeholder }: MoneyInputProps) {
  return (
    <NumericFormat
      customInput={Input}
      value={value ?? undefined}
      onValueChange={({ floatValue }) => onValueChange(floatValue ?? null)}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      prefix="R$ "
      allowNegative={false}
      inputMode="decimal"
      placeholder={placeholder}
    />
  );
}
