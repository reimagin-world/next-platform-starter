import { useMutation, useQuery } from '@tanstack/react-query';
import { useAssessmentStore } from '../store/assessmentStore';
import { assessmentService, marketService } from '../api';
import { AssessmentRequest, AssessmentResponse } from '../types/assessment';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/appConfig';

export const useAssessment = () => {
  const { setLoading, setError, saveResult, formData } = useAssessmentStore();

  const calculateMutation = useMutation({
    mutationFn: (payload: AssessmentRequest) => assessmentService.calculateRisk(payload),
    onMutate: () => {
      setLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      saveResult(data);
      setLoading(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
    },
  });

  const validateMutation = useMutation({
    mutationFn: (payload: Partial<AssessmentRequest>) => assessmentService.validateInput(payload),
  });

  const submitAssessment = () => {
    const payload: AssessmentRequest = {
      userId: formData.userId || `${config.app.defaultUserIdPrefix}${uuidv4().slice(0, 8)}`,
      technologies: formData.technologies || [],
      ...(formData.careerContext && { careerContext: formData.careerContext }),
      ...(formData.learningEvidence && { learningEvidence: formData.learningEvidence }),
      ...(formData.marketExposure && { marketExposure: formData.marketExposure }),
    };

    return calculateMutation.mutateAsync(payload);
  };

  return {
    submitAssessment,
    validateInput: validateMutation.mutateAsync,
    isLoading: calculateMutation.isPending,
    error: calculateMutation.error,
    data: calculateMutation.data,
  };
};