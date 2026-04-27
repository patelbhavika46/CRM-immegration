interface Step {
  number: number;
  label: string;
}

const STEPS: Step[] = [
  { number: 1, label: 'Contact' },
  { number: 2, label: 'Applicant' },
  { number: 3, label: 'Opportunity' },
];

interface Props {
  current: number;
  completed: number[];
}

export default function WizardStepper({ current, completed }: Props) {
  return (
    <nav aria-label="Conversion steps" className="mb-8">
      <ol className="flex items-center">
        {STEPS.map((step, idx) => {
          const isDone   = completed.includes(step.number);
          const isActive = step.number === current;
          const isLast   = idx === STEPS.length - 1;

          return (
            <li key={step.number} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2
                    transition-all duration-200
                    ${isDone
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : isActive
                        ? 'bg-white border-indigo-600 text-indigo-600'
                        : 'bg-white border-slate-300 text-slate-400'
                    }
                  `}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`mt-1 text-xs font-medium ${isActive ? 'text-indigo-600' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-3 mb-4 transition-colors duration-200 ${isDone ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
