export interface InputFormProps {
    label: string;
    placeholder: string;
    value?: string;
    type?: string;
    large?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    className?: string;
}

export function InputForm({ label, placeholder, value, type, large, onChange, className }: InputFormProps) {
    return (
        <div className={`flex flex-col gap-1.5 pl-12 text-sm font-medium text-[#07553B] font-sans ${className}`}>
            <label className="text-[#07553B] font-semibold text-sm" htmlFor={label}>{label}</label>
            {large ? (
                <textarea
                    id={label}
                    className={`bg-white py-3 px-4 border border-zinc-300 placeholder:text-zinc-500 text-zinc-900 shadow-xs rounded-lg focus:ring-4 focus:ring-[#CED46A]/50 focus:outline-none h-28 align-text-top transition-all duration-200 ease-in-out hover:shadow-lg hover:border-[#CED46A] font-sans`}
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={onChange}
                    aria-label={label}
                />
            ) : (
                <input
                    id={label}
                    className={`bg-white py-3 px-4 border border-zinc-300 placeholder:text-zinc-500 text-zinc-900 shadow-xs rounded-lg focus:ring-4 focus:ring-[#CED46A]/50 focus:outline-none transition-all duration-200 ease-in-out hover:shadow-lg hover:border-[#CED46A] font-sans`}
                    type={type}
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={onChange}
                    aria-label={label}
                />
            )}
        </div>
    );
}