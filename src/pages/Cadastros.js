import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Building2, Home, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import LancamentoForm from '@/components/forms/LancamentoForm';
const Cadastros = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeCard, setActiveCard] = useState('cliente');
    const [clienteDescricao, setClienteDescricao] = useState('');
    const [fornecedorDescricao, setFornecedorDescricao] = useState('');
    const [unidadeDescricao, setUnidadeDescricao] = useState('');
    const [clienteLoading, setClienteLoading] = useState(false);
    const [fornecedorLoading, setFornecedorLoading] = useState(false);
    const [unidadeLoading, setUnidadeLoading] = useState(false);
    const cardOptions = [
        {
            id: 'cliente',
            title: 'Cliente',
            description: 'Cadastrar novos clientes.',
            icon: Users,
        },
        {
            id: 'fornecedor',
            title: 'Fornecedor',
            description: 'Gerenciar fornecedores parceiros.',
            icon: Building2,
        },
        {
            id: 'unidade',
            title: 'Unidade',
            description: 'Controlar unidades de atendimento.',
            icon: Home,
        },
        {
            id: 'lancamento',
            title: 'Lançamento',
            description: 'Registrar novos lançamentos financeiros.',
            icon: PenLine,
        },
    ];
    const handleSuccess = (message) => {
        toast({ title: 'Sucesso!', description: message });
    };
    const handleError = (description) => {
        toast({
            title: 'Erro ao salvar',
            description,
            variant: 'destructive',
        });
    };
    const saveCliente = async () => {
        const descricao = clienteDescricao.trim();
        if (!descricao) {
            handleError('Informe o nome do cliente.');
            return;
        }
        setClienteLoading(true);
        const { error } = await supabase
            .from('clientes_fornecedores')
            .insert([{ tipo: 'Cliente', descricao }]);
        setClienteLoading(false);
        if (error) {
            handleError(error.message || 'Tente novamente.');
            return;
        }
        handleSuccess('Cliente cadastrado com sucesso.');
        setClienteDescricao('');
    };
    const saveFornecedor = async () => {
        const descricao = fornecedorDescricao.trim();
        if (!descricao) {
            handleError('Informe o nome do fornecedor.');
            return;
        }
        setFornecedorLoading(true);
        const { error } = await supabase
            .from('clientes_fornecedores')
            .insert([{ tipo: 'Fornecedor', descricao }]);
        setFornecedorLoading(false);
        if (error) {
            handleError(error.message || 'Tente novamente.');
            return;
        }
        handleSuccess('Fornecedor cadastrado com sucesso.');
        setFornecedorDescricao('');
    };
    const saveUnidade = async () => {
        const descricao = unidadeDescricao.trim();
        if (!descricao) {
            handleError('Informe o nome da unidade.');
            return;
        }
        setUnidadeLoading(true);
        const { error } = await supabase
            .from('unidades')
            .insert([{ descricao }]);
        setUnidadeLoading(false);
        if (error) {
            handleError(error.message || 'Tente novamente.');
            return;
        }
        handleSuccess('Unidade cadastrada com sucesso.');
        setUnidadeDescricao('');
    };
    const renderForm = () => {
        if (activeCard === 'cliente') {
            return (_jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-white", children: "Cadastro de Cliente" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "cliente-descricao", className: "text-gray-300", children: "Nome do cliente" }), _jsx(Input, { id: "cliente-descricao", placeholder: "Ex.: Maria Souza", value: clienteDescricao, onChange: (event) => setClienteDescricao(event.target.value) })] }), _jsxs("div", { className: "flex justify-end gap-4 pt-4", children: [_jsx(Button, { variant: "outline", onClick: () => setClienteDescricao(''), disabled: clienteLoading, children: "Limpar" }), _jsx(Button, { onClick: saveCliente, disabled: clienteLoading, children: clienteLoading ? 'Salvando...' : 'Salvar Cliente' })] })] })] }));
        }
        if (activeCard === 'fornecedor') {
            return (_jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-white", children: "Cadastro de Fornecedor" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "fornecedor-descricao", className: "text-gray-300", children: "Nome do fornecedor" }), _jsx(Input, { id: "fornecedor-descricao", placeholder: "Ex.: Distribuidora XPTO", value: fornecedorDescricao, onChange: (event) => setFornecedorDescricao(event.target.value) })] }), _jsxs("div", { className: "flex justify-end gap-4 pt-4", children: [_jsx(Button, { variant: "outline", onClick: () => setFornecedorDescricao(''), disabled: fornecedorLoading, children: "Limpar" }), _jsx(Button, { onClick: saveFornecedor, disabled: fornecedorLoading, children: fornecedorLoading ? 'Salvando...' : 'Salvar Fornecedor' })] })] })] }));
        }
        if (activeCard === 'unidade') {
            return (_jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-white", children: "Cadastro de Unidade" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "unidade-descricao", className: "text-gray-300", children: "Nome da unidade" }), _jsx(Input, { id: "unidade-descricao", placeholder: "Ex.: CNA Angra dos Reis", value: unidadeDescricao, onChange: (event) => setUnidadeDescricao(event.target.value) })] }), _jsxs("div", { className: "flex justify-end gap-4 pt-4", children: [_jsx(Button, { variant: "outline", onClick: () => setUnidadeDescricao(''), disabled: unidadeLoading, children: "Limpar" }), _jsx(Button, { onClick: saveUnidade, disabled: unidadeLoading, children: unidadeLoading ? 'Salvando...' : 'Salvar Unidade' })] })] })] }));
        }
        if (activeCard === 'lancamento') {
            return (_jsx(LancamentoForm, { onCancel: () => setActiveCard('cliente') }));
        }
        return null;
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "space-y-8", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Cadastros - SysFina" }), _jsx("meta", { name: "description", content: "Central de cadastros de clientes, fornecedores e unidades." })] }), _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Button, { variant: "outline", size: "icon", className: "h-10 w-10", onClick: () => navigate(-1), children: [_jsx(ArrowLeft, { className: "h-5 w-5" }), _jsx("span", { className: "sr-only", children: "Voltar" })] }), _jsxs("div", { className: "flex flex-col", children: [_jsx("h1", { className: "text-3xl font-bold gradient-text", children: "Cadastros" }), _jsx("span", { className: "text-sm text-gray-300", children: "Escolha o tipo de cadastro para continuar." })] })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: cardOptions.map((card) => {
                    const Icon = card.icon;
                    const isActive = activeCard === card.id;
                    return (_jsx(Card, { className: `glass-card cursor-pointer transition-all ${isActive ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-transparent hover:border-white/20'}`, onClick: () => setActiveCard(card.id), children: _jsx(CardContent, { className: "p-6 space-y-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `p-3 rounded-lg ${isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-gray-300'}`, children: _jsx(Icon, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: card.title }), _jsx("p", { className: "text-sm text-gray-400", children: card.description })] })] }) }) }, card.id));
                }) }), renderForm()] }));
};
export default Cadastros;
