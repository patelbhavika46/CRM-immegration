import { useState } from 'react';
import { Lead } from '../../../types/lead.types';
import {
  Step1ClientValues,
  Step2ApplicantValues,
  Step3OpportunityValues,
  ConversionResult,
  ConvertLeadPayload,
} from '../../../types/leadConversion.types';
import { useLeadConversion } from '../../../hooks/useLeadConversion';
import WizardStepper from './WizardStepper';
import Step1ClientForm from './Step1ClientForm';
import Step2ApplicantForm from './Step2ApplicantForm';
import Step3OpportunityForm from './Step3OpportunityForm';
import ConversionSummary from './ConversionSummary';
import ConversionSuccessView from './ConversionSuccessView';

type WizardStep = 1 | 2 | 3;

interface WizardData {
  step1: Step1ClientValues | null;
  step2: Step2ApplicantValues | null;
  step3: Step3OpportunityValues | null;
}

interface Props {
  lead: Lead;
  onClose: () => void;
}

// Maps a step number to the form submit trigger id
const FORM_ID: Record<WizardStep, string> = {
  1: 'wizard-step-1',
  2: 'wizard-step-2',
  3: 'wizard-step-3',
};

export default function LeadConvertWizard({ lead, onClose }: Props) {
  const [step, setStep]         = useState<WizardStep>(1);
  const [completed, setCompleted] = useState<number[]>([]);
  const [data, setData]         = useState<WizardData>({ step1: null, step2: null, step3: null });
  const [result, setResult]     = useState<ConversionResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const conversion = useLeadConversion(lead.id);

  // ── Step completion handlers ──────────────────────────────────────────────

  const handleStep1Next = (values: Step1ClientValues) => {
    setData((d) => ({ ...d, step1: values }));
    markCompleted(1);
    setStep(2);
  };

  const handleStep2Next = (values: Step2ApplicantValues) => {
    setData((d) => ({ ...d, step2: values }));
    markCompleted(2);
    setStep(3);
  };

  const handleStep3Next = (values: Step3OpportunityValues) => {
    setData((d) => ({ ...d, step3: values }));
    markCompleted(3);
  };

  const markCompleted = (n: number) =>
    setCompleted((prev) => prev.includes(n) ? prev : [...prev, n]);

  // ── Final submit ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!data.step1 || !data.step2 || !data.step3) return;
    setApiError(null);

    const payload: ConvertLeadPayload = {
      client:    data.step1,
      applicant: data.step2,
      create_opportunity: data.step3.create_opportunity,
      opportunity: data.step3.create_opportunity
        ? {
            name:        data.step3.name,
            amount:      data.step3.amount !== '' ? Number(data.step3.amount) : undefined,
            currency:    data.step3.currency,
            close_date:  data.step3.close_date,
            description: data.step3.description,
          }
        : undefined,
    };

    try {
      const res = await conversion.mutateAsync(payload);
      setResult(res);
    } catch (err: any) {
      const msg =
        err?.response?.data?.errors
          ? Object.values(err.response.data.errors as Record<string, string[]>)
              .flat()
              .join(' ')
          : err?.response?.data?.message ?? 'Conversion failed. Please try again.';
      setApiError(msg);
    }
  };

  // Trigger the currently-visible form's submit button programmatically
  const triggerStepSubmit = () => {
    document.getElementById(FORM_ID[step])?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
  };

  const isReviewReady = completed.includes(3) && data.step1 && data.step2 && data.step3;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Convert Lead</h2>
            <p className="text-sm text-slate-500 mt-0.5">{lead.full_name}</p>
          </div>
          {!result && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {result ? (
            <ConversionSuccessView result={result} leadName={lead.full_name} />
          ) : (
            <>
              <WizardStepper current={step} completed={completed} />

              {/* API error banner */}
              {apiError && (
                <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                  {apiError}
                </div>
              )}

              {/* Steps */}
              {step === 1 && (
                <Step1ClientForm
                  lead={lead}
                  defaultValues={data.step1}
                  onNext={handleStep1Next}
                />
              )}
              {step === 2 && (
                <Step2ApplicantForm
                  lead={lead}
                  defaultValues={data.step2}
                  onNext={handleStep2Next}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <Step3OpportunityForm
                  client={data.step1!}
                  defaultValues={data.step3}
                  onNext={handleStep3Next}
                  onBack={() => setStep(2)}
                />
              )}

              {/* Summary — only after step 3 is completed */}
              {isReviewReady && (
                <div className="mt-6 pt-5 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Review Summary</h3>
                  <ConversionSummary
                    step1={data.step1!}
                    step2={data.step2!}
                    step3={data.step3!}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-2xl">
            <button
              onClick={step === 1 ? onClose : () => setStep((s) => (s - 1) as WizardStep)}
              disabled={conversion.isPending}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
            >
              {step === 1 ? 'Cancel' : '← Back'}
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Step {step} of 3</span>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={triggerStepSubmit}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Next →
                </button>
              ) : !isReviewReady ? (
                <button
                  type="button"
                  onClick={triggerStepSubmit}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Review →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={conversion.isPending}
                  className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {conversion.isPending && (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  {conversion.isPending ? 'Converting…' : 'Convert Lead'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
