import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, FileDown, Filter, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useEmCashValue } from '@/hooks/useEmCashValue';
const RelatorioContas = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        tipo: 'todos',
        status: 'todos',
        unidade: 'todas',
        dataInicio: '',
        dataFim: ''
    });
    const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'ascending' });
    const reportRef = useRef();
    const [emCashValue] = useEmCashValue();
    const [reportGenerated, setReportGenerated] = useState(false);
    const [generatedAt, setGeneratedAt] = useState(null);
    const handleGenerateReport = async () => {
        setLoading(true);
        setReportGenerated(false);
        const { data, error } = await supabase.from('lancamentos').select('*');
        setLoading(false);
        if (error) {
            toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
        }
        else {
            setContas(data || []);
            setReportGenerated(true);
            setGeneratedAt(new Date());
        }
    };
    const getStatus = (conta) => {
        if (conta?.__isCash)
            return 'Saldo em Cash';
        if (conta.status === 'Pago')
            return 'pago';
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(conta.data + 'T00:00:00');
        return vencimento < hoje ? 'atrasado' : 'aberto';
    };
    const emCashApplies = useMemo(() => {
        if (emCashValue <= 0)
            return false;
        const tipoOk = filters.tipo === 'todos' || filters.tipo === 'Entrada';
        const statusOk = filters.status === 'todos' || filters.status === 'atrasado';
        return tipoOk && statusOk;
    }, [emCashValue, filters.tipo, filters.status]);
    const filteredAndSortedContas = useMemo(() => {
        let filtered = [...contas];
        if (filters.tipo !== 'todos')
            filtered = filtered.filter(c => c.tipo === filters.tipo);
        if (filters.status !== 'todos')
            filtered = filtered.filter(c => getStatus(c) === filters.status);
        if (filters.unidade !== 'todas')
            filtered = filtered.filter(c => c.unidade === filters.unidade);
        if (filters.dataInicio)
            filtered = filtered.filter(c => new Date(c.data + 'T00:00:00') >= new Date(filters.dataInicio + 'T00:00:00'));
        if (filters.dataFim)
            filtered = filtered.filter(c => new Date(c.data + 'T00:00:00') <= new Date(filters.dataFim + 'T00:00:00'));
        if (emCashApplies) {
            filtered.push({
                id: 'em-cash',
                data: '',
                tipo: 'Entrada',
                cliente_fornecedor: 'Saldo em Cash',
                descricao: 'Ajuste manual confirmado no Dashboard',
                unidade: 'Todas',
                status: 'cash',
                valor: emCashValue,
                __isCash: true
            });
        }
        filtered.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            if (sortConfig.key === 'valor') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
            }
            if (aValue < bValue)
                return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue)
                return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return filtered;
    }, [contas, filters, sortConfig, emCashApplies, emCashValue]);
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    const formatCurrency = (value) => (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (dateString) => dateString ? format(new Date(dateString + 'T00:00:00'), 'dd/MM/yyyy') : '-';
    const handleDownloadPdf = () => {
        if (!reportGenerated) {
            toast({ title: "Gere o relatório primeiro", description: "Clique em \"Gerar Relatório\" para carregar os dados.", variant: "destructive" });
            return;
        }
        const doc = new jsPDF();
        doc.text("Relatório de Contas", 14, 16);
        doc.autoTable({
            head: [['Data', 'Tipo', 'Cliente/Fornecedor', 'Descrição', 'Unidade', 'Status', 'Valor']],
            body: filteredAndSortedContas.map(c => [
                formatDate(c.data), c.tipo, c.cliente_fornecedor, c.descricao, c.unidade, getStatus(c), formatCurrency(c.valor)
            ]),
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 163, 74] },
        });
        doc.save('relatorio_contas.pdf');
    };
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey)
            return null;
        return sortConfig.direction === 'ascending' ? _jsx(ArrowUp, { className: "w-4 h-4 ml-1" }) : _jsx(ArrowDown, { className: "w-4 h-4 ml-1" });
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "space-y-8", children: [_jsx(Helmet, { children: _jsx("title", { children: "Relat\u00F3rio de Contas - SysFina" }) }), _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Button, { variant: "outline", size: "icon", className: "h-10 w-10", onClick: () => navigate('/relatorios'), children: [_jsx(ArrowLeft, { className: "h-5 w-5" }), _jsx("span", { className: "sr-only", children: "Voltar" })] }), _jsx("h1", { className: "text-3xl font-bold gradient-text", children: "Relat\u00F3rio de Contas" })] }) }), _jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-white flex items-center gap-2", children: [_jsx(Filter, { className: "w-5 h-5" }), "Configura\u00E7\u00E3o do Relat\u00F3rio"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4", children: [_jsxs(Select, { value: filters.tipo, onValueChange: (v) => setFilters(f => ({ ...f, tipo: v })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todos", children: "Todos os Tipos" }), _jsx(SelectItem, { value: "Entrada", children: "Entrada" }), _jsx(SelectItem, { value: "Saida", children: "Sa\u00EDda" })] })] }), _jsxs(Select, { value: filters.status, onValueChange: (v) => setFilters(f => ({ ...f, status: v })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todos", children: "Todos Status" }), _jsx(SelectItem, { value: "aberto", children: "Em Aberto" }), _jsx(SelectItem, { value: "atrasado", children: "Atrasado" }), _jsx(SelectItem, { value: "pago", children: "Pago" })] })] }), _jsxs(Select, { value: filters.unidade, onValueChange: (v) => setFilters(f => ({ ...f, unidade: v })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todas", children: "Todas Unidades" }), _jsx(SelectItem, { value: "CNA Angra dos Reis", children: "CNA Angra dos Reis" }), _jsx(SelectItem, { value: "CNA Mangaratiba", children: "CNA Mangaratiba" }), _jsx(SelectItem, { value: "Casa", children: "Casa" })] })] }), _jsx(Input, { type: "date", value: filters.dataInicio, onChange: (e) => setFilters(f => ({ ...f, dataInicio: e.target.value })) }), _jsx(Input, { type: "date", value: filters.dataFim, onChange: (e) => setFilters(f => ({ ...f, dataFim: e.target.value })) })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:justify-end", children: [_jsx(Button, { onClick: handleGenerateReport, disabled: loading, className: "w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white", children: loading ? 'Gerando...' : 'Gerar Relatório' }), _jsxs(Button, { onClick: handleDownloadPdf, disabled: !reportGenerated || loading, variant: "outline", className: "w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50", children: [_jsx(FileDown, { className: "mr-2 h-4 w-4" }), " Gerar PDF"] })] })] })] }), !reportGenerated && !loading && (_jsx(Card, { className: "glass-card border-dashed border-white/20", children: _jsxs(CardContent, { className: "text-center text-gray-300 py-12", children: ["Escolha os filtros desejados e clique em ", _jsx("span", { className: "font-semibold text-white", children: "\"Gerar Relat\u00F3rio\"" }), " para visualizar os dados."] }) })), loading && (_jsx("div", { className: "flex justify-center py-16", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" }) })), reportGenerated && !loading && (_jsxs("div", { className: "space-y-6", children: [(generatedAt || emCashApplies) && (_jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-300 gap-2", children: [generatedAt && (_jsxs("div", { children: [_jsx("span", { className: "text-white font-medium", children: "Gerado em:" }), " ", format(generatedAt, 'dd/MM/yyyy HH:mm')] })), emCashApplies && (_jsxs("div", { className: "text-green-300 flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " Saldo em cash considerado."] }))] })), emCashApplies && (_jsxs(Card, { className: "glass-card border-green-500/40 bg-green-500/5", children: [_jsxs(CardHeader, { className: "flex flex-row items-center gap-3", children: [_jsx("div", { className: "p-2 rounded-full bg-green-500/20 text-green-300", children: _jsx(CheckCircle, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-sm font-medium text-green-200", children: "Saldo em Cash aplicado" }), _jsx("p", { className: "text-lg font-semibold text-white", children: formatCurrency(emCashValue) })] })] }), _jsx(CardContent, { className: "text-sm text-gray-300", children: "O valor confirmado no Dashboard est\u00E1 inclu\u00EDdo nos totais e listagens de entradas atrasadas deste relat\u00F3rio." })] })), _jsx(Card, { className: "glass-card", children: _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { ref: reportRef, className: "w-full text-sm text-left text-gray-300", children: [_jsx("thead", { className: "text-xs text-gray-400 uppercase bg-white/5", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", className: "px-6 py-3 cursor-pointer", onClick: () => requestSort('data'), children: _jsxs("div", { className: "flex items-center", children: ["Data ", _jsx(SortIcon, { columnKey: "data" })] }) }), _jsx("th", { scope: "col", className: "px-6 py-3 cursor-pointer", onClick: () => requestSort('tipo'), children: _jsxs("div", { className: "flex items-center", children: ["Tipo ", _jsx(SortIcon, { columnKey: "tipo" })] }) }), _jsx("th", { scope: "col", className: "px-6 py-3 cursor-pointer", onClick: () => requestSort('cliente_fornecedor'), children: _jsxs("div", { className: "flex items-center", children: ["Cliente/Fornecedor ", _jsx(SortIcon, { columnKey: "cliente_fornecedor" })] }) }), _jsx("th", { scope: "col", className: "px-6 py-3", children: "Descri\u00E7\u00E3o" }), _jsx("th", { scope: "col", className: "px-6 py-3 cursor-pointer", onClick: () => requestSort('unidade'), children: _jsxs("div", { className: "flex items-center", children: ["Unidade ", _jsx(SortIcon, { columnKey: "unidade" })] }) }), _jsx("th", { scope: "col", className: "px-6 py-3", children: "Status" }), _jsx("th", { scope: "col", className: "px-6 py-3 text-right cursor-pointer", onClick: () => requestSort('valor'), children: _jsxs("div", { className: "flex items-center justify-end", children: ["Valor ", _jsx(SortIcon, { columnKey: "valor" })] }) })] }) }), _jsx("tbody", { children: filteredAndSortedContas.map(conta => (_jsxs("tr", { className: "border-b border-gray-700 hover:bg-white/10", children: [_jsx("td", { className: "px-6 py-4", children: formatDate(conta.data) }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `px-2 py-1 rounded-full text-xs ${conta.tipo === 'Entrada' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`, children: conta.tipo }) }), _jsx("td", { className: "px-6 py-4 font-medium text-white", children: conta.cliente_fornecedor }), _jsx("td", { className: "px-6 py-4", children: conta.descricao }), _jsx("td", { className: "px-6 py-4", children: conta.unidade }), _jsx("td", { className: "px-6 py-4", children: getStatus(conta) }), _jsx("td", { className: `px-6 py-4 text-right font-mono ${conta.tipo === 'Entrada' ? 'text-green-400' : 'text-red-400'}`, children: formatCurrency(conta.valor) })] }, conta.id))) }), _jsx("tfoot", { children: _jsxs("tr", { className: "font-semibold text-white bg-white/5", children: [_jsx("td", { colSpan: 6, className: "px-6 py-3 text-right", children: "Total" }), _jsx("td", { className: "px-6 py-3 text-right font-mono", children: formatCurrency(filteredAndSortedContas.reduce((acc, c) => acc + (c.tipo === 'Entrada' ? c.valor : -c.valor), 0)) })] }) })] }) }) }) })] }))] }));
};
export default RelatorioContas;
