import React, { useState } from 'react';
import { useAssessmentStore } from '../../store/assessmentStore';
import { Technology, Proficiency, Relevance } from '../../types/assessment';
import { Button } from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { v4 as uuidv4 } from 'uuid';
import { TECHNOLOGY_SUGGESTIONS, PROFICIENCY_OPTIONS, RELEVANCE_OPTIONS } from '../../utils/constants';
import { Plus, Trash2, Search } from 'lucide-react';
import { cn } from '../../utils/helpers';

const TechnologyForm: React.FC = () => {
  const { formData, addTechnology, removeTechnology, updateTechnology } = useAssessmentStore();
  const technologies = formData.technologies || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState<Partial<Technology>>({
    id: uuidv4(),
    name: '',
    experience: 1,
    proficiency: Proficiency.INTERMEDIATE,
    lastUsed: new Date().toISOString().split('T')[0],
    relevance: Relevance.HIGH,
  });

  const filteredSuggestions = TECHNOLOGY_SUGGESTIONS.filter(tech =>
    tech.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTechnology = () => {
    if (!selectedTech.name) return;

    addTechnology(selectedTech as Technology);
    setSelectedTech({
      id: uuidv4(),
      name: '',
      experience: 1,
      proficiency: Proficiency.INTERMEDIATE,
      lastUsed: new Date().toISOString().split('T')[0],
      relevance: Relevance.HIGH,
    });
    setSearchTerm('');
  };

  const handleSuggestionClick = (tech: string) => {
    setSelectedTech(prev => ({ ...prev, name: tech }));
    setSearchTerm(tech);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Your Technology Stack</h2>
        <p className="mt-1 text-sm text-gray-600">
          Add the technologies you work with. This forms the basis of your risk assessment.
        </p>
      </div>

      {/* Add Technology Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Technology Name with Autocomplete */}
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Technology *
            </label>
            <div className="relative">
              <Input
                value={selectedTech.name}
                onChange={(e) => {
                  setSelectedTech(prev => ({ ...prev, name: e.target.value }));
                  setSearchTerm(e.target.value);
                }}
                placeholder="e.g., TypeScript, React, AWS"
                startIcon={<Search className="h-4 w-4 text-gray-400" />}
              />
              {searchTerm && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {filteredSuggestions.map((tech) => (
                    <div
                      key={tech}
                      className="cursor-pointer px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
                      onClick={() => handleSuggestionClick(tech)}
                    >
                      {tech}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Years of Experience *
            </label>
            <Input
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={selectedTech.experience}
              onChange={(e) =>
                setSelectedTech(prev => ({
                  ...prev,
                  experience: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="e.g., 3.5"
            />
          </div>

          {/* Proficiency */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Proficiency Level *
            </label>
            <Select
              value={selectedTech.proficiency}
              onChange={(e) =>
                setSelectedTech(prev => ({
                  ...prev,
                  proficiency: e.target.value as Proficiency,
                }))
              }
              options={PROFICIENCY_OPTIONS}
            />
          </div>

          {/* Relevance */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Market Relevance *
            </label>
            <Select
              value={selectedTech.relevance}
              onChange={(e) =>
                setSelectedTech(prev => ({
                  ...prev,
                  relevance: e.target.value as Relevance,
                }))
              }
              options={RELEVANCE_OPTIONS}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Last Used Date *
          </label>
          <Input
            type="date"
            value={selectedTech.lastUsed}
            onChange={(e) =>
              setSelectedTech(prev => ({ ...prev, lastUsed: e.target.value }))
            }
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="mt-6">
          <Button
            onClick={handleAddTechnology}
            disabled={!selectedTech.name}
            className="w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Technology
          </Button>
        </div>
      </div>

      {/* Technology List */}
      {technologies.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">
              Added Technologies ({technologies.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {technologies.map((tech, index) => (
              <div
                key={tech.id}
                className={cn(
                  'flex items-center justify-between px-6 py-4',
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {tech.name}
                      </h4>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {tech.experience} years
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {tech.proficiency}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            tech.relevance === 'high'
                              ? 'bg-green-100 text-green-800'
                              : tech.relevance === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          )}
                        >
                          {tech.relevance} demand
                        </span>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          Last used: {tech.lastUsed}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTechnology(tech.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {technologies.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 p-2">
              <Plus className="mx-auto h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              No technologies added
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by adding your primary technology skills above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnologyForm;