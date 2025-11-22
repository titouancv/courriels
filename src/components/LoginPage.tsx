import { Shield, Zap, Sparkles } from 'lucide-react'
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
        <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#F7F7F5] transition-colors duration-200 dark:bg-[#191919]">
            {/* Background decoration - Sharp geometric shapes */}
            <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] bg-green-200/10 blur-3xl dark:bg-green-900/10" />
            <div className="absolute top-[40%] -right-[10%] h-[400px] w-[400px] bg-blue-200/10 blur-3xl dark:bg-blue-900/10" />

            <div className="z-10 w-full max-w-md px-4">
                <div className="mb-12 text-center">
                    <h1 className="mb-2 text-4xl font-bold text-[#37352F] dark:text-[#D4D4D4]">
                        corriels
                    </h1>
                    <p className="text-md text-[#787774] dark:text-[#9B9A97]">
                        SYSTEM_READY // AWAITING_INPUT
                    </p>
                </div>

                <div className="border border-[#E9E9E7] bg-white p-8 shadow-none dark:border-[#2F2F2F] dark:bg-[#202020]">
                    <div className="mb-8 space-y-4">
                        <div className="text-md flex items-center gap-3 text-[#37352F] dark:text-[#D4D4D4]">
                            <div className="flex h-8 w-8 items-center justify-center bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <Zap className="h-4 w-4" />
                            </div>
                            <span className="text-xs">
                                Lightning fast interface
                            </span>
                        </div>
                        <div className="text-md flex items-center gap-3 text-[#37352F] dark:text-[#D4D4D4]">
                            <div className="flex h-8 w-8 items-center justify-center bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                <Shield className="h-4 w-4" />
                            </div>
                            <span className="text-xs">
                                Secure & Private by design
                            </span>
                        </div>
                        <div className="text-md flex items-center gap-3 text-[#37352F] dark:text-[#D4D4D4]">
                            <div className="flex h-8 w-8 items-center justify-center bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <span className="text-xs">
                                AI-powered assistance
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Google Sign-In Button following guidelines */}
                        <button
                            onClick={handleLogin}
                            className="group flex w-full items-center justify-center gap-3 bg-[#F7F7F5] p-0.5 transition-all hover:bg-[#F4F4F0] focus:ring-2 focus:ring-[#4285F4] focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-[#191919]"
                        >
                            <div className="flex h-10 w-10 items-center justify-center">
                                <svg
                                    width="18"
                                    height="18"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 48 48"
                                >
                                    <path
                                        fill="#EA4335"
                                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                    />
                                    <path
                                        fill="#4285F4"
                                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M24 48c6.48 0 12.01-2.09 15.98-5.77l-7.73-6c-2.15 1.45-4.92 2.3-8.25 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                    />
                                    <path fill="none" d="M0 0h48v48H0z" />
                                </svg>
                            </div>
                            <span className="font-roboto text-md font-medium text-black">
                                Sign in with Google
                            </span>
                        </button>

                        <p className="text-center text-sm tracking-widest dark:text-[#9B9A97]">
                            By continuing, you agree to our Terms of Service and
                            Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 text-center text-[10px] tracking-widest dark:text-[#9B9A97]">
                © {new Date().getFullYear()} Corriels. System v0
            </div>
        </div>
    )
}
