import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { ProjectData, Equipment } from '../types';
import { getOrCreatePreviewCode, captureUrlParams } from '../services/googleSheets';

// ── State ─────────────────────────────────────────────────────────────────────
interface PlannerState {
  data: ProjectData;
  currentStep: number;
  totalSteps: number;
}

// Seed the initial state with a stable preview code and any URL query params.
// This runs once per page load — no side-effects after mount.
function buildInitialData(): ProjectData {
  const urlData = captureUrlParams();
  return {
    codigoPrevia:       getOrCreatePreviewCode(),
    origem:             urlData.origem ?? 'space_planner',
    consentimentoLgpd:  true,
    // Pre-fill from URL params if present
    name:   urlData.nome     ?? undefined,
    phone:  urlData.telefone ?? undefined,
    email:  urlData.email    ?? undefined,
    city:   urlData.cidade   ?? undefined,
    uf:     urlData.uf       ?? undefined,
  };
}

const initialState: PlannerState = {
  data: buildInitialData(),
  currentStep: 1,
  totalSteps: 7,
};

// ── Actions ───────────────────────────────────────────────────────────────────
type Action =
  | { type: 'UPDATE_DATA'; payload: Partial<ProjectData> }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'ADD_EQUIPMENT'; payload: Equipment }
  | { type: 'REMOVE_EQUIPMENT'; payload: string }
  | { type: 'UPDATE_EQUIPMENT_QTY'; payload: { id: string; quantity: number } }
  | { type: 'MARK_SENT' }
  | { type: 'RESET' };

function reducer(state: PlannerState, action: Action): PlannerState {
  switch (action.type) {
    case 'UPDATE_DATA':
      return { ...state, data: { ...state.data, ...action.payload } };

    case 'SET_STEP':
      return { ...state, currentStep: Math.max(1, Math.min(action.payload, state.totalSteps)) };

    case 'NEXT_STEP':
      return { ...state, currentStep: Math.min(state.currentStep + 1, state.totalSteps) };

    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 1) };

    case 'ADD_EQUIPMENT': {
      const existing = state.data.selectedEquipment ?? [];
      const already = existing.find(e => e.id === action.payload.id);
      const updated = already
        ? existing.map(e => e.id === action.payload.id ? { ...e, quantity: e.quantity + 1 } : e)
        : [...existing, action.payload];
      return { ...state, data: { ...state.data, selectedEquipment: updated } };
    }

    case 'REMOVE_EQUIPMENT': {
      const updated = (state.data.selectedEquipment ?? []).filter(e => e.id !== action.payload);
      return { ...state, data: { ...state.data, selectedEquipment: updated } };
    }

    case 'UPDATE_EQUIPMENT_QTY': {
      const updated = (state.data.selectedEquipment ?? []).map(e =>
        e.id === action.payload.id ? { ...e, quantity: action.payload.quantity } : e
      );
      return { ...state, data: { ...state.data, selectedEquipment: updated } };
    }

    case 'MARK_SENT':
      return {
        ...state,
        data: {
          ...state.data,
          sentToConsultor: true,
          sentAt: new Date().toISOString(),
        },
      };

    case 'RESET':
      return { ...initialState, data: buildInitialData() };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
interface PlannerContextType {
  state: PlannerState;
  updateData: (payload: Partial<ProjectData>) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  addEquipment: (eq: Equipment) => void;
  removeEquipment: (id: string) => void;
  updateEquipmentQty: (id: string, quantity: number) => void;
  markSent: () => void;
  reset: () => void;
  progressPercent: number;
}

const PlannerContext = createContext<PlannerContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const updateData         = useCallback((payload: Partial<ProjectData>) => dispatch({ type: 'UPDATE_DATA', payload }), []);
  const setStep            = useCallback((step: number) => dispatch({ type: 'SET_STEP', payload: step }), []);
  const nextStep           = useCallback(() => dispatch({ type: 'NEXT_STEP' }), []);
  const prevStep           = useCallback(() => dispatch({ type: 'PREV_STEP' }), []);
  const addEquipment       = useCallback((eq: Equipment) => dispatch({ type: 'ADD_EQUIPMENT', payload: eq }), []);
  const removeEquipment    = useCallback((id: string) => dispatch({ type: 'REMOVE_EQUIPMENT', payload: id }), []);
  const updateEquipmentQty = useCallback((id: string, quantity: number) => dispatch({ type: 'UPDATE_EQUIPMENT_QTY', payload: { id, quantity } }), []);
  const markSent           = useCallback(() => dispatch({ type: 'MARK_SENT' }), []);
  const reset              = useCallback(() => dispatch({ type: 'RESET' }), []);

  const progressPercent = Math.round(((state.currentStep - 1) / state.totalSteps) * 100);

  return (
    <PlannerContext.Provider value={{
      state, updateData, setStep, nextStep, prevStep,
      addEquipment, removeEquipment, updateEquipmentQty,
      markSent, reset, progressPercent,
    }}>
      {children}
    </PlannerContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within <PlannerProvider>');
  return ctx;
}
