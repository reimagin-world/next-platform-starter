import React from 'react';
import { useAssessmentStore } from '../../store/assessmentStore';
import { EducationLevel, CompanySize } from '../../types/assessment';
import Input from '../common/Input';
import Select from '../common/Select';

const CareerContextForm: React.FC = () => {
  const { formData, updateFormData } = useAssessmentStore();
  const careerContext = formData.careerContext || {
    currentRole: '',
    experienceYears: 0,
    industries: [],
    educationLevel: EducationLevel.BACHELORS,
    companySize: CompanySize.ENTERPRISE
  };

  const handleChange = (field: string, value: any) => {
    updateFormData({
      careerContext: {
        ...careerContext,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">Career Context</h2>
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Role</label>
          <Input
            value={careerContext.currentRole}
            onChange={(e) => handleChange('currentRole', e.target.value)}
            placeholder="e.g. Senior Software Engineer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
          <Input
            type="number"
            value={careerContext.experienceYears}
            onChange={(e) => handleChange('experienceYears', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Education Level</label>
          <Select
            value={careerContext.educationLevel}
            onChange={(e) => handleChange('educationLevel', e.target.value)}
            options={Object.values(EducationLevel).map(v => ({ label: v, value: v }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Company Size</label>
          <Select
            value={careerContext.companySize}
            onChange={(e) => handleChange('companySize', e.target.value)}
            options={Object.values(CompanySize).map(v => ({ label: v, value: v }))}
          />
        </div>
      </div>
    </div>
  );
};

export default CareerContextForm;
