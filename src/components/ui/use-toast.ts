import type { ToastProps } from '@radix-ui/react-toast';
import * as React from 'react';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000;

type ToastRecord = (ToastProps & {
	id: string;
	title?: React.ReactNode;
	description?: React.ReactNode;
	action?: React.ReactNode;
	variant?: 'default' | 'destructive';
}) & {
	dismiss?: () => void;
	update?: (props: Partial<ToastRecord>) => void;
};

type State = {
	toasts: ToastRecord[];
};

type Action =
	| { type: 'ADD_TOAST'; toast: ToastRecord }
	| { type: 'UPDATE_TOAST'; toast: Partial<ToastRecord> & Pick<ToastRecord, 'id'> }
	| { type: 'DISMISS_TOAST'; toastId?: string }
	| { type: 'REMOVE_TOAST'; toastId?: string };

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

let currentState: State = { toasts: [] };

const listeners = new Set<(state: State) => void>();

const addToRemoveQueue = (toastId: string): void => {
	if (toastTimeouts.has(toastId)) {
		return;
	}

	const timeout = setTimeout(() => {
		toastTimeouts.delete(toastId);
		dispatch({ type: 'REMOVE_TOAST', toastId });
	}, TOAST_REMOVE_DELAY);

	toastTimeouts.set(toastId, timeout);
};

const dispatch = (action: Action): void => {
	currentState = reducer(currentState, action);
	listeners.forEach((listener) => listener(currentState));
};

const reducer = (state: State, action: Action): State => {
	switch (action.type) {
		case 'ADD_TOAST':
			return {
				...state,
				toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
			};
		case 'UPDATE_TOAST':
			return {
				...state,
				toasts: state.toasts.map((toast) =>
					toast.id === action.toast.id ? { ...toast, ...action.toast } : toast,
				),
			};
		case 'DISMISS_TOAST': {
			const { toastId } = action;

			if (toastId) {
				addToRemoveQueue(toastId);
			} else {
				state.toasts.forEach((toast) => addToRemoveQueue(toast.id));
			}

			return {
				...state,
				toasts: state.toasts.map((toast) =>
					toast.id === toastId ? { ...toast, open: false } : toast,
				),
			};
		}
		case 'REMOVE_TOAST':
			return {
				...state,
				toasts: action.toastId
					? state.toasts.filter((toast) => toast.id !== action.toastId)
					: [],
			};
		default:
			return state;
	}
};

const listenersSubscribe = (listener: (state: State) => void): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const genId = (): string => Math.random().toString(36).slice(2, 9);

export const toast = (props: Omit<ToastRecord, 'id'>): { id: string } => {
	const id = genId();

	const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });
	const update = (updatedProps: Partial<ToastRecord>) =>
		dispatch({ type: 'UPDATE_TOAST', toast: { ...updatedProps, id } });

	dispatch({
		type: 'ADD_TOAST',
		toast: {
			id,
			...props,
			open: true,
			dismiss,
			update,
		},
	});

	const duration = props.duration ?? 5000;
	if (duration !== Infinity) {
		setTimeout(() => dismiss(), duration);
	}

	return { id };
};

export function useToast(): { toast: typeof toast; toasts: ToastRecord[] } {
	const [state, setState] = React.useState<State>(currentState);

	React.useEffect(() => listenersSubscribe(setState), []);

	return {
		toasts: state.toasts,
		toast,
	};
}
