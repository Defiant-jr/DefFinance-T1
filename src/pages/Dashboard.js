import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { TrendingUp, TrendingDown, DollarSign, Download, LayoutDashboard, PlusCircle, UserPlus, FileText, LogOut, ArrowRight, ArrowLeft, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useEmCashValue } from '@/hooks/useEmCashValue';
const Dashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, signOut } = useAuth();
    const [data, setData] = useState({ lancamentos: [] });
    const [loading, setLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [monthsSpan, setMonthsSpan] = useState(6);
    const [emCashValue, setEmCashValue] = useEmCashValue();
    const [emCashDraft, setEmCashDraft] = useState(0);
    useEffect(() => {
        setEmCashDraft(emCashValue);
    }, [emCashValue]);
    useEffect(() => {
        loadDataFromSupabase();
    }, []);
    const loadDataFromSupabase = async () => {
        setLoading(true);
        const { data: lancamentos, error } = await supabase.from('lancamentos').select('*');
        if (error) {
            toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
        }
        else {
            setData({ lancamentos: (lancamentos ?? []) });
        }
        setLoading(false);
    };
    const generateChartData = (financialData, span = monthsSpan, cashValue = 0) => {
        const months = [];
        const currentDate = new Date();
        for (let i = 0; i < span; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
            const monthPagar = financialData.lancamentos
                .filter(conta => {
                if (conta.tipo !== 'Saida' || conta.status !== 'A Vencer')
                    return false;
                const vencimento = new Date(conta.data + 'T00:00:00');
                return vencimento.getUTCMonth() === date.getMonth() &&
                    vencimento.getUTCFullYear() === date.getFullYear();
            })
                .reduce((sum, conta) => sum + conta.valor, 0);
            let monthReceber = financialData.lancamentos
                .filter(conta => {
                if (conta.tipo !== 'Entrada' || conta.status !== 'A Vencer')
                    return false;
                const vencimento = new Date(conta.data + 'T00:00:00');
                return vencimento.getUTCMonth() === date.getMonth() &&
                    vencimento.getUTCFullYear() === date.getFullYear();
            })
                .reduce((sum, conta) => sum + conta.valor, 0);
            if (i === 0) {
                monthReceber += cashValue;
            }
            months.push({
                month: monthName,
                pagar: monthPagar,
                receber: monthReceber
            });
        }
        setChartData(months);
    };
    useEffect(() => {
        generateChartData({ lancamentos: data.lancamentos }, monthsSpan, emCashValue);
    }, [data.lancamentos, monthsSpan, emCashValue]);
    const handleImportData = async () => {
        setImportLoading(true);
        try {
            toast({ title: "Iniciando importaÃ§Ã£o...", description: "Buscando dados das planilhas.", variant: "default" });
            const { data: functionData, error: functionError } = await supabase.functions.invoke('import-google-sheets', {
                body: {},
            });
            if (functionError)
                throw functionError;
            toast({
                title: "Sucesso!",
                description: functionData.message || "Dados importados e sincronizados!",
            });
            await loadDataFromSupabase();
        }
        catch (error) {
            console.error("Erro na importaÃ§Ã£o: ", error);
            let description = "Ocorreu um erro durante a importaÃ§Ã£o.";
            if (error.message.includes("non-2xx")) {
                description = "A funÃ§Ã£o de importaÃ§Ã£o falhou no servidor. Verifique os logs da funÃ§Ã£o no Supabase.";
            }
            else if (error.message) {
                description = error.message;
            }
            toast({
                title: "Erro na importaÃ§Ã£o",
                description: description,
                variant: "destructive",
            });
        }
        finally {
            setImportLoading(false);
        }
    };
    const formatCurrency = (value) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    const parseCurrencyInput = (value) => {
        const digits = (value || '').replace(/\D/g, '');
        if (!digits)
            return 0;
        return Number.parseInt(digits, 10) / 100;
    };
    const handleEmCashInputChange = (event) => {
        setEmCashDraft(parseCurrencyInput(event.target.value));
    };
    const handleEmCashInputKeyDown = (event) => {
        if (event.key === 'Enter' && emCashIsDirty) {
            event.preventDefault();
            handleConfirmEmCash();
        }
    };
    const handleConfirmEmCash = () => {
        setEmCashValue(emCashDraft);
        toast({
            title: 'Saldo em Cash atualizado',
            description: `Novo valor confirmado: ${formatCurrency(emCashDraft)}`
        });
    };
    const emCashIsDirty = Math.round(emCashDraft * 100) !== Math.round(emCashValue * 100);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().split('T')[0];
    const receberAberto = data.lancamentos.filter(c => c.tipo === 'Entrada' && c.status !== 'Pago' && c.data >= hojeStr).reduce((sum, c) => sum + c.valor, 0);
    const receberAtrasado = data.lancamentos.filter(c => c.tipo === 'Entrada' && c.status !== 'Pago' && c.data < hojeStr).reduce((sum, c) => sum + c.valor, 0);
    const recebido = data.lancamentos.filter(c => c.tipo === 'Entrada' && c.status === 'Pago').reduce((sum, c) => sum + c.valor, 0);
    const emCashApplied = emCashValue > 0;
    const receberAtrasadoComCash = receberAtrasado + (emCashApplied ? emCashValue : 0);
    const totalReceberPendente = receberAberto + receberAtrasado;
    const totalReceberPendenteComCash = receberAberto + receberAtrasadoComCash;
    const pagarAberto = data.lancamentos.filter(c => c.tipo === 'Saida' && c.status !== 'Pago' && c.data >= hojeStr).reduce((sum, c) => sum + c.valor, 0);
    const pagarAtrasado = data.lancamentos.filter(c => c.tipo === 'Saida' && c.status !== 'Pago' && c.data < hojeStr).reduce((sum, c) => sum + c.valor, 0);
    const pago = data.lancamentos.filter(c => c.tipo === 'Saida' && c.status === 'Pago').reduce((sum, c) => sum + c.valor, 0);
    const totalPagarPendente = pagarAberto + pagarAtrasado;
    const entradasAVencer = data.lancamentos.filter(c => c.tipo === 'Entrada' && c.status === 'A Vencer').reduce((sum, c) => sum + c.valor, 0);
    const saidasAVencer = data.lancamentos.filter(c => c.tipo === 'Saida' && c.status === 'A Vencer').reduce((sum, c) => sum + c.valor, 0);
    const resultadoOperacional = entradasAVencer - saidasAVencer;
    const resultadoOperacionalComCash = resultadoOperacional + (emCashApplied ? emCashValue : 0);
    const summaryCards = [
        {
            title: 'Total a Receber',
            value: formatCurrency(totalReceberPendenteComCash),
            icon: TrendingUp,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-500/10',
            details: [
                { label: 'Em Aberto', value: formatCurrency(receberAberto) },
                { label: 'Em Atraso', value: formatCurrency(receberAtrasadoComCash), color: 'text-red-400' },
                ...(emCashApplied ? [{ label: 'Saldo em Cash', value: formatCurrency(emCashValue), color: 'text-green-300' }] : []),
                { label: 'Recebido', value: formatCurrency(recebido), color: 'text-green-400' }
            ]
        },
        {
            title: 'Total a Pagar',
            value: formatCurrency(totalPagarPendente),
            icon: TrendingDown,
            color: 'from-red-500 to-red-600',
            bgColor: 'bg-red-500/10',
            details: [
                { label: 'Em Aberto', value: formatCurrency(pagarAberto) },
                { label: 'Vencido', value: formatCurrency(pagarAtrasado), color: 'text-red-400' },
                { label: 'Pago', value: formatCurrency(pago), color: 'text-green-400' }
            ]
        },
        {
            title: 'Resultado Operacional (Previsto)',
            value: formatCurrency(resultadoOperacionalComCash),
            icon: DollarSign,
            color: resultadoOperacionalComCash >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600',
            bgColor: resultadoOperacionalComCash >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10',
            showSpanSelector: true,
            details: emCashApplied ? [
                { label: 'Previsto sem Cash', value: formatCurrency(resultadoOperacional), color: 'text-gray-300' },
                { label: 'Saldo em Cash', value: formatCurrency(emCashValue), color: 'text-green-300' },
            ] : undefined
        }
    ];
    const navButtons = [
        { label: "Dashboard", path: "/", icon: LayoutDashboard },
        { label: "A Receber", path: "/contas-receber", icon: ArrowRight },
        { label: "A Pagar", path: "/contas-pagar", icon: ArrowLeft },
        { label: "Fluxo de Caixa", path: "/fluxo-caixa", icon: Wallet },
        { label: "Financeiro", path: "/financeiro", icon: PlusCircle },
        { label: "Cadastro", path: "/cadastros", icon: UserPlus },
        { label: "Relat\u00f3rios", path: "/relatorios", icon: FileText },
        { label: "Integra\u00e7\u00e3o", action: handleImportData, icon: Download, loadingLabel: "Integrando..." },
    ];
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Dashboard - SysFina" }), _jsx("meta", { name: "description", content: "Dashboard principal com vis\u00C3\u00A3o geral das finan\u00C3\u00A7as" })] }), _jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { className: "text-left", children: [_jsxs("div", { className: "flex flex-col", children: [_jsx("h1", { className: "text-3xl font-bold gradient-text", children: "Sistema Financeiro" }), _jsx("span", { className: "text-sm italic text-gray-300", children: "CAEDcj v1.1.0 by Defiant" })] }), _jsxs("p", { className: "text-gray-400 mt-1", children: ["Bem-vindo, ", user?.email, "!"] })] }), _jsxs(Button, { onClick: signOut, variant: "outline", size: "sm", children: [_jsx(LogOut, { className: "w-4 h-4 mr-2" }), "Sair"] })] }), _jsx(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, children: _jsx(Card, { className: "glass-card p-2", children: _jsx("div", { className: "flex flex-wrap items-center justify-center gap-2", children: navButtons.map((item, index) => {
                            const Icon = item.icon;
                            const action = item.path ? () => navigate(item.path) : item.action;
                            const isDisabled = item.label === "Integra\u00e7\u00e3o" && importLoading;
                            return (_jsxs(Button, { onClick: action, variant: "ghost", className: "flex-grow sm:flex-grow-0 text-gray-300 hover:bg-white/10 hover:text-white", disabled: isDisabled, children: [_jsx(Icon, { className: `w-4 h-4 mr-2 ${isDisabled ? 'animate-spin' : ''}` }), _jsx("span", { children: isDisabled ? item.loadingLabel : item.label })] }, index));
                        }) }) }) }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 }, children: _jsxs(Card, { className: "glass-card", children: [_jsxs(CardHeader, { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-white", children: "Saldo em Cash" }), _jsx("p", { className: "text-sm text-gray-400", children: "Este valor ser\u00E1 somado aos lan\u00E7amentos em atraso e impacta diretamente o fluxo de caixa." })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-xs uppercase tracking-wide text-gray-400", children: "Valor atual" }), _jsx("p", { className: "text-2xl font-semibold text-white", children: formatCurrency(emCashValue) })] })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("label", { htmlFor: "emCashInput", className: "text-sm text-gray-300", children: "Atualizar valor" }), _jsxs("div", { className: "flex flex-col gap-3 lg:flex-row", children: [_jsx(Input, { id: "emCashInput", type: "text", inputMode: "decimal", value: formatCurrency(emCashDraft), onChange: handleEmCashInputChange, onKeyDown: handleEmCashInputKeyDown, className: "bg-white/10 border-white/20 text-white placeholder:text-gray-400 font-semibold tracking-wide", placeholder: "R$ 0,00" }), _jsx(Button, { onClick: handleConfirmEmCash, disabled: !emCashIsDirty, className: "lg:w-48", children: "Confirmar valor" })] }), _jsx("p", { className: "text-xs text-gray-400", children: "Ajuste manual usado para demonstrar o caixa imediato dispon\u00EDvel. Clique em confirmar para aplicar." })] })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: summaryCards.map((card, index) => {
                    const Icon = card.icon;
                    return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.3 + index * 0.1 }, className: "h-full", children: _jsxs(Card, { className: "glass-card hover:scale-105 transition-transform duration-300 h-full flex flex-col", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium text-gray-300", children: card.title }), _jsx("div", { className: `p-2 rounded-lg ${card.bgColor}`, children: _jsx(Icon, { className: "w-4 h-4 text-white" }) })] }), _jsxs(CardContent, { className: "flex-1 flex flex-col", children: [_jsx("div", { className: `text-2xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`, children: card.value }), card.details && (_jsx("div", { className: "mt-4 space-y-2", children: card.details.map((detail, idx) => (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsxs("span", { className: "text-gray-400", children: [detail.label, ":"] }), _jsx("span", { className: `font-semibold ${detail.color ? detail.color : 'text-white'}`, children: detail.value })] }, idx))) })), _jsx("div", { className: "flex-1" }), card.showSpanSelector && (_jsxs("div", { className: "mt-4 space-y-2", children: [_jsx("span", { className: "text-sm text-gray-300", children: "Periodo do grafico" }), _jsxs(Select, { value: String(monthsSpan), onValueChange: (value) => setMonthsSpan(Number(value)), children: [_jsx(SelectTrigger, { className: "w-full bg-white/10 border-white/20 text-white", children: _jsx(SelectValue, { placeholder: "Meses" }) }), _jsx(SelectContent, { children: [1, 2, 3, 4, 5, 6].map((option) => (_jsxs(SelectItem, { value: String(option), children: [option, " ", option === 1 ? 'mês' : 'meses'] }, option))) })] })] }))] })] }) }, card.title));
                }) }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.6 }, children: _jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-white", children: "Fluxo Financeiro Mensal (Previsto)" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }), _jsx(XAxis, { dataKey: "month", stroke: "#9CA3AF" }), _jsx(YAxis, { stroke: "#9CA3AF", tickFormatter: (value) => formatCurrency(value) }), _jsx(Tooltip, { contentStyle: {
                                                    backgroundColor: '#1F2937',
                                                    border: '1px solid #374151',
                                                    borderRadius: '8px'
                                                }, formatter: (value) => formatCurrency(value), labelStyle: { color: '#fff' } }), _jsx(Bar, { dataKey: "receber", fill: "#10B981", name: "A Receber" }), _jsx(Bar, { dataKey: "pagar", fill: "#EF4444", name: "A Pagar" })] }) }) }) })] }) })] }));
};
export default Dashboard;
