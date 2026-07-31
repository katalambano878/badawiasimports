'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/app-client';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { usePageTitle } from '@/hooks/usePageTitle';
import ScrollReveal from '@/components/ScrollReveal';
import { HERO_IMAGES_OTHER_PAGES } from '@/lib/hero-images';

type FormErrors = {
  email?: string;
  password?: string;
};

function getFriendlyLoginError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your details and try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Your email is not verified yet. Please confirm your email before signing in.';
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.';
  }
  return message;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFDFD]" />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  usePageTitle('Login');

  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerified = searchParams?.get('verified') === '1';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const { getToken, verifying } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError('');
    setIsLoading(true);

    const newErrors: FormErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    const isHuman = await getToken('login');
    if (!isHuman) {
      setAuthError('Security verification failed. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.session) {
        router.push('/account');
        router.refresh();
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to sign in. Please check your credentials.';
      setAuthError(getFriendlyLoginError(message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      <section className="relative overflow-hidden bg-[#060E28] text-white">
        <div className="absolute inset-0 opacity-30">
          <img
            src={HERO_IMAGES_OTHER_PAGES[5]}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top_left,_#CC1414_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_right,_#1ABCDF_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        <div className="absolute -top-40 -left-20 h-[420px] w-[420px] rounded-full bg-[#CC1414]/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-20 h-[420px] w-[420px] rounded-full bg-[#1ABCDF]/10 blur-3xl animate-pulse" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-14 md:pt-24 md:pb-20">
          <nav className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/50">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <i className="ri-arrow-right-s-line" />
            <span className="text-[#1ABCDF]">Account</span>
            <i className="ri-arrow-right-s-line" />
            <span className="text-white">Login</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-12 bg-[#CC1414]" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#CC1414]">
                  Secure Access
                </span>
              </div>
              <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                Welcome{' '}
                <span className="italic font-light bg-gradient-to-r from-white to-[#1ABCDF] bg-clip-text text-transparent">
                  Back.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base font-light text-white/60 md:text-lg">
                Sign in to access your orders, wishlist, saved addresses, and a faster checkout experience.
              </p>

            </div>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <ScrollReveal direction="up">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_20px_50px_-30px_rgba(13,27,69,0.25)]">
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#1ABCDF]">
                    Sign in
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-bold text-primary">Your account portal</h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Use the email and password associated with your account.
                  </p>
                </div>

                {isVerified && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <i className="ri-checkbox-circle-fill mt-0.5 text-base" />
                    <p>Your email was verified successfully. You can now sign in.</p>
                  </div>
                )}

                {authError && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <i className="ri-error-warning-fill mt-0.5 text-base" />
                    <p>{authError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.25em] text-gray-500" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <i className="ri-mail-line pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full rounded-2xl border bg-[#F7F8FC] py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary/15 ${
                          errors.email
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-200 focus:border-primary'
                        }`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-[0.25em] text-gray-500" htmlFor="password">
                        Password
                      </label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-[11px] font-black uppercase tracking-widest text-primary transition-colors hover:text-[#1ABCDF]"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <i className="ri-lock-password-line pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full rounded-2xl border bg-[#F7F8FC] py-3 pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary/15 ${
                          errors.password
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-200 focus:border-primary'
                        }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rememberMe: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>Remember me on this device</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || verifying}
                    className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#1ABCDF] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoading || verifying ? (
                      <>
                        <i className="ri-loader-4-line animate-spin text-base" />
                        <span>{verifying ? 'Verifying...' : 'Signing in...'}</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In Securely</span>
                        <i className="ri-arrow-right-line text-base transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8">
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-gray-400">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      <i className="ri-google-fill text-lg text-red-500" />
                      <span>Google</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      <i className="ri-facebook-fill text-lg text-blue-600" />
                      <span>Facebook</span>
                    </button>
                  </div>

                  <p className="mt-6 text-center text-sm text-gray-500">
                    Don&apos;t have an account?{' '}
                    <Link
                      href="/auth/signup"
                      className="font-semibold text-primary transition-colors hover:text-[#1ABCDF]"
                    >
                      Create one now
                    </Link>
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up">
              <div className="sticky top-28 flex flex-col gap-5">
                <div className="rounded-3xl border border-gray-100 bg-[#F7F8FC] p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1ABCDF]/10 text-[#1ABCDF]">
                      <i className="ri-shield-check-line text-xl" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Security</p>
                      <p className="font-serif text-lg font-bold text-primary">Protected login</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">
                    We use secure authentication, encrypted traffic, and bot protection to keep your account safe.
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">Account Benefits</p>
                  <h3 className="mt-1 font-serif text-xl font-bold text-primary">Why sign in?</h3>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    <Benefit icon="ri-truck-line" text="Track orders and delivery progress." />
                    <Benefit icon="ri-heart-3-line" text="Sync wishlist items across sessions." />
                    <Benefit icon="ri-map-pin-user-line" text="Save addresses for faster checkout." />
                  </ul>
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#060E28] p-6 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">Need help?</p>
                  <h3 className="mt-1 font-serif text-xl font-bold">Can’t access your account?</h3>
                  <p className="mt-3 text-sm text-white/75">
                    Use password reset or speak with our support team for quick account recovery.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/auth/forgot-password"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:bg-[#1ABCDF] hover:text-white"
                    >
                      Reset Password
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:border-white/60 hover:bg-white/10"
                    >
                      Contact Support
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </main>
  );
}

function Benefit({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <i className={icon} />
      </span>
      <span className="leading-snug">{text}</span>
    </li>
  );
}
