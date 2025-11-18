import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Erro no Cadastro",
                description: "As senhas não coincidem.",
            });
            return;
        }
        setLoading(true);
        const { error } = await signUp(email, password, {
            data: {
                name: fullName,
                company_name: companyName,
            }
        });
        if (error) {
            toast({
                variant: "destructive",
                title: "Falha no Cadastro",
                description: error.message || "Não foi possível criar sua conta.",
            });
        }
        else {
            toast({
                title: "Cadastro realizado com sucesso!",
                description: "Verifique seu e-mail para confirmar sua conta.",
            });
            navigate('/login');
        }
        setLoading(false);
    };
    return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs(motion.div, { initial: { opacity: 0, y: -50 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "w-full max-w-md p-8 space-y-8 glass-card", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl font-bold gradient-text", children: "Criar Conta" }), _jsx("p", { className: "text-muted-foreground", children: "Junte-se ao SysFina e organize suas finan\u00E7as." })] }), _jsxs("form", { onSubmit: handleSignUp, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "fullName", children: "Nome Completo" }), _jsx(Input, { id: "fullName", type: "text", placeholder: "Seu nome completo", value: fullName, onChange: (e) => setFullName(e.target.value), required: true, className: "bg-slate-800/50 border-slate-700" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "companyName", children: "Nome da Empresa" }), _jsx(Input, { id: "companyName", type: "text", placeholder: "Nome da sua empresa", value: companyName, onChange: (e) => setCompanyName(e.target.value), required: true, className: "bg-slate-800/50 border-slate-700" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "E-mail" }), _jsx(Input, { id: "email", type: "email", placeholder: "seu@email.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, className: "bg-slate-800/50 border-slate-700" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "Senha" }), _jsx(Input, { id: "password", type: "password", placeholder: "********", value: password, onChange: (e) => setPassword(e.target.value), required: true, className: "bg-slate-800/50 border-slate-700" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirm-password", children: "Confirmar Senha" }), _jsx(Input, { id: "confirm-password", type: "password", placeholder: "********", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), required: true, className: "bg-slate-800/50 border-slate-700" })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? 'Criando conta...' : 'Cadastrar' })] }), _jsxs("p", { className: "text-center text-sm text-muted-foreground", children: ["J\u00E1 tem uma conta?", ' ', _jsx(Link, { to: "/login", className: "font-medium text-primary hover:underline", children: "Fa\u00E7a login" })] })] }) }));
};
export default SignUp;
