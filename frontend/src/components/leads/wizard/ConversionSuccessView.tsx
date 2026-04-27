import { useNavigate } from 'react-router-dom';
import { ConversionResult } from '../../../types/leadConversion.types';

interface Props {
  result: ConversionResult;
  leadName: string;
}

export default function ConversionSuccessView({ result, leadName }: Props) {
  const navigate = useNavigate();

  return (
    <div className="text-center py-4">
      {/* Icon */}
      <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-slate-900 mb-1">Lead Converted!</h3>
      <p className="text-sm text-slate-500 mb-6">
        <span className="font-medium text-slate-700">{leadName}</span> has been converted
        successfully.
      </p>

      {/* Created records */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
        <button
          onClick={() => navigate(`/clients/${result.client.id}`)}
          className="p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left group"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Client</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">{result.client.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{result.client.case_reference}</p>
        </button>

        <button
          onClick={() => navigate(`/applicants/${result.applicant.id}`)}
          className="p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left group"
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Applicant</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">{result.applicant.full_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">Primary applicant</p>
        </button>

        {result.opportunity ? (
          <button
            onClick={() => navigate(`/opportunities`)}
            className="p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left group"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Opportunity</p>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">{result.opportunity.name}</p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{result.opportunity.stage}</p>
          </button>
        ) : (
          <div className="p-4 rounded-lg border-2 border-dashed border-slate-200 text-center flex items-center justify-center">
            <p className="text-xs text-slate-400">No opportunity created</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate(`/clients/${result.client.id}`)}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors"
        >
          Open Client Record
        </button>
        <button
          onClick={() => navigate('/leads')}
          className="px-5 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-50 transition-colors"
        >
          Back to Leads
        </button>
      </div>
    </div>
  );
}
