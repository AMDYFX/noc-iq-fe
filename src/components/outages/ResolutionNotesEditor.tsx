import React, { useState } from 'react';

export const RESOLUTION_TEMPLATE = [
  'Root Cause:',
  '',
  'Action Taken:',
  '',
  'Preventative Measures:',
  '',
].join('\n');

export const MIN_RESOLUTION_NOTE_LENGTH = 30;

export interface ParsedResolutionNotes {
  rootCause: string;
  actionTaken: string;
  preventativeMeasures: string;
  isComplete: boolean;
}

export function parseResolutionNotes(notes: string): ParsedResolutionNotes {
  const rootCauseMatch = notes.match(/Root Cause:\s*([\s\S]*?)(?=\n\s*Action Taken:|$)/i);
  const actionTakenMatch = notes.match(
    /Action Taken:\s*([\s\S]*?)(?=\n\s*Preventative Measures:|$)/i
  );
  const preventativeMeasuresMatch = notes.match(/Preventative Measures:\s*([\s\S]*)$/i);

  const rootCause = rootCauseMatch ? rootCauseMatch[1].trim() : '';
  const actionTaken = actionTakenMatch ? actionTakenMatch[1].trim() : '';
  const preventativeMeasures = preventativeMeasuresMatch
    ? preventativeMeasuresMatch[1].trim()
    : '';

  return {
    rootCause,
    actionTaken,
    preventativeMeasures,
    isComplete: Boolean(rootCause && actionTaken && preventativeMeasures),
  };
}

export function validateResolutionNotes(
  notes: string,
  minLength: number = MIN_RESOLUTION_NOTE_LENGTH
): string | null {
  const trimmed = notes.trim();
  if (trimmed.length < minLength) {
    return `Resolution notes must be at least ${minLength} characters (currently ${trimmed.length}).`;
  }
  return null;
}

interface ResolutionNotesEditorProps {
  initialValue?: string;
  minLength?: number;
  onSubmit: (notes: string, parsed: ParsedResolutionNotes) => void | Promise<void>;
  isSubmitting?: boolean;
}

export const ResolutionNotesEditor: React.FC<ResolutionNotesEditorProps> = ({
  initialValue = '',
  minLength = MIN_RESOLUTION_NOTE_LENGTH,
  onSubmit,
  isSubmitting = false,
}) => {
  const [notes, setNotes] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleInsertTemplate = () => {
    setError(null);
    setNotes((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return RESOLUTION_TEMPLATE;
      }
      if (
        trimmed.includes('Root Cause:') &&
        trimmed.includes('Action Taken:') &&
        trimmed.includes('Preventative Measures:')
      ) {
        return prev;
      }
      return `${trimmed}\n\n${RESOLUTION_TEMPLATE}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateResolutionNotes(notes, minLength);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const parsed = parseResolutionNotes(notes);
    await onSubmit(notes.trim(), parsed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="outage-resolution-notes"
          className="block text-sm font-medium text-gray-200"
        >
          Resolution Notes
        </label>
        <button
          type="button"
          onClick={handleInsertTemplate}
          className="rounded-md border border-gray-600 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-100 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Insert Resolution Template
        </button>
      </div>

      <textarea
        id="outage-resolution-notes"
        rows={8}
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          if (error) {
            setError(null);
          }
        }}
        placeholder="Document root cause, action taken, and preventative measures..."
        className="w-full rounded-md border border-gray-700 bg-gray-900 p-3 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Minimum {minLength} characters ({notes.trim().length}/{minLength})
        </span>
        {error && (
          <span role="alert" className="font-medium text-red-400">
            {error}
          </span>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Submit Resolution Notes'}
        </button>
      </div>
    </form>
  );
};

export default ResolutionNotesEditor;