import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import type {
	AuthError,
	Session,
	SignUpWithPasswordCredentials,
	User,
} from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AuthContextValue = {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signUp: (
		email: string,
		password: string,
		options?: SignUpWithPasswordCredentials['options'],
	) => Promise<{ error: AuthError | null }>;
	signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
	signOut: () => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
	children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const { toast } = useToast();

	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	const handleSession = useCallback((nextSession: Session | null) => {
		setSession(nextSession);
		setUser(nextSession?.user ?? null);
		setLoading(false);
	}, []);

	useEffect(() => {
		const loadSession = async () => {
			const {
				data: { session: currentSession },
			} = await supabase.auth.getSession();
			handleSession(currentSession);
		};

		loadSession();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, newSession) => {
			handleSession(newSession);
		});

		return () => subscription.unsubscribe();
	}, [handleSession]);

	const signUp = useCallback<
		AuthContextValue['signUp']
	>(async (email, password, options) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options,
		});

		if (error) {
			toast({
				variant: 'destructive',
				title: 'Sign up Failed',
				description: error.message || 'Something went wrong',
			});
		}

		return { error };
	}, [toast]);

	const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			toast({
				variant: 'destructive',
				title: 'Sign in Failed',
				description: error.message || 'Something went wrong',
			});
		}

		return { error };
	}, [toast]);

	const signOut = useCallback<AuthContextValue['signOut']>(async () => {
		const { error } = await supabase.auth.signOut();

		if (error) {
			toast({
				variant: 'destructive',
				title: 'Sign out Failed',
				description: error.message || 'Something went wrong',
			});
		}

		return { error };
	}, [toast]);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			session,
			loading,
			signUp,
			signIn,
			signOut,
		}),
		[user, session, loading, signUp, signIn, signOut],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
