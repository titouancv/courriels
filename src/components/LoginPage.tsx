import { Button } from '../design-system/Button'
import { LogIn } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function LoginPage() {
    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                redirectTo: window.location.origin,
            },
        })
    }

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#F7F7F5] transition-colors duration-200 dark:bg-[#191919]">
            <div className="space-y-6 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00712D] shadow-lg">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28C21.5 28 26.15 24.3 27.5 19.2C27.7 18.4 27.2 17.6 26.4 17.6C25.7 17.6 25.1 18.1 24.9 18.8C23.9 22.3 20.3 25 16 25C11.0294 25 7 20.9706 7 16C7 11.0294 11.0294 7 16 7C20.3 7 23.9 9.7 24.9 13.2C25.1 13.9 25.7 14.4 26.4 14.4C27.2 14.4 27.7 13.6 27.5 12.8C26.15 7.7 21.5 4 16 4Z"
                                fill="white"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-[#37352F] dark:text-[#D4D4D4]">
                        courriels
                    </h1>
                </div>

                <div className="w-80 rounded-xl border border-[#E9E9E7] bg-white p-8 shadow-sm dark:border-[#2F2F2F] dark:bg-[#202020]">
                    <p className="mb-6 text-center text-sm text-[#787774] dark:text-[#9B9A97]">
                        Connect your Gmail account to get started
                    </p>
                    <Button
                        onClick={handleLogin}
                        className="w-full justify-center gap-2"
                        icon={LogIn}
                    >
                        Sign in with Google
                    </Button>
                </div>
            </div>
        </div>
    )
}
