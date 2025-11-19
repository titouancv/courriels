import React from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon'
    size?: 'sm' | 'md' | 'lg' | 'icon'
    isLoading?: boolean
    icon?: React.ElementType
}

export function Button({
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading,
    icon: Icon,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles =
        'inline-flex items-center justify-center rounded transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary:
            'bg-[#00712D] text-white hover:bg-[#005a24] border border-transparent dark:bg-[#00712D] dark:hover:bg-[#005a24]',
        secondary:
            'bg-white text-[#37352F] border border-[#E9E9E7] hover:bg-[#F7F7F5] dark:bg-[#202020] dark:text-[#D4D4D4] dark:border-[#2F2F2F] dark:hover:bg-[#2F2F2F]',
        ghost: 'text-[#787774] hover:bg-[#EFEFED] hover:text-[#37352F] bg-transparent dark:text-[#9B9A97] dark:hover:bg-[#2F2F2F] dark:hover:text-[#D4D4D4]',
        icon: 'text-[#787774] hover:bg-[#EFEFED] hover:text-[#37352F] bg-transparent dark:text-[#9B9A97] dark:hover:bg-[#2F2F2F] dark:hover:text-[#D4D4D4]',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
        icon: 'p-2',
    }

    return (
        <button
            className={clsx(
                baseStyles,
                variants[variant],
                variant === 'icon' ? sizes.icon : sizes[size],
                className
            )}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && (
                <svg
                    className="mr-2 -ml-1 h-4 w-4 animate-spin text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
            )}
            {!isLoading && Icon && (
                <Icon className={clsx('h-4 w-4', children ? 'mr-2' : '')} />
            )}
            {children}
        </button>
    )
}
