import React from 'react';
import { cn } from '../../utils/helpers';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  name: string;
  description: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
}

const WizardStepper: React.FC<WizardStepperProps> = ({ steps, currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="overflow-hidden rounded-md border border-gray-200 bg-white md:flex md:rounded-none md:border-0 md:bg-transparent">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className="relative md:flex-1 md:flex">
            {stepIdx < currentStep ? (
              <a href="#" className="group flex w-full flex-col border-l-4 border-blue-600 py-2 pl-4 hover:bg-blue-50 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-blue-600 group-hover:text-blue-800">Step {step.id}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </a>
            ) : stepIdx === currentStep ? (
              <a href="#" className="flex w-full flex-col border-l-4 border-blue-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4" aria-current="step">
                <span className="text-sm font-medium text-blue-600">Step {step.id}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </a>
            ) : (
              <a href="#" className="group flex w-full flex-col border-l-4 border-gray-200 py-2 pl-4 hover:border-gray-300 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">Step {step.id}</span>
                <span className="text-sm font-medium">{step.name}</span>
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default WizardStepper;
