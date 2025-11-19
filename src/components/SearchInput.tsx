import { Search } from 'lucide-react';
import { clsx } from 'clsx';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search...", className }: SearchInputProps) {
  return (
    <div className={clsx("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9A97]" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2 bg-[#F7F7F5] dark:bg-[#202020] border border-transparent focus:bg-white dark:focus:bg-[#191919] focus:border-[#E9E9E7] dark:focus:border-[#2F2F2F] rounded-md text-sm outline-none transition-all placeholder-[#9B9A97] text-[#37352F] dark:text-[#D4D4D4]"
      />
    </div>
  );
}
