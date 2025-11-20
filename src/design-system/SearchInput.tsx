import { Search } from 'lucide-react'
import { clsx } from 'clsx'

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function SearchInput({
    value,
    onChange,
    placeholder = 'Search...',
    className,
}: SearchInputProps) {
    return (
        <div className={clsx('relative', className)}>
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9B9A97]" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-md border border-transparent bg-[#F7F7F5] py-2 pr-4 pl-9 text-sm text-[#37352F] placeholder-[#9B9A97] transition-all outline-none focus:border-[#E9E9E7] focus:bg-white dark:bg-[#202020] dark:text-[#D4D4D4] dark:focus:border-[#2F2F2F] dark:focus:bg-[#191919]"
            />
        </div>
    )
}
