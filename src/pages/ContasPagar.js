import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Calendar, Filter, Building, DollarSign, AlertTriangle, ArrowLeft, CheckCircle, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format as formatDateFns } from 'date-fns';
const ContasPagar = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        fornecedor: '',
        status: 'todos',
        unidade: 'todas',
        dataInicio: '',
        dataFim: ''
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('lancamentos').select('*').eq('tipo', 'Saida');
        if (error) {
            toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
        }
        else {
            setContas((data ?? []));
        }
        setLoading(false);
    };
    const getStatus = (conta) => {
        if (conta.status === 'Pago')
            return 'pago';
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(conta.data + 'T00:00:00');
        return vencimento < hoje ? 'vencido' : 'aberto';
    };
    const filteredContas = useMemo(() => {
        let filtered = [...contas];
        if (filters.fornecedor) {
            filtered = filtered.filter(c => c.cliente_fornecedor?.toLowerCase().includes(filters.fornecedor.toLowerCase()));
        }
        if (filters.status !== 'todos') {
            filtered = filtered.filter(c => getStatus(c) === filters.status);
        }
        if (filters.unidade !== 'todas') {
            filtered = filtered.filter(c => c.unidade === filters.unidade);
        }
        if (filters.dataInicio) {
            const startDate = new Date(filters.dataInicio + 'T00:00:00');
            filtered = filtered.filter(c => new Date(c.data + 'T00:00:00') >= startDate);
        }
        if (filters.dataFim) {
            const endDate = new Date(filters.dataFim + 'T00:00:00');
            filtered = filtered.filter(c => new Date(c.data + 'T00:00:00') <= endDate);
        }
        return filtered.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    }, [contas, filters]);
    const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (dateString) => new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const getStatusColor = (status) => ({
        'vencido': 'bg-red-500/20 text-red-400 border-red-500/30',
        'aberto': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'pago': 'bg-green-500/20 text-green-400 border-green-500/30',
    }[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');
    const getStatusLabel = (status) => ({
        'vencido': 'Vencido', 'aberto': 'Em Aberto', 'pago': 'Pago'
    }[status] || status);
    const groupedContas = useMemo(() => {
        return filteredContas.reduce((acc, conta) => {
            (acc[conta.data] = acc[conta.data] || []).push(conta);
            return acc;
        }, {});
    }, [filteredContas]);
    const calculateTotalsByUnit = (itens) => {
        return itens.reduce((acc, conta) => {
            const unit = conta.unidade || 'N/A';
            acc[unit] = (acc[unit] || 0) + conta.valor;
            return acc;
        }, {});
    };
    const totalGeral = filteredContas.reduce((sum, c) => sum + c.valor, 0);
    const totalAberto = filteredContas.filter(c => getStatus(c) === 'aberto');
    const totalVencido = filteredContas.filter(c => getStatus(c) === 'vencido');
    const totalAbertoPorUnidade = calculateTotalsByUnit(totalAberto);
    const totalVencidoPorUnidade = calculateTotalsByUnit(totalVencido);
    const handleMarkAsPaid = async (id) => {
        const today = formatDateFns(new Date(), 'yyyy-MM-dd');
        const { error } = await supabase.from('lancamentos').update({ status: 'Pago', datapag: today }).eq('id', id);
        if (error) {
            toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
        }
        else {
            toast({ title: 'Sucesso!', description: 'Lançamento marcado como pago.' });
            loadData();
        }
    };
    const handleEditLancamento = (lancamento) => {
        navigate('/lancamentos', { state: { lancamento } });
    };
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Contas a Pagar - SysFina" }), _jsx("meta", { name: "description", content: "Gerencie suas contas a pagar com filtros e totalizadores" })] }), _jsx(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate('/'), className: "text-white hover:bg-white/10", children: _jsx(ArrowLeft, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold gradient-text", children: "Contas a Pagar" }), _jsx("p", { className: "text-gray-400 mt-2", children: "Controle seus pagamentos" })] })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs(Card, { className: "glass-card", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium text-gray-300", children: "Total Filtrado" }), _jsx(DollarSign, { className: "w-4 h-4 text-blue-400" })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold text-blue-400", children: formatCurrency(totalGeral) }) })] }), _jsxs(Card, { className: "glass-card", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium text-gray-300", children: "Em Aberto" }), _jsx(Calendar, { className: "w-4 h-4 text-yellow-400" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-yellow-400", children: formatCurrency(totalAberto.reduce((s, c) => s + c.valor, 0)) }), _jsx("div", { className: "mt-2 space-y-1 text-xs text-gray-400", children: Object.entries(totalAbertoPorUnidade).map(([unit, val]) => _jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { children: [unit, ":"] }), _jsx("span", { className: "font-semibold", children: formatCurrency(val) })] }, unit)) })] })] }), _jsxs(Card, { className: "glass-card", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium text-gray-300", children: "Vencido" }), _jsx(AlertTriangle, { className: "w-4 h-4 text-red-400" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-red-400", children: formatCurrency(totalVencido.reduce((s, c) => s + c.valor, 0)) }), _jsx("div", { className: "mt-2 space-y-1 text-xs text-gray-400", children: Object.entries(totalVencidoPorUnidade).map(([unit, val]) => _jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { children: [unit, ":"] }), _jsx("span", { className: "font-semibold", children: formatCurrency(val) })] }, unit)) })] })] })] }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, children: _jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-white flex items-center gap-2", children: [_jsx(Filter, { className: "w-5 h-5" }), "Filtros"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-2 block", children: "Fornecedor" }), _jsx(Input, { placeholder: "Buscar fornecedor...", value: filters.fornecedor, onChange: (e) => setFilters({ ...filters, fornecedor: e.target.value }), className: "bg-white/10 border-white/20 text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-2 block", children: "Status" }), _jsxs(Select, { value: filters.status, onValueChange: (value) => setFilters({ ...filters, status: value }), children: [_jsx(SelectTrigger, { className: "bg-white/10 border-white/20 text-white", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todos", children: "Todos" }), _jsx(SelectItem, { value: "aberto", children: "Em Aberto" }), _jsx(SelectItem, { value: "vencido", children: "Vencido" }), _jsx(SelectItem, { value: "pago", children: "Pago" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-2 block", children: "Unidade" }), _jsxs(Select, { value: filters.unidade, onValueChange: (value) => setFilters({ ...filters, unidade: value }), children: [_jsx(SelectTrigger, { className: "bg-white/10 border-white/20 text-white", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todas", children: "Todas" }), _jsx(SelectItem, { value: "CNA Angra dos Reis", children: "CNA Angra dos Reis" }), _jsx(SelectItem, { value: "CNA Mangaratiba", children: "CNA Mangaratiba" }), _jsx(SelectItem, { value: "Casa", children: "Casa" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-2 block", children: "Data In\u00EDcio" }), _jsx(Input, { type: "date", value: filters.dataInicio, onChange: (e) => setFilters({ ...filters, dataInicio: e.target.value }), className: "bg-white/10 border-white/20 text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-2 block", children: "Data Fim" }), _jsx(Input, { type: "date", value: filters.dataFim, onChange: (e) => setFilters({ ...filters, dataFim: e.target.value }), className: "bg-white/10 border-white/20 text-white" })] })] }) })] }) }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.4 }, className: "space-y-6", children: loading ? _jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" }) })
                    : Object.entries(groupedContas).map(([date, contasData], index) => (_jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs(CardTitle, { className: "text-white flex items-center gap-2", children: [_jsx(Calendar, { className: "w-5 h-5" }), formatDate(date)] }), _jsx("div", { className: "text-lg font-bold text-red-400", children: formatCurrency(contasData.reduce((s, c) => s + c.valor, 0)) })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: contasData.map((conta) => {
                                        const status = getStatus(conta);
                                        return (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.1 }, className: "flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg bg-white/5 border border-white/10", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2 md:mb-0", children: [_jsx("div", { className: "p-2 rounded-lg bg-red-500/20", children: _jsx(Building, { className: "w-4 h-4 text-red-400" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-white", children: conta.cliente_fornecedor }), _jsx("p", { className: "text-sm text-gray-400", children: conta.descricao })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: `px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`, children: getStatusLabel(status) }), _jsx("div", { className: "text-lg font-bold text-red-400", children: formatCurrency(conta.valor) }), _jsx("button", { type: "button", onClick: () => handleEditLancamento(conta), className: "p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors", "aria-label": "Editar lan\u00E7amento", children: _jsx(Settings, { className: "w-4 h-4" }) }), status !== 'pago' && (_jsxs(Button, { size: "sm", variant: "outline", className: "text-green-400 border-green-400 hover:bg-green-400 hover:text-black", onClick: () => handleMarkAsPaid(conta.id), children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Pagar"] }))] })] }, conta.id));
                                    }) }) })] }, date))) }), !loading && filteredContas.length === 0 && _jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "text-center py-12", children: [_jsx("div", { className: "text-gray-400 text-lg", children: "Nenhuma conta encontrada" }), _jsx("p", { className: "text-gray-500 mt-2", children: "Ajuste os filtros ou importe novos dados." })] })] }));
};
export default ContasPagar;
