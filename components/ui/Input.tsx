import { InputHTMLAttributes, forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  validateOnChange?: boolean;
  isValid?: boolean;
  showValidationIcon?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, validateOnChange, isValid, showValidationIcon, ...props }, ref) => {
    const [touched, setTouched] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    useEffect(() => {
      if (props.value !== undefined) {
        setHasValue(String(props.value).length > 0);
      }
    }, [props.value]);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      if (validateOnChange) {
        setTouched(true);
      }
      props.onChange?.(e);
    };

    const showError = touched && error;
    const showSuccess = touched && !error && hasValue && isValid !== false && showValidationIcon;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-2 border rounded-lg transition-all duration-200',
              'focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              showError 
                ? 'border-red-500 focus:ring-red-500' 
                : showSuccess
                ? 'border-green-500 focus:ring-green-500'
                : 'border-gray-300',
              showValidationIcon && 'pr-10',
              className
            )}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          {showValidationIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {showError && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {showSuccess && !showError && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
          )}
        </div>
        {showError && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
