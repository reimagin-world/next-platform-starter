import React from 'react';
import { useAssessmentStore } from '../../store/assessmentStore';
import Input from '../common/Input';

const LearningEvidenceForm: React.FC = () => {
  const { formData, updateFormData } = useAssessmentStore();
  const learningEvidence = formData.learningEvidence || {
    certifications: [],
    recentCourses: [],
    sideProjects: 0
  };

  const handleUpdate = (field: string, value: number) => {
    updateFormData({
      learningEvidence: {
        ...learningEvidence,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">Learning Evidence</h2>
      <div>
         <label className="block text-sm font-medium text-gray-700">Side Projects Count</label>
         <Input
           type="number"
           value={learningEvidence.sideProjects}
           onChange={(e) => handleUpdate('sideProjects', Number(e.target.value))}
         />
      </div>
      <div>
          <p className="text-sm text-gray-500">
              Note: Certification and Course entry is simplified for this demo.
          </p>
      </div>
    </div>
  );
};

export default LearningEvidenceForm;
