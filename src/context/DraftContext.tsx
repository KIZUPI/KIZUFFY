import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { ThemeKey } from '../types';
import { TEMPLATES } from '../lib/utils';

interface Draft {
  title: string;
  recipient: string;
  sender: string;
  body: string;
  theme: ThemeKey;
}

type DraftAction =
  | { type: 'SET_FIELD'; field: keyof Draft; value: string }
  | { type: 'SET_ALL'; draft: Draft }
  | { type: 'APPLY_TEMPLATE'; index: number }
  | { type: 'RESET' };

const initialDraft: Draft = {
  title: '',
  recipient: '',
  sender: '',
  body: '',
  theme: 'romantic',
};

function draftReducer(state: Draft, action: DraftAction): Draft {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ALL':
      return { ...action.draft };
    case 'APPLY_TEMPLATE': {
      const tpl = TEMPLATES[action.index];
      if (!tpl) return state;
      return {
        title: tpl.title,
        recipient: tpl.recipient,
        sender: tpl.sender,
        body: tpl.body,
        theme: tpl.theme,
      };
    }
    case 'RESET':
      return initialDraft;
  }
}

interface DraftContextValue {
  draft: Draft;
  updateField: (field: keyof Draft, value: string) => void;
  setDraft: (draft: Draft) => void;
  applyTemplate: (index: number) => void;
  resetDraft: () => void;
}

const DraftContext = createContext<DraftContextValue>({
  draft: initialDraft,
  updateField: () => {},
  setDraft: () => {},
  applyTemplate: () => {},
  resetDraft: () => {},
});

export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, dispatch] = useReducer(draftReducer, initialDraft);

  const updateField = useCallback((field: keyof Draft, value: string) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const setDraft = useCallback((draft: Draft) => {
    dispatch({ type: 'SET_ALL', draft });
  }, []);

  const applyTemplate = useCallback((index: number) => {
    dispatch({ type: 'APPLY_TEMPLATE', index });
  }, []);

  const resetDraft = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return React.createElement(DraftContext.Provider, {
    value: { draft, updateField, setDraft, applyTemplate, resetDraft }
  }, children);
}

export function useDraft() {
  return useContext(DraftContext);
}
