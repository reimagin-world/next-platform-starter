import { AssessmentRequest, AssessmentResponse, ValidationResponse } from '../types/assessment';
import { apiClient } from './client';

class AssessmentService {
  async calculateRisk(payload: AssessmentRequest): Promise<AssessmentResponse> {
    return apiClient.post<AssessmentResponse>('/calculate', payload);
  }

  async validateInput(payload: Partial<AssessmentRequest>): Promise<ValidationResponse> {
    return apiClient.post<ValidationResponse>('/validate', payload);
  }

  async getHealth(): Promise<{ status: string; timestamp: string; version: string }> {
    return apiClient.get('/health');
  }
}

export const assessmentService = new AssessmentService();
export default assessmentService;