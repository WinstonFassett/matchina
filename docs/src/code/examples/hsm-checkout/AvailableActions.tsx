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

// Legacy styled component for backward compatibility (deprecated)
export function AvailableActions({ 
  machine, 
  actions: predefinedActions,
  title = "Available Actions",
  compact = false,
  showState = true
}: {
  machine: any;
  actions?: Action[];
  title?: string;
  compact?: boolean;
  showState?: boolean;
}) {
  const actions = predefinedActions || useAvailableActions(machine);
  
  const getButtonVariant = (variant?: string) => {
    switch (variant) {
      case 'primary': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'success': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'warning': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'danger': return 'bg-red-500 hover:bg-red-600 text-white';
      default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {actions.map((action) => (
          <button
            key={action.name}
            onClick={() => executeAction(machine, action)}
            className={`px-2 py-1 text-xs rounded ${getButtonVariant(action.variant)}`}
            title={action.description}
          >
            {action.displayName || action.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">{title}</h4>
        {showState && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {machine.getState().key}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {actions.map((action) => (
          <div key={action.name} className="space-y-1">
            <button
              onClick={() => executeAction(machine, action)}
              className={`w-full px-3 py-2 text-sm rounded ${getButtonVariant(action.variant)} transition-colors`}
            >
              {action.displayName || action.name}
            </button>
            {action.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                {action.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {actions.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No actions available in current state
        </p>
      )}
    </div>
  );
}

// Legacy component for backward compatibility
export function CommonActions({ machine }: { machine: any }) {
  const actions = useCommonActions(machine);
  
  return (
    <AvailableActions
      machine={machine}
      actions={actions}
      title="Common Actions"
      compact={false}
      showState={true}
    />
  );
}
