import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowLeft, Filter, PlusSquare, MinusSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEmCashValue } from '@/hooks/useEmCashValue';
const FluxoCaixa = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [allData, setAllData] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [unidadeFiltro, setUnidadeFiltro] = useState('todas');
    const [viewType, setViewType] = useState('sintetico');
    const [expandedRows, setExpandedRows] = useState({});
    const [emCashValue] = useEmCashValue();
    useEffect(() => {
        loadData();
    }, [toast]);
    const loadData = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('lancamentos').select('*');
        if (error) {
            toast({ title: "Erro ao buscar dados", description: error.message, variant: "destructive" });
        }
        else {
            setAllData(data || []);
        }
        setLoading(false);
    };
    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setExpandedRows({});
    };
    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setExpandedRows({});
    };
    const toggleRow = (dia) => {
        setExpandedRows(prev => ({ ...prev, [dia]: !prev[dia] }));
    };
    const formatCurrency = (value) => {
        return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = startOfMonth(currentDate);
        const lastDayOfMonth = endOfMonth(currentDate);
        const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
        let fluxo = daysInMonth.map(day => ({
            dia: format(day, 'dd'),
            receber: 0,
            pagar: 0,
            details: { receber: [], pagar: [] }
        }));
        const filteredByUnit = unidadeFiltro === 'todas'
            ? allData
            : allData.filter(item => item.unidade === unidadeFiltro);
        const atrasadosLancamentos = filteredByUnit.filter(item => {
            if (item.status === 'Pago')
                return false;
            const vencimento = new Date(item.data + 'T00:00:00');
            return vencimento < firstDayOfMonth;
        });
        const atrasadosReceber = atrasadosLancamentos.filter(i => i.tipo === 'Entrada');
        const atrasadosPagar = atrasadosLancamentos.filter(i => i.tipo === 'Saida');
        const totalAtrasadoReceber = atrasadosReceber.reduce((acc, i) => acc + i.valor, 0) + emCashValue;
        const totalAtrasadoPagar = atrasadosPagar.reduce((acc, i) => acc + i.valor, 0);
        const receberDetails = [...atrasadosReceber];
        if (emCashValue !== 0) {
            receberDetails.push({
                id: 'em-cash-adjustment',
                cliente_fornecedor: 'Saldo em Cash',
                valor: emCashValue
            });
        }
        const dia00 = {
            dia: '00',
            receber: totalAtrasadoReceber,
            pagar: totalAtrasadoPagar,
            details: {
                receber: receberDetails,
                pagar: atrasadosPagar
            }
        };
        const monthDataFiltered = filteredByUnit.filter(item => {
            if (item.status === 'Pago')
                return false;
            const vencimento = new Date(item.data + 'T00:00:00');
            return vencimento.getUTCFullYear() === year && vencimento.getUTCMonth() === month;
        });
        monthDataFiltered.forEach(item => {
            const vencimento = new Date(item.data + 'T00:00:00');
            const dayIndex = vencimento.getUTCDate() - 1;
            if (fluxo[dayIndex]) {
                if (item.tipo === 'Entrada') {
                    fluxo[dayIndex].receber += item.valor;
                    fluxo[dayIndex].details.receber.push(item);
                }
                else {
                    fluxo[dayIndex].pagar += item.valor;
                    fluxo[dayIndex].details.pagar.push(item);
                }
            }
        });
        const fullFluxo = [dia00, ...fluxo];
        let saldoAcumulado = 0;
        return fullFluxo.map(dia => {
            const saldoDia = dia.receber - dia.pagar;
            saldoAcumulado += saldoDia;
            return { ...dia, saldoDia, saldoAcumulado };
        });
    }, [allData, currentDate, unidadeFiltro, emCashValue]);
    const chartData = monthData.map(d => ({
        name: d.dia,
        ...d
    }));
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
    const year = currentDate.getFullYear();
    return (_jsxs(_Fragment, { children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Fluxo de Caixa Previsto - SysFina" }), _jsx("meta", { name: "description", content: "An\u00E1lise do fluxo de caixa previsto (valores a vencer)." })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "space-y-8", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate('/'), className: "text-white hover:bg-white/10", children: _jsx(ArrowLeft, { className: "w-6 h-6" }) }), _jsx("div", { children: _jsx("h1", { className: "text-3xl font-bold text-white", children: "Fluxo de Caixa Previsto" }) })] }), _jsxs("div", { className: "flex items-center gap-4 bg-slate-800/50 p-2 rounded-lg", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: handlePrevMonth, children: _jsx(ChevronLeft, { className: "h-6 w-6 text-white" }) }), _jsx("div", { className: "text-xl font-semibold text-white w-48 text-center capitalize", children: `${monthName} ${year}` }), _jsx(Button, { variant: "ghost", size: "icon", onClick: handleNextMonth, children: _jsx(ChevronRight, { className: "h-6 w-6 text-white" }) })] })] }), _jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-white", children: [_jsx(Filter, { className: "w-5 h-5" }), "Filtros"] }) }), _jsxs(CardContent, { className: "flex flex-col md:flex-row gap-4", children: [_jsxs(Select, { value: unidadeFiltro, onValueChange: setUnidadeFiltro, children: [_jsx(SelectTrigger, { className: "w-full md:w-72 bg-white/10 border-white/20 text-white", children: _jsx(SelectValue, { placeholder: "Filtrar por Unidade" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todas", children: "Todas as Unidades" }), _jsx(SelectItem, { value: "CNA Angra dos Reis", children: "CNA Angra dos Reis" }), _jsx(SelectItem, { value: "CNA Mangaratiba", children: "CNA Mangaratiba" }), _jsx(SelectItem, { value: "Casa", children: "Casa" })] })] }), _jsxs(Select, { value: viewType, onValueChange: setViewType, children: [_jsx(SelectTrigger, { className: "w-full md:w-72 bg-white/10 border-white/20 text-white", children: _jsx(SelectValue, { placeholder: "Tipo de Visualiza\u00E7\u00E3o" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "sintetico", children: "Sint\u00E9tico" }), _jsx(SelectItem, { value: "analitico", children: "Anal\u00EDtico" })] })] })] })] }), _jsxs(Card, { className: "bg-slate-800/60 border-slate-700 text-white backdrop-blur-sm", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Detalhes do M\u00EAs" }) }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-700", children: [_jsx("th", { className: "p-3 w-12" }), _jsx("th", { className: "p-3", children: "Dia" }), _jsx("th", { className: "p-3 text-right text-green-400", children: "A Receber" }), _jsx("th", { className: "p-3 text-right text-red-400", children: "A Pagar" }), _jsx("th", { className: "p-3 text-right", children: "Saldo do Dia" }), _jsx("th", { className: "p-3 text-right", children: "Saldo Acumulado" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "text-center p-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto" }) }) })) : monthData.length > 0 ? monthData.map((dia) => (_jsxs(React.Fragment, { children: [_jsxs(motion.tr, { layout: true, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: cn('border-b border-slate-800 hover:bg-slate-700/50', dia.dia === '00' && 'bg-yellow-500/10'), children: [_jsx("td", { className: "p-3", children: viewType === 'analitico' && (dia.details.receber.length > 0 || dia.details.pagar.length > 0) && (_jsx(Button, { variant: "ghost", size: "icon", onClick: () => toggleRow(dia.dia), className: "h-8 w-8", children: expandedRows[dia.dia] ? _jsx(MinusSquare, { className: "h-4 w-4" }) : _jsx(PlusSquare, { className: "h-4 w-4" }) })) }), _jsx("td", { className: cn('p-3 font-medium', dia.dia === '00' && 'text-yellow-400'), children: dia.dia === '00' ? 'Atrasados' : dia.dia }), _jsx("td", { className: "p-3 text-right font-mono text-green-400", children: formatCurrency(dia.receber) }), _jsx("td", { className: "p-3 text-right font-mono text-red-400", children: formatCurrency(dia.pagar) }), _jsx("td", { className: cn('p-3 text-right font-mono', dia.saldoDia >= 0 ? 'text-blue-300' : 'text-orange-400'), children: formatCurrency(dia.saldoDia) }), _jsx("td", { className: cn('p-3 text-right font-mono', dia.saldoAcumulado >= 0 ? 'text-white' : 'text-red-500'), children: formatCurrency(dia.saldoAcumulado) })] }), _jsx(AnimatePresence, { children: viewType === 'analitico' && expandedRows[dia.dia] && (_jsx(motion.tr, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "bg-slate-900/50", children: _jsx("td", { colSpan: 6, className: "p-0", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-x-4 p-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-green-400 mb-2 border-b border-slate-700 pb-1", children: "Entradas" }), dia.details.receber.length > 0 ? dia.details.receber.map(item => (_jsxs("div", { className: "flex justify-between text-sm py-1", children: [_jsx("span", { children: item.cliente_fornecedor }), _jsx("span", { className: "font-mono", children: formatCurrency(item.valor) })] }, item.id))) : _jsx("p", { className: "text-xs text-slate-400", children: "Nenhuma entrada." })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-red-400 mb-2 border-b border-slate-700 pb-1", children: "Sa\u00EDdas" }), dia.details.pagar.length > 0 ? dia.details.pagar.map(item => (_jsxs("div", { className: "flex justify-between text-sm py-1", children: [_jsx("span", { children: item.cliente_fornecedor }), _jsx("span", { className: "font-mono", children: formatCurrency(item.valor) })] }, item.id))) : _jsx("p", { className: "text-xs text-slate-400", children: "Nenhuma sa\u00EDda." })] })] }) }) })) })] }, dia.dia))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "text-center p-8 text-slate-400", children: "Nenhum dado para exibir neste m\u00EAs." }) })) })] }) }) })] }), _jsxs(Card, { className: "bg-slate-800/60 border-slate-700 text-white backdrop-blur-sm", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Gr\u00E1fico de Fluxo de Caixa Acumulado" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 400, children: _jsxs(LineChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255, 255, 255, 0.1)" }), _jsx(XAxis, { dataKey: "name", stroke: "rgba(255, 255, 255, 0.7)" }), _jsx(YAxis, { stroke: "rgba(255, 255, 255, 0.7)", tickFormatter: (value) => `R$${value / 1000}k` }), _jsx(Tooltip, { contentStyle: {
                                                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                                }, labelStyle: { color: '#fff' }, formatter: (value, name) => {
                                                    const label = String(name || '');
                                                    return [formatCurrency(value), label.charAt(0).toUpperCase() + label.slice(1)];
                                                } }), _jsx(Legend, { wrapperStyle: { color: '#fff' } }), _jsx(Line, { type: "monotone", dataKey: "saldoAcumulado", name: "Saldo Acumulado", stroke: "#38bdf8", strokeWidth: 2, dot: { r: 4 }, activeDot: { r: 8 } }), _jsx(Line, { type: "monotone", dataKey: "receber", name: "A Receber", stroke: "#4ade80", strokeWidth: 2 }), _jsx(Line, { type: "monotone", dataKey: "pagar", name: "A Pagar", stroke: "#f87171", strokeWidth: 2 })] }) }) })] })] })] }));
};
export default FluxoCaixa;
