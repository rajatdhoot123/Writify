import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@root/components/ui/select';
import { Input } from '@root/components/ui/input';
import { Button } from '@root/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@root/components/ui/card';
import { Label } from '@root/components/ui/label';
import toast from 'react-hot-toast';
import useStore from '@root/src/lib/store';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@root/components/ui/dialog';
import { Textarea } from '@root/components/ui/textarea';
import slugify from 'slugify';
import { PROMPTS } from '@root/lib/prompt';

interface ModelConfig {
  type: 'gemini' | 'ollama' | '';
  host?: string;
  model?: string;
}

interface PromptFormData {
  label: string;
  description: string;
}

const AITweetSettings = () => {
  const [state, dispatch] = useStore();
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>AI Tweet Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4">
          {/* AI Mode Selection */}
          <div className="flex-1">
            <Label htmlFor="ai-mode">AI Mode</Label>
            <Select
              value={state.settings?.active_prompt || PROMPTS[0].value}
              onValueChange={(value) => dispatch({ 
                type: 'SET_ACTIVE_PROMPT', 
                payload: value
              })}
            >
              <SelectTrigger id="ai-mode">
                <SelectValue placeholder="Choose AI Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {state.promptList.map(prompt => (
                    <SelectItem key={prompt.value} value={prompt.value}>
                      {prompt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Tone Selection */}
          <div className="flex-1">
            <Label htmlFor="tweet-tone">Tweet Tone</Label>
            <Select
              value={state.settings?.tone || 'friendly'}
              onValueChange={(value) => dispatch({ 
                type: 'SET_TONE', 
                payload: value
              })}
            >
              <SelectTrigger id="tweet-tone">
                <SelectValue placeholder="Choose Tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="witty">Witty</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Options: React.FC = () => {
  const [state, dispatch] = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [promptFormData, setPromptFormData] = useState<PromptFormData>({
    label: '',
    description: '',
  });

  // Test Ollama connection
  const testOllamaConnection = async () => {
    if (!state.modelConfig?.host) {
      toast.error('Please enter Ollama host URL');
      return false;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${state.modelConfig.host}/api/tags`, {
        method: 'GET',
        credentials: 'include',
      });
      const { models } = await response.json();
      if (models) {
        dispatch({ 
          type: 'SET_OLLAMA_MODELS', 
          payload: models.map(m => ({ value: m.model, label: m.name }))
        });
        toast.success('Successfully connected to Ollama');
        return true;
      }
    } catch (err) {
      toast.error('Failed to connect to Ollama');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (value: string) => {
    dispatch({ 
      type: 'SET_MODEL_CONFIG', 
      payload: {
        type: value as ModelConfig['type'],
        host: '',
        model: '',
      }
    });
  };

  const handleHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ 
      type: 'SET_MODEL_CONFIG', 
      payload: {
        ...state.modelConfig,
        host: e.target.value
      }
    });
  };

  const handleModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ 
      type: 'SET_MODEL_CONFIG', 
      payload: {
        ...state.modelConfig,
        model: e.target.value
      }
    });
  };

  // Save configuration
  const saveConfig = async () => {
    if (!state.modelConfig?.type) {
      toast.error('Please select a model type');
      return;
    }

    if (state.modelConfig.type === 'ollama') {
      if (!state.modelConfig.host) {
        toast.error('Please enter Ollama host URL');
        return;
      }
      
      const isConnected = await testOllamaConnection();
      if (!isConnected) return;
    }

    try {
      setIsLoading(true);
      if (state.modelConfig.type === 'ollama') {
        chrome.runtime.sendMessage({
          action: 'INIT_OLLAMA',
          payload: {
            ollama_host: state.modelConfig.host,
            ai_model: state.modelConfig.model,
          },
        });
      }
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { label, description } = promptFormData;
    
    if (!label || !description) {
      toast.error('Please fill in all fields');
      return;
    }

    const promptData = {
      label,
      description,
      value: slugify(label),
    };

    if (editingPrompt) {
      dispatch({ type: 'UPDATE_PROMPT', payload: promptData });
      toast.success('Prompt updated successfully');
    } else {
      dispatch({ type: 'ADD_PROMPT', payload: promptData });
      toast.success('Prompt added successfully');
    }

    setPromptFormData({ label: '', description: '' });
    setEditingPrompt(null);
  };

  const handleEditPrompt = (prompt: any) => {
    setEditingPrompt(prompt.value);
    setPromptFormData({
      label: prompt.label,
      description: prompt.description,
    });
  };

  const handleDeletePrompt = (value: string) => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      dispatch({ type: 'DELETE_PROMPT', payload: value });
      toast.success('Prompt deleted successfully');
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Extension Settings</h1>
        <p className="text-lg text-gray-600">Configure your AI tweet preferences</p>
      </div>

      <AITweetSettings />

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Model Settings</h2>
        <p className="text-lg text-gray-600">Configure your preferred AI model</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="model-select">Select AI Model</Label>
              <Select
                value={state.modelConfig?.type || 'gemini'}
                onValueChange={handleModelChange}>
                <SelectTrigger id="model-select">
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="gemini">Google Gemini (Cloud)</SelectItem>
                    <SelectItem value="ollama">Ollama (Self-hosted)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {state.modelConfig?.type === 'ollama' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="host-url">Ollama Host URL</Label>
                  <Input
                    id="host-url"
                    type="text"
                    placeholder="http://localhost:11434"
                    value={state.modelConfig.host}
                    onChange={handleHostChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input
                    id="model-name"
                    type="text"
                    placeholder="e.g., llama2, mistral"
                    value={state.modelConfig.model}
                    onChange={handleModelNameChange}
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={testOllamaConnection}
                  className="w-full"
                  disabled={isLoading}>
                  {isLoading ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            )}

            <Button 
              onClick={saveConfig}
              className="w-full"
              disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Prompt Templates</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditingPrompt(null);
                  setPromptFormData({ label: '', description: '' });
                }}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Prompt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePromptSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-name">Prompt Name</Label>
                  <Input
                    id="prompt-name"
                    value={promptFormData.label}
                    onChange={(e) => setPromptFormData(prev => ({
                      ...prev,
                      label: e.target.value
                    }))}
                    placeholder="Enter prompt name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-description">Description</Label>
                  <Textarea
                    id="prompt-description"
                    value={promptFormData.description}
                    onChange={(e) => setPromptFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Enter prompt description"
                    rows={5}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingPrompt ? 'Update Prompt' : 'Add Prompt'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state.promptList.map((prompt) => (
              <div
                key={prompt.value}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{prompt.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {prompt.description}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPrompt(prompt)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Prompt</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handlePromptSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="prompt-name">Prompt Name</Label>
                          <Input
                            id="prompt-name"
                            value={promptFormData.label}
                            onChange={(e) => setPromptFormData(prev => ({
                              ...prev,
                              label: e.target.value
                            }))}
                            placeholder="Enter prompt name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prompt-description">Description</Label>
                          <Textarea
                            id="prompt-description"
                            value={promptFormData.description}
                            onChange={(e) => setPromptFormData(prev => ({
                              ...prev,
                              description: e.target.value
                            }))}
                            placeholder="Enter prompt description"
                            rows={5}
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Update Prompt
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePrompt(prompt.value)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Options;
