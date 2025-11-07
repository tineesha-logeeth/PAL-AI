import React, { useState, useEffect } from 'react';
import { correctGrammar } from '../services/geminiService';
import { Loader2, Wand2 } from 'lucide-react';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

interface AutoCorrectingTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
    value: string;
    setValue: (value: string) => void;
    containerClassName?: string;
}

const AutoCorrectingTextarea: React.FC<AutoCorrectingTextareaProps> = ({ value, setValue, className, containerClassName, ...props }) => {
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isCorrecting, setIsCorrecting] = useState(false);
    const debouncedValue = useDebounce(value, 1000);

    useEffect(() => {
        const getCorrection = async () => {
            if (debouncedValue && debouncedValue.trim().length > 10) {
                setIsCorrecting(true);
                setSuggestion(null);
                try {
                    const correctedText = await correctGrammar(debouncedValue);
                    if (correctedText.trim() !== debouncedValue.trim() && correctedText.trim().length > 0) {
                        setSuggestion(correctedText);
                    }
                } catch (error) {
                    console.error("Grammar correction failed:", error);
                } finally {
                    setIsCorrecting(false);
                }
            } else {
                setSuggestion(null);
            }
        };
        getCorrection();
    }, [debouncedValue]);
    
    useEffect(() => {
        if (suggestion) setSuggestion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleApplySuggestion = () => {
        if (suggestion) {
            setValue(suggestion);
            setSuggestion(null);
        }
    };
    
    const showFooter = isCorrecting || suggestion;
    
    return (
        <div className={`relative w-full h-full flex flex-col ${containerClassName}`}>
            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={`${className} ${showFooter ? 'rounded-b-none' : ''}`}
                {...props}
            />
            {showFooter && (
                <div className="flex-shrink-0 p-2 bg-[var(--bg-input)] border-x border-b border-[var(--border-secondary)] rounded-b-lg text-xs">
                    {isCorrecting && (
                         <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Checking grammar...</span>
                        </div>
                    )}
                    {suggestion && !isCorrecting && (
                        <div className="flex items-center justify-between gap-2">
                             <p className="text-[var(--text-secondary)] overflow-hidden text-ellipsis whitespace-nowrap">
                                Suggestion: <span className="text-[var(--text-primary)] font-medium">{suggestion}</span>
                             </p>
                             <button 
                                onClick={handleApplySuggestion}
                                className="flex items-center gap-1.5 flex-shrink-0 font-semibold bg-[var(--accent-color-1)]/20 text-[var(--accent-text)] px-2 py-1 rounded-md hover:bg-[var(--accent-color-1)]/30 transition-colors"
                            >
                                <Wand2 className="w-3 h-3" />
                                Apply
                             </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AutoCorrectingTextarea;
