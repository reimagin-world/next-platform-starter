import * as yup from 'yup';
import config from '../config/appConfig';

export const technologySchema = yup.object().shape({
  name: yup.string().required('Technology name is required').min(2, 'Technology name must be at least 2 characters'),
  experience: yup
    .number()
    .required('Experience is required')
    .min(0, 'Experience cannot be negative')
    .max(config.validation.maxExperienceYears, `Experience cannot exceed ${config.validation.maxExperienceYears} years`),
  proficiency: yup
    .string()
    .required('Proficiency level is required')
    .oneOf(['beginner', 'intermediate', 'advanced', 'expert'], 'Invalid proficiency level'),
  lastUsed: yup
    .string()
    .required('Last used date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  relevance: yup
    .string()
    .required('Relevance is required')
    .oneOf(['low', 'medium', 'high'], 'Invalid relevance value'),
});

export const assessmentSchema = yup.object().shape({
  userId: yup.string().required('User ID is required'),
  technologies: yup
    .array()
    .of(technologySchema)
    .required('At least one technology is required')
    .min(config.validation.minTechnologies, `At least ${config.validation.minTechnologies} technology is required`)
    .max(config.validation.maxTechnologies, `Maximum ${config.validation.maxTechnologies} technologies allowed`),
  careerContext: yup.object().shape({
    currentRole: yup.string().optional(),
    experienceYears: yup.number().min(0).max(50).optional(),
    industries: yup.array().of(yup.string()).optional(),
    educationLevel: yup.string().oneOf(['highschool', 'bachelors', 'masters', 'phd']).optional(),
    companySize: yup.string().oneOf(['startup', 'sme', 'enterprise', 'faang']).optional(),
  }).optional(),
  learningEvidence: yup.object().shape({
    certifications: yup.array().of(yup.string()).optional(),
    recentCourses: yup.array().of(yup.string()).optional(),
    sideProjects: yup.number().min(0).max(20).optional(),
  }).optional(),
  marketExposure: yup.object().shape({
    industries: yup.array().of(yup.string()).optional(),
    geographic: yup.array().of(yup.string()).optional(),
    companyTypes: yup.array().of(yup.string()).optional(),
  }).optional(),
});