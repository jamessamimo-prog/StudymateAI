import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s =
    size === 'lg' ? 'w-12 h-12 text-xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  return (
    <div
      className={`${s} logo-mark rounded-xl flex items-center justify-center text-white font-extrabold shadow-lg shadow-blue-900/30 relative overflow-hidden`}
    >
      <span className="relative z-10">SM</span>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,.15) 4px, rgba(255,255,255,.15) 8px)',
        }}
      />
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'outline' | 'outlineDark' | 'ghost' | 'danger' | 'soft';

export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'lg';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/20 font-semibold',
    secondary: 'bg-brand-900 text-white hover:bg-brand-950 font-semibold',
    outline: 'border-2 border-brand-200 text-brand-800 bg-white hover:bg-brand-50 font-semibold',
    outlineDark:
      'border-2 border-white text-white bg-white/15 font-semibold hover:bg-white/25 hover:font-extrabold',
    ghost: 'text-slate-600 hover:bg-slate-100 font-semibold',
    danger: 'bg-red-600 text-white hover:bg-red-700 font-semibold',
    soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 font-semibold',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Input({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <input
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
        {...props}
      />
    </div>
  );
}

export function Textarea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm min-h-[100px]"
        {...props}
      />
    </div>
  );
}

export function Badge({
  children,
  color = 'blue',
}: {
  children: ReactNode;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'slate';
}) {
  const map = {
    blue: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[color]}`}>
      {children}
    </span>
  );
  }
