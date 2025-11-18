import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowLeft, Filter, FileDown, PlusSquare, MinusSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '@/lib/utils';
import { useEmCashValue } from '@/hooks/useEmCashValue';
const FluxoCaixaDetalhado = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [allData, setAllData] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [unidadeFiltro, setUnidadeFiltro] = useState('todas');
    const [viewType, setViewType] = useState('sintetico');
    const [expandedRows, setExpandedRows] = useState({});
    const [emCashValue] = useEmCashValue();
    const [reportGenerated, setReportGenerated] = useState(false);
    const [generatedAt, setGeneratedAt] = useState(null);
    const handleGenerateReport = async () => {
        setLoading(true);
        setReportGenerated(false);
        const { data, error } = await supabase.from('lancamentos').select('*');
        if (error) {
            toast({ title: "Erro ao buscar dados", description: error.message, variant: "destructive" });
        }
        else {
            setAllData(data || []);
            setReportGenerated(true);
            setGeneratedAt(new Date());
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
        const totalReceberAtrasado = atrasadosReceber.reduce((acc, i) => acc + i.valor, 0) + emCashValue;
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
            receber: totalReceberAtrasado,
            pagar: atrasadosPagar.reduce((acc, i) => acc + i.valor, 0),
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
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });
    const year = currentDate.getFullYear();
    const generatePDF = () => {
        if (!reportGenerated) {
            toast({ title: "Gere o relatório primeiro", description: "Clique em \"Gerar Relatório\" para carregar os dados.", variant: "destructive" });
            return;
        }
        const doc = new jsPDF();
        const tableColumn = ["Dia", "A Receber", "A Pagar", "Saldo do Dia", "Saldo Acumulado"];
        const tableRows = [];
        monthData.forEach(item => {
            const rowData = [
                item.dia === '00' ? 'Atrasados' : item.dia,
                formatCurrency(item.receber),
                formatCurrency(item.pagar),
                formatCurrency(item.saldoDia),
                formatCurrency(item.saldoAcumulado)
            ];
            tableRows.push(rowData);
            if (viewType === 'analitico' && (item.details.receber.length > 0 || item.details.pagar.length > 0)) {
                item.details.receber.forEach(det => {
                    tableRows.push([{ content: `  ${det.cliente_fornecedor}`, colSpan: 1 }, { content: formatCurrency(det.valor), styles: { halign: 'right' } }, '', '', '']);
                });
                item.details.pagar.forEach(det => {
                    tableRows.push([{ content: `  ${det.cliente_fornecedor}`, colSpan: 1 }, '', { content: formatCurrency(det.valor), styles: { halign: 'right' } }, '', '']);
                });
            }
        });
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            headStyles: { fillColor: [22, 163, 74] },
            didDrawPage: function (data) {
                doc.setFontSize(20);
                doc.setTextColor(40);
                doc.text(`Relatório de Fluxo de Caixa - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`, data.settings.margin.left, 15);
            }
        });
        doc.save(`fluxo_caixa_${monthName}_${year}.pdf`);
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Relat\u00F3rio de Fluxo de Caixa - SysFina" }), _jsx("meta", { name: "description", content: "Gere e visualize o relat\u00F3rio de fluxo de caixa detalhado." })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "space-y-8", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate('/relatorios'), className: "text-white hover:bg-white/10", children: _jsx(ArrowLeft, { className: "w-6 h-6" }) }), _jsx("div", { children: _jsx("h1", { className: "text-3xl font-bold text-white", children: "Relat\u00F3rio de Fluxo de Caixa" }) })] }), _jsxs("div", { className: "flex items-center gap-4 bg-slate-800/50 p-2 rounded-lg", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: handlePrevMonth, children: _jsx(ChevronLeft, { className: "h-6 w-6 text-white" }) }), _jsx("div", { className: "text-xl font-semibold text-white w-48 text-center capitalize", children: `${monthName} ${year}` }), _jsx(Button, { variant: "ghost", size: "icon", onClick: handleNextMonth, children: _jsx(ChevronRight, { className: "h-6 w-6 text-white" }) })] })] }), _jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { className: "flex items-center gap-2", children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-white", children: [_jsx(Filter, { className: "w-5 h-5" }), "Configura\u00E7\u00E3o do Relat\u00F3rio"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsxs(Select, { value: unidadeFiltro, onValueChange: setUnidadeFiltro, children: [_jsx(SelectTrigger, { className: "w-full md:w-72 bg-white/10 border-white/20 text-white", children: _jsx(SelectValue, { placeholder: "Filtrar por Unidade" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todas", children: "Todas as Unidades" }), _jsx(SelectItem, { value: "CNA Angra dos Reis", children: "CNA Angra dos Reis" }), _jsx(SelectItem, { value: "CNA Mangaratiba", children: "CNA Mangaratiba" }), _jsx(SelectItem, { value: "Casa", children: "Casa" })] })] }), _jsxs(Select, { value: viewType, onValueChange: setViewType, children: [_jsx(SelectTrigger, { className: "w-full md:w-72 bg-white/10 border-white/20 text-white", children: _jsx(SelectValue, { placeholder: "Tipo de Visualiza\u00E7\u00E3o" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "sintetico", children: "Sint\u00E9tico" }), _jsx(SelectItem, { value: "analitico", children: "Anal\u00EDtico" })] })] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:justify-end", children: [_jsx(Button, { onClick: handleGenerateReport, disabled: loading, className: "w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white", children: loading ? 'Gerando...' : 'Gerar Relatório' }), _jsxs(Button, { onClick: generatePDF, disabled: !reportGenerated || loading, variant: "outline", className: "w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50", children: [_jsx(FileDown, { className: "w-4 h-4 mr-2" }), " Gerar PDF"] })] })] })] }), !reportGenerated && !loading && (_jsx(Card, { className: "glass-card border-dashed border-white/20", children: _jsxs(CardContent, { className: "text-center text-gray-300 py-12", children: ["Ajuste os filtros e clique em ", _jsx("span", { className: "font-semibold text-white", children: "\"Gerar Relat\u00F3rio\"" }), " para carregar o fluxo de caixa."] }) })), loading && (_jsx("div", { className: "flex justify-center py-16", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" }) })), reportGenerated && !loading && (_jsxs(_Fragment, { children: [generatedAt && (_jsxs("div", { className: "text-sm text-gray-300 text-right", children: [_jsx("span", { className: "text-white font-medium", children: "Gerado em:" }), " ", format(generatedAt, 'dd/MM/yyyy HH:mm')] })), _jsxs(Card, { className: "bg-slate-800/60 border-slate-700 text-white backdrop-blur-sm", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Detalhes do M\u00EAs" }) }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-700", children: [_jsx("th", { className: "p-3 w-12" }), _jsx("th", { className: "p-3", children: "Dia" }), _jsx("th", { className: "p-3 text-right text-green-400", children: "A Receber" }), _jsx("th", { className: "p-3 text-right text-red-400", children: "A Pagar" }), _jsx("th", { className: "p-3 text-right", children: "Saldo do Dia" }), _jsx("th", { className: "p-3 text-right", children: "Saldo Acumulado" })] }) }), _jsx("tbody", { children: monthData.length > 0 ? monthData.map((dia) => (_jsxs(React.Fragment, { children: [_jsxs("tr", { className: cn('border-b border-slate-800 hover:bg-slate-700/50', dia.dia === '00' && 'bg-yellow-500/10'), children: [_jsx("td", { className: "p-3", children: viewType === 'analitico' && (dia.details.receber.length > 0 || dia.details.pagar.length > 0) && (_jsx(Button, { variant: "ghost", size: "icon", onClick: () => toggleRow(dia.dia), className: "h-8 w-8", children: expandedRows[dia.dia] ? _jsx(MinusSquare, { className: "h-4 w-4" }) : _jsx(PlusSquare, { className: "h-4 w-4" }) })) }), _jsx("td", { className: cn('p-3 font-medium', dia.dia === '00' && 'text-yellow-400'), children: dia.dia === '00' ? 'Atrasados' : dia.dia }), _jsx("td", { className: "p-3 text-right font-mono text-green-400", children: formatCurrency(dia.receber) }), _jsx("td", { className: "p-3 text-right font-mono text-red-400", children: formatCurrency(dia.pagar) }), _jsx("td", { className: cn('p-3 text-right font-mono', dia.saldoDia >= 0 ? 'text-blue-300' : 'text-orange-400'), children: formatCurrency(dia.saldoDia) }), _jsx("td", { className: cn('p-3 text-right font-mono', dia.saldoAcumulado >= 0 ? 'text-white' : 'text-red-500'), children: formatCurrency(dia.saldoAcumulado) })] }), _jsx(AnimatePresence, { children: viewType === 'analitico' && expandedRows[dia.dia] && (_jsx(motion.tr, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "bg-slate-900/50", children: _jsx("td", { colSpan: 6, className: "p-0", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-x-4 p-4", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-green-400 mb-2 border-b border-slate-700 pb-1", children: "Entradas" }), dia.details.receber.length > 0 ? dia.details.receber.map(item => (_jsxs("div", { className: "flex justify-between text-sm py-1", children: [_jsx("span", { children: item.cliente_fornecedor }), _jsx("span", { className: "font-mono", children: formatCurrency(item.valor) })] }, item.id))) : _jsx("p", { className: "text-xs text-slate-400", children: "Nenhuma entrada." })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-red-400 mb-2 border-b border-slate-700 pb-1", children: "Sa\u00EDdas" }), dia.details.pagar.length > 0 ? dia.details.pagar.map(item => (_jsxs("div", { className: "flex justify-between text-sm py-1", children: [_jsx("span", { children: item.cliente_fornecedor }), _jsx("span", { className: "font-mono", children: formatCurrency(item.valor) })] }, item.id))) : _jsx("p", { className: "text-xs text-slate-400", children: "Nenhuma sa\u00EDda." })] })] }) }) })) })] }, dia.dia))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "text-center p-8 text-slate-400", children: "Nenhum dado para exibir neste m\u00EAs." }) })) })] }) }) })] })] }))] })] }));
};
export default FluxoCaixaDetalhado;
