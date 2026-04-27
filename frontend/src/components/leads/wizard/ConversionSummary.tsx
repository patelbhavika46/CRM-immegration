import { Step1ClientValues, Step2ApplicantValues, Step3OpportunityValues } from '../../../types/leadConversion.types';

interface Props {
  step1: Step1ClientValues;
  step2: Step2ApplicantValues;
  step3: Step3OpportunityValues;
}

const Row = ({ label, value }: { label: string; value?: string | number | null }) =>
  value ? (
    <div className="flex justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right max-w-[60%]">{value}</span>
    </div>
  ) : null;

const SERVICE_LABELS: Record<string, string> = {
  pr_application: 'PR Application', work_permit: 'Work Permit', study_permit: 'Study Permit',
  visitor_visa: 'Visitor Visa', family_sponsorship: 'Family Sponsorship', citizenship: 'Citizenship',
  visa_extension: 'Visa Extension', refugee_claim: 'Refugee Claim', other: 'Other',
};

const VISA_LABELS: Record<string, string> = {
  express_entry_pr: 'PR – Express Entry', provincial_nominee: 'Provincial Nominee',
  work_permit: 'Work Permit', study_permit: 'Study Permit', visitor_visa: 'Visitor Visa',
  dependent: 'Dependent', citizenship: 'Citizenship', other: 'Other',
};

export default function ConversionSummary({ step1, step2, step3 }: Props) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Review the details below before completing the conversion.
      </p>

      {/* Contact */}
      <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Contact
        </h4>
        <Row label="Name"                value={step1.name} />
        <Row label="Type"                value={step1.type.charAt(0).toUpperCase() + step1.type.slice(1)} />
        <Row label="Service"             value={SERVICE_LABELS[step1.service_type]} />
        <Row label="Destination Country" value={step1.country_of_destination} />
        {step1.notes && <Row label="Notes" value={step1.notes} />}
      </section>

      {/* Applicant */}
      <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Primary Applicant
        </h4>
        <Row label="Name"            value={`${step2.first_name} ${step2.last_name}`} />
        <Row label="Email"           value={step2.email} />
        <Row label="Phone"           value={step2.phone} />
        <Row label="Nationality"     value={step2.nationality} />
        <Row label="Passport"        value={step2.passport_number} />
        <Row label="Passport Expiry" value={step2.passport_expiry} />
        <Row label="Visa Type"       value={step2.visa_type ? VISA_LABELS[step2.visa_type] : undefined} />
        <Row label="Application ID"  value={step2.application_id} />
      </section>

      {/* Opportunity */}
      {step3.create_opportunity ? (
        <section className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">
            Opportunity (will be created)
          </h4>
          <Row label="Name"       value={step3.name} />
          <Row label="Amount"     value={step3.amount ? `${step3.currency} ${Number(step3.amount).toLocaleString()}` : undefined} />
          <Row label="Close Date" value={step3.close_date} />
        </section>
      ) : (
        <div className="rounded-lg p-4 border border-dashed border-slate-300 text-sm text-slate-400 text-center">
          No opportunity will be created
        </div>
      )}
    </div>
  );
}
