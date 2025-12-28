import { eventApi } from "matchina";

interface Action {
  name: string;
  displayName?: string;
  description?: string;
  params?: any[];
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  available: boolean;
}

/**
 * Hook that returns available actions for a machine
 * Lookless - just returns data, no UI components
 */
export function useAvailableActions(machine: any): Action[] {
  const state = machine.getState();
  const eventActions = eventApi(machine);
  
  // Get all available actions from the event API
  const availableActions = Object.keys(eventActions).filter(key => 
    key !== 'send' && 
    typeof (eventActions as any)[key] === 'function'
  );

  return availableActions.map(name => ({
    name,
    displayName: name.replace(/([A-Z])/g, ' $1').trim(),
    description: `Trigger ${name} action`,
    variant: 'secondary' as const,
    available: true
  }));
}

/**
 * Hook that returns common actions based on current state
 * More opinionated but still lookless - just returns action metadata
 */
export function useCommonActions(machine: any): Action[] {
  const state = machine.getState();
  const stateKey = state.key;
  
  // Define common action patterns based on state
  const getCommonActions = (): Action[] => {
    if (stateKey.includes('Cart')) {
      return [
        { name: 'proceed', displayName: 'Proceed', variant: 'primary' as const, available: true },
        { name: 'back', displayName: 'Back', variant: 'secondary' as const, available: true }
      ];
    }
    
    if (stateKey.includes('Payment')) {
      return [
        { name: 'authorize', displayName: 'Authorize Payment', variant: 'primary' as const, available: true },
        { name: 'authSucceeded', displayName: 'Approve', variant: 'success' as const, available: true },
        { name: 'authFailed', displayName: 'Deny', variant: 'danger' as const, available: true },
        { name: 'retry', displayName: 'Retry', variant: 'warning' as const, available: true },
        { name: 'back', displayName: 'Back', variant: 'secondary' as const, available: true }
      ];
    }
    
    if (stateKey.includes('Review')) {
      return [
        { name: 'submitOrder', displayName: 'Submit Order', variant: 'success' as const, available: true },
        { name: 'back', displayName: 'Back', variant: 'secondary' as const, available: true },
        { name: 'changePayment', displayName: 'Change Payment', variant: 'warning' as const, available: true }
      ];
    }
    
    return [
      { name: 'proceed', displayName: 'Proceed', variant: 'primary' as const, available: true },
      { name: 'back', displayName: 'Back', variant: 'secondary' as const, available: true }
    ];
  };

  return getCommonActions();
}

/**
 * Simple function to execute an action on a machine
 * Lookless utility function
 */
export function executeAction(machine: any, action: Action, params?: any[]) {
  const eventActions = eventApi(machine);
  const actionFn = (eventActions as any)[action.name];
  
  if (typeof actionFn === 'function' && action.available) {
    if (params && params.length > 0) {
      actionFn(...params);
    } else {
      actionFn();
    }
  }
}
