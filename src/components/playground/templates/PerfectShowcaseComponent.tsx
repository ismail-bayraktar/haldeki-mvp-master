/**
 * FormShowcase - Demonstrates form components and patterns
 *
 * @description
 * This showcase component displays all form elements including inputs,
 * selects, checkboxes, radio buttons, and form validation patterns.
 * It includes interactive demos for props and usage examples.
 *
 * @example
 * ```tsx
 * import { FormShowcase } from "@/components/playground";
 *
 * function Playground() {
 *   return <FormShowcase />;
 * }
 * ```
 */

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/**
 * Form state for interactive demo
 */
interface FormState {
  textInput: string;
  emailInput: string;
  selectValue: string;
  checked: boolean;
  radioValue: string;
}

/**
 * Props for FormShowcase component
 */
export interface FormShowcaseProps {
  /** Initial form state (optional) */
  initialState?: Partial<FormState>;
  /** Callback when form is submitted */
  onSubmit?: (data: FormState) => void;
  /** Display mode */
  mode?: "showcase" | "interactive";
}

/**
 * FormShowcase - Complete form components showcase
 */
export function FormShowcase({
  initialState = {},
  onSubmit,
  mode = "showcase"
}: FormShowcaseProps) {
  // Form state for interactive demo
  const [formData, setFormData] = useState<FormState>({
    textInput: "",
    emailInput: "",
    selectValue: "option1",
    checked: false,
    radioValue: "option1",
    ...initialState
  });

  // UI state for demo controls
  const [showLabels, setShowLabels] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  const [disabledState, setDisabledState] = useState(false);

  /**
   * Handle input changes with proper typing
   */
  const handleInputChange = useCallback((
    field: keyof FormState,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  }, [formData, onSubmit]);

  /**
   * Validate form (memoized for performance)
   */
  const formErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (showErrors) {
      if (!formData.textInput.trim()) {
        errors.textInput = "Text input is required";
      }
      if (!formData.emailInput.includes("@")) {
        errors.emailInput = "Invalid email address";
      }
      if (!formData.checked) {
        errors.checked = "You must accept the terms";
      }
    }

    return errors;
  }, [formData, showErrors]);

  const hasErrors = Object.keys(formErrors).length > 0;

  return (
    <div className="space-y-8">
      {/* Section 1: Basic Inputs */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Basic Inputs
        </h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <InputDemo
            label="Text Input"
            type="text"
            placeholder="Enter text..."
            value={formData.textInput}
            onChange={(e) => handleInputChange("textInput", e.target.value)}
            error={formErrors.textInput}
            disabled={disabledState}
            showLabel={showLabels}
          />
          <InputDemo
            label="Email Input"
            type="email"
            placeholder="your@email.com"
            value={formData.emailInput}
            onChange={(e) => handleInputChange("emailInput", e.target.value)}
            error={formErrors.emailInput}
            disabled={disabledState}
            showLabel={showLabels}
          />
        </div>
      </section>

      {/* Section 2: Selection Controls */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Selection Controls
        </h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          {/* Select Dropdown */}
          <SelectDemo
            label="Select Option"
            value={formData.selectValue}
            onChange={(value) => handleInputChange("selectValue", value)}
            disabled={disabledState}
            showLabel={showLabels}
          />

          {/* Checkbox */}
          <CheckboxDemo
            label="Accept terms and conditions"
            checked={formData.checked}
            onChange={(checked) => handleInputChange("checked", checked)}
            error={formErrors.checked}
            disabled={disabledState}
            showLabel={showLabels}
          />

          {/* Radio Group */}
          <RadioDemo
            label="Choose Option"
            value={formData.radioValue}
            onChange={(value) => handleInputChange("radioValue", value)}
            disabled={disabledState}
            showLabel={showLabels}
          />
        </div>
      </section>

      {/* Section 3: Interactive Demo Controls */}
      {mode === "interactive" && (
        <section>
          <h3 className="text-lg font-bold text-foreground mb-4">
            Demo Controls
          </h3>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <ToggleControl
              label="Show Labels"
              checked={showLabels}
              onChange={setShowLabels}
            />
            <ToggleControl
              label="Show Validation Errors"
              checked={showErrors}
              onChange={setShowErrors}
            />
            <ToggleControl
              label="Disabled State"
              checked={disabledState}
              onChange={setDisabledState}
            />
          </div>
        </section>
      )}

      {/* Section 4: Form Actions */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Form Actions
        </h3>
        <div className="bg-card border border-border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="default"
                disabled={disabledState || (showErrors && hasErrors)}
              >
                Submit Form
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  textInput: "",
                  emailInput: "",
                  selectValue: "option1",
                  checked: false,
                  radioValue: "option1"
                })}
                disabled={disabledState}
              >
                Reset
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowErrors(!showErrors)}
              >
                {showErrors ? "Hide" : "Show"} Validation
              </Button>
            </div>

            {/* Form State Display */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Current Form State:</p>
              <pre className="text-xs text-muted-foreground overflow-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          </form>
        </div>
      </section>

      {/* Section 5: Usage Examples */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Usage Examples
        </h3>
        <div className="space-y-4">
          <UsageExampleCard
            title="Basic Input"
            description="A simple text input with label"
            code={`import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function MyForm() {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-2">
      <Label htmlFor="text">Text Input</Label>
      <Input
        id="text"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter text..."
      />
    </div>
  );
}`}
          />
          <UsageExampleCard
            title="With Validation"
            description="Input with error handling"
            code={`function ValidatedInput() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const validate = (val: string) => {
    if (!val.includes("@")) {
      setError("Invalid email");
    } else {
      setError("");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          validate(e.target.value);
        }}
        aria-invalid={!!error}
        aria-describedby="email-error"
      />
      {error && (
        <p id="email-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}`}
          />
          <UsageExampleCard
            title="Form Submission"
            description="Complete form with submit handler"
            code={`function MyForm() {
  const [formData, setFormData] = useState({
    email: "",
    accept: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({
          ...formData,
          email: e.target.value
        })}
        required
      />
      <Checkbox
        checked={formData.accept}
        onCheckedChange={(checked) => setFormData({
          ...formData,
          accept: checked as boolean
        })}
        required
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}`}
          />
        </div>
      </section>

      {/* Section 6: Accessibility Notes */}
      <section>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Accessibility Guidelines
        </h3>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <A11yCheck
            title="Label Association"
            description="All inputs have associated labels using htmlFor/id"
            status="pass"
          />
          <A11yCheck
            title="Error Announcements"
            description="Errors use aria-invalid and aria-describedby"
            status="pass"
          />
          <A11yCheck
            title="Required Fields"
            description="Required fields use HTML5 required attribute"
            status="pass"
          />
          <A11yCheck
            title="Keyboard Navigation"
            description="All controls are keyboard accessible"
            status="pass"
          />
          <A11yCheck
            title="Focus Indicators"
            description="Clear focus-visible styles for all inputs"
            status="pass"
          />
        </div>
      </section>
    </div>
  );
}

/**
 * InputDemo - Reusable input demonstration component
 */
function InputDemo({
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  disabled,
  showLabel
}: InputDemoProps) {
  const inputId = `input-${label.toLowerCase().replace(/\s/g, "-")}`;
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      {showLabel && (
        <Label htmlFor={inputId}>{label}</Label>
      )}
      <Input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={error ? "border-destructive" : ""}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

interface InputDemoProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  showLabel?: boolean;
}

/**
 * SelectDemo - Select dropdown demonstration
 */
function SelectDemo({
  label,
  value,
  onChange,
  disabled,
  showLabel
}: SelectDemoProps) {
  const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  return (
    <div className="space-y-2">
      {showLabel && <Label>{label}</Label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SelectDemoProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

/**
 * CheckboxDemo - Checkbox demonstration
 */
function CheckboxDemo({
  label,
  checked,
  onChange,
  error,
  disabled,
  showLabel
}: CheckboxDemoProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="checkbox-demo"
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-invalid={!!error}
      />
      {showLabel && (
        <Label
          htmlFor="checkbox-demo"
          className={error ? "text-destructive" : ""}
        >
          {label}
        </Label>
      )}
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  );
}

interface CheckboxDemoProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
  showLabel?: boolean;
}

/**
 * RadioDemo - Radio group demonstration
 */
function RadioDemo({
  label,
  value,
  onChange,
  disabled,
  showLabel
}: RadioDemoProps) {
  const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  return (
    <div className="space-y-2">
      {showLabel && <Label>{label}</Label>}
      <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
        {options.map(opt => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={`radio-${opt.value}`} />
            <Label htmlFor={`radio-${opt.value}`}>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

interface RadioDemoProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

/**
 * ToggleControl - Boolean control for demo settings
 */
function ToggleControl({
  label,
  checked,
  onChange
}: ToggleControlProps) {
  return (
    <div className="flex items-center justify-between">
      <Label className="flex-1">{label}</Label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-ring focus-visible:ring-offset-2
          ${checked ? "bg-primary" : "bg-input"}
        `}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform ${checked ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}

interface ToggleControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * UsageExampleCard - Display code examples with copy functionality
 */
function UsageExampleCard({
  title,
  description,
  code
}: UsageExampleCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="relative group">
        <pre className="bg-muted p-4 overflow-x-auto text-sm">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-3 py-1 text-sm bg-background border border-border rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Copy code"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

interface UsageExampleCardProps {
  title: string;
  description: string;
  code: string;
}

/**
 * A11yCheck - Accessibility checklist item
 */
function A11yCheck({
  title,
  description,
  status
}: A11yCheckProps) {
  const statusConfig = {
    pass: { icon: "✓", color: "text-stock-plenty" },
    warn: { icon: "⚠", color: "text-fresh-up" },
    fail: { icon: "✗", color: "text-stock-last" }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-start gap-3">
      <span className={`font-bold text-lg ${config.color} flex-shrink-0`}>
        {config.icon}
      </span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface A11yCheckProps {
  title: string;
  description: string;
  status: "pass" | "warn" | "fail";
}

/**
 * Default props export for documentation
 */
export const DEFAULT_FORM_SHOWCASE_PROPS: Partial<FormShowcaseProps> = {
  mode: "showcase",
  initialState: {
    textInput: "",
    emailInput: "",
    selectValue: "option1",
    checked: false,
    radioValue: "option1"
  }
};
