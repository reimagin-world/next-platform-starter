import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AssessmentRequest, AssessmentResponse, Technology, EducationLevel, CompanySize } from '../types/assessment';

interface AssessmentState {
  // Form Data
  formData: Partial<AssessmentRequest>;
  currentStep: number;

  // Results
  currentResult: AssessmentResponse | null;
  assessmentHistory: AssessmentResponse[];

  // UI State
  isLoading: boolean;
  error: string | null;
  validationErrors: Record<string, string[]>;

  // Actions
  updateFormData: (data: Partial<AssessmentRequest>) => void;
  addTechnology: (tech: Technology) => void;
  removeTechnology: (id: string) => void;
  updateTechnology: (id: string, updates: Partial<Technology>) => void;
  setCurrentStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setValidationErrors: (errors: Record<string, string[]>) => void;
  saveResult: (result: AssessmentResponse) => void;
  clearForm: () => void;
  clearResults: () => void;
}

const initialState = {
  formData: {
    technologies: [],
    careerContext: {
      currentRole: '',
      experienceYears: 0,
      industries: [],
      educationLevel: EducationLevel.BACHELORS,
      companySize: CompanySize.ENTERPRISE,
    },
    learningEvidence: {
      certifications: [],
      recentCourses: [],
      sideProjects: 0,
    },
    marketExposure: {
      industries: [],
      geographic: [],
      companyTypes: [],
    },
  },
  currentStep: 0,
  currentResult: null,
  assessmentHistory: [],
  isLoading: false,
  error: null,
  validationErrors: {},
};

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set) => ({
      ...initialState,

      updateFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      addTechnology: (tech) =>
        set((state) => ({
          formData: {
            ...state.formData,
            technologies: [...(state.formData.technologies || []), tech],
          },
        })),

      removeTechnology: (id) =>
        set((state) => ({
          formData: {
            ...state.formData,
            technologies: (state.formData.technologies || []).filter(t => t.id !== id),
          },
        })),

      updateTechnology: (id, updates) =>
        set((state) => ({
          formData: {
            ...state.formData,
            technologies: (state.formData.technologies || []).map(t =>
              t.id === id ? { ...t, ...updates } : t
            ),
          },
        })),

      setCurrentStep: (step) => set({ currentStep: step }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setValidationErrors: (errors) => set({ validationErrors: errors }),

      saveResult: (result) =>
        set((state) => ({
          currentResult: result,
          assessmentHistory: [result, ...state.assessmentHistory.slice(0, 9)], // Keep last 10
        })),

      clearForm: () =>
        set({
          formData: initialState.formData,
          currentStep: 0,
          validationErrors: {},
        }),

      clearResults: () =>
        set({
          currentResult: null,
          assessmentHistory: [],
        }),
    }),
    {
      name: 'assessment-storage',
      partialize: (state) => ({
        assessmentHistory: state.assessmentHistory,
      }),
    }
  )
);