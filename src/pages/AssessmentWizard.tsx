import React, { useState } from 'react';
import { useAssessmentStore } from '../store/assessmentStore';
import { useAssessment } from '../hooks/useAssessment';
import { Button } from '../components/common/Button';
import TechnologyForm from '../components/assessment/TechnologyForm';
import CareerContextForm from '../components/assessment/CareerContextForm';
import LearningEvidenceForm from '../components/assessment/LearningEvidenceForm';
import MarketExposureForm from '../components/assessment/MarketExposureForm';
import WizardStepper from '../components/layout/WizardStepper';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AssessmentWizard: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, setCurrentStep, formData } = useAssessmentStore();
  const { submitAssessment, isLoading } = useAssessment();
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 1, name: 'Technologies', description: 'Add your technology stack' },
    { id: 2, name: 'Career Context', description: 'Your background and experience' },
    { id: 3, name: 'Learning Evidence', description: 'Certifications and courses' },
    { id: 4, name: 'Market Exposure', description: 'Industry and geographic exposure' },
    { id: 5, name: 'Review & Calculate', description: 'Final review and calculation' },
  ];

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0:
        return (formData.technologies?.length || 0) > 0;
      case 1:
        return !!formData.careerContext?.currentRole;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      setError('Please complete all required fields before proceeding');
      return;
    }
    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const result = await submitAssessment();
      if (result.success) {
        navigate('/results');
      } else {
        setError(result.error || 'Calculation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <TechnologyForm />;
      case 1:
        return <CareerContextForm />;
      case 2:
        return <LearningEvidenceForm />;
      case 3:
        return <MarketExposureForm />;
      case 4:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">Review Your Input</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Technologies</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.technologies?.map((tech) => (
                      <span
                        key={tech.id}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {tech.name} ({tech.experience} years)
                      </span>
                    ))}
                  </div>
                </div>
                {formData.careerContext && (
                  <div>
                    <h4 className="font-medium text-gray-900">Career Context</h4>
                    <p className="mt-1 text-gray-600">
                      {formData.careerContext.currentRole} with{' '}
                      {formData.careerContext.experienceYears} years experience
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Career Risk Assessment
          </h1>
          <p className="mt-2 text-gray-600">
            Complete this assessment to understand your career risk and get personalized recommendations
          </p>
        </div>

        <WizardStepper steps={steps} currentStep={currentStep} />

        <div className="mt-8">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4">
              <div className="flex items-center">
                <div className="text-red-800">{error}</div>
              </div>
            </div>
          )}

          {renderStep()}

          <div className="mt-8 flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={isLoading}>
                {isLoading ? 'Calculating...' : 'Calculate Risk Score'}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentWizard;