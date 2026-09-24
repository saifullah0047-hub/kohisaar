"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";

export function SearchInput({
  value: controlledValue,
  onChange,
  placeholder = "Search...",
  debounceMs = 300,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}) {
  const [local, setLocal] = useState(controlledValue ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = (val: string) => {
    setLocal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(val), debounceMs);
  };

  return (
    <div className="admin-search-input">
      <Search size={14} className="admin-search-input__icon" />
      <input
        type="text"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="admin-search-input__field"
      />
    </div>
  );
}
