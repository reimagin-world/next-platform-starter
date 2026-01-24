import { AssessmentRequest, ValidationResponse } from '../types/assessment';

export const validationService = {
  validate: (data: Partial<AssessmentRequest>): ValidationResponse => {
    // Placeholder validation logic
    const errors: string[] = [];
    if (!data) {
        errors.push("No data provided");
    }
    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
};
