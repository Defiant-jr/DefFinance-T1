import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
const columns = [
    'Data',
    'Tipo',
    'Unidade',
    'Cliente/Fornecedor',
    'Descrição',
    'Valor',
    'Status',
    'Aluno',
    'Parcela',
    'Desc. Pontual',
    'Observações',
    'Data Pag.'
];
const ImpressaoDoc = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [lancamentos, setLancamentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [filters, setFilters] = useState({
        tipo: 'todos',
        status: 'todos',
        unidade: 'todas',
        dataInicio: '',
        dataFim: ''
    });
    const [reportGenerated, setReportGenerated] = useState(false);
    const [generatedAt, setGeneratedAt] = useState(null);
    const handleGenerateReport = async () => {
        setLoading(true);
        setReportGenerated(false);
        const { data, error } = await supabase
            .from('lancamentos')
            .select('*')
            .order('data', { ascending: true });
        setLoading(false);
        if (error) {
            toast({ title: 'Erro', description: 'Não foi possível carregar os lançamentos.', variant: 'destructive' });
        }
        else {
            setLancamentos(data || []);
            setReportGenerated(true);
            setGeneratedAt(new Date());
        }
    };
    const getStatus = (conta) => {
        if (conta.status === 'Pago')
            return 'pago';
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const vencimento = new Date(conta.data + 'T00:00:00');
        return vencimento < hoje ? 'atrasado' : 'aberto';
    };
    const filteredLancamentos = useMemo(() => {
        let filtered = [...lancamentos];
        if (filters.tipo !== 'todos') {
            filtered = filtered.filter((item) => item.tipo === filters.tipo);
        }
        if (filters.status !== 'todos') {
            filtered = filtered.filter((item) => getStatus(item) === filters.status);
        }
        if (filters.unidade !== 'todas') {
            filtered = filtered.filter((item) => item.unidade === filters.unidade);
        }
        if (filters.dataInicio) {
            const start = new Date(filters.dataInicio + 'T00:00:00');
            filtered = filtered.filter((item) => new Date(item.data + 'T00:00:00') >= start);
        }
        if (filters.dataFim) {
            const end = new Date(filters.dataFim + 'T00:00:00');
            filtered = filtered.filter((item) => new Date(item.data + 'T00:00:00') <= end);
        }
        return filtered;
    }, [lancamentos, filters]);
    useEffect(() => {
        if (selectedId && !filteredLancamentos.some((item) => item.id === selectedId)) {
            setSelectedId(null);
        }
    }, [filteredLancamentos, selectedId]);
    const formatCurrency = (value) => (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (value) => (value ? format(new Date(value + 'T00:00:00'), 'dd/MM/yyyy') : '-');
    const handleGeneratePDF = () => {
        if (!reportGenerated) {
            toast({ title: 'Gere o relatório primeiro', description: 'Clique em "Gerar Relatório" para carregar os lançamentos.', variant: 'destructive' });
            return;
        }
        if (!selectedId) {
            toast({ title: 'Selecione um lançamento', description: 'Escolha um registro para gerar o PDF.', variant: 'destructive' });
            return;
        }
        const item = filteredLancamentos.find((lanc) => lanc.id === selectedId);
        if (!item) {
            toast({ title: 'Lançamento inválido', description: 'O lançamento selecionado não está disponível.' });
            return;
        }
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 40;
        const sectionWidth = pageWidth - marginX * 2;
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        const drawSectionHeader = (y, title) => {
            doc.setFillColor(238, 242, 255);
            doc.rect(marginX, y, sectionWidth, 28, 'F');
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(23, 37, 84);
            doc.text(title, marginX + 10, y + 18);
            doc.setTextColor(0, 0, 0);
            return y + 40;
        };
        const drawRow = (startY, label, value) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(label, marginX, startY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            const text = doc.splitTextToSize(value || '-', sectionWidth);
            doc.text(text, marginX, startY + 16);
            return startY + 16 + text.length * 14;
        };
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Impressão de DOC - Lançamento', marginX, 60);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, marginX, 80);
        doc.text(`Seleção: ${item.cliente_fornecedor || item.descricao || `ID ${item.id}`}`, marginX, 95);
        let currentY = 120;
        currentY = drawSectionHeader(currentY, 'Detalhes do Lançamento');
        const detalheRows = [
            ['Data', formatDate(item.data)],
            ['Tipo', item.tipo || '-'],
            ['Unidade', item.unidade || '-'],
            ['Valor', formatCurrency(item.valor)],
            ['Status', item.status || '-'],
        ];
        detalheRows.forEach(([label, value]) => {
            currentY = drawRow(currentY, label, value) + 8;
        });
        currentY = drawSectionHeader(currentY, 'Cliente / Aluno');
        const clienteRows = [
            ['Cliente / Fornecedor', item.cliente_fornecedor || '-'],
            ['Aluno', item.aluno || '-'],
            ['Parcela', item.parcela || '-'],
        ];
        clienteRows.forEach(([label, value]) => {
            currentY = drawRow(currentY, label, value) + 8;
        });
        currentY = drawSectionHeader(currentY, 'Descrição e Observações');
        const descricaoRows = [
            ['Descrição', item.descricao || '-'],
            ['Observações', item.obs || '-'],
            ['Desconto Pontual', item.desc_pontual != null ? formatCurrency(item.desc_pontual) : '-'],
            ['Data de Pagamento', item.datapag ? formatDate(item.datapag) : '-'],
        ];
        descricaoRows.forEach(([label, value]) => {
            currentY = drawRow(currentY, label, value) + 8;
        });
        const signatureSections = [
            'Assinatura - Responsável pela Impressão',
            'Assinatura - Liberação'
        ];
        const minSpaceForSignatures = 140;
        if (currentY > pageHeight - minSpaceForSignatures) {
            doc.addPage();
            currentY = 80;
        }
        const signatureY = pageHeight - 120;
        const signatureGap = 40;
        const signatureWidth = (sectionWidth - signatureGap) / signatureSections.length;
        signatureSections.forEach((label, index) => {
            const sectionX = marginX + index * (signatureWidth + signatureGap);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(label, sectionX, signatureY);
            const lineEndX = sectionX + signatureWidth - 20;
            doc.line(sectionX, signatureY + 25, lineEndX, signatureY + 25);
            doc.setFont('helvetica', 'normal');
            doc.text('Data:', sectionX, signatureY + 45);
            doc.line(sectionX + 40, signatureY + 45, sectionX + 140, signatureY + 45);
        });
        doc.save(`impressao-doc-${item.id}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`);
    };
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "space-y-8", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Impress\u00E3o de DOC - SysFina" }), _jsx("meta", { name: "description", content: "Relat\u00F3rio completo dos lan\u00E7amentos para impress\u00E3o em DOC." })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Button, { variant: "outline", size: "icon", className: "h-10 w-10", onClick: () => navigate('/relatorios'), children: [_jsx(ArrowLeft, { className: "h-5 w-5" }), _jsx("span", { className: "sr-only", children: "Voltar" })] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold gradient-text", children: "Impress\u00E3o de DOC" }), _jsx("p", { className: "text-gray-400", children: "Visualize e imprima todos os lan\u00E7amentos" })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { onClick: handleGenerateReport, disabled: loading, className: "bg-blue-600 hover:bg-blue-700 text-white", children: [loading && _jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), loading ? 'Gerando...' : 'Gerar Relatório'] }), _jsxs(Button, { onClick: handleGeneratePDF, disabled: !reportGenerated || loading, variant: "outline", className: "border-blue-500 text-blue-300 hover:bg-blue-500/10", children: [_jsx(FileDown, { className: "h-4 w-4 mr-2" }), "Gerar PDF"] })] })] }), _jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-white", children: "Filtros" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-2 block", children: "Tipo" }), _jsxs(Select, { value: filters.tipo, onValueChange: (value) => handleFilterChange('tipo', value), children: [_jsx(SelectTrigger, { className: "bg-white/10 border-white/20 text-white", children: _jsx(SelectValue, { placeholder: "Todos" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todos", children: "Todos" }), _jsx(SelectItem, { value: "Entrada", children: "Entrada" }), _jsx(SelectItem, { value: "Saida", children: "Sa\u00EDda" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-2 block", children: "Status" }), _jsxs(Select, { value: filters.status, onValueChange: (value) => handleFilterChange('status', value), children: [_jsx(SelectTrigger, { className: "bg-white/10 border-white/20 text-white", children: _jsx(SelectValue, { placeholder: "Todos" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todos", children: "Todos" }), _jsx(SelectItem, { value: "aberto", children: "Em Aberto" }), _jsx(SelectItem, { value: "atrasado", children: "Atrasado" }), _jsx(SelectItem, { value: "pago", children: "Pago" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-2 block", children: "Unidade" }), _jsxs(Select, { value: filters.unidade, onValueChange: (value) => handleFilterChange('unidade', value), children: [_jsx(SelectTrigger, { className: "bg-white/10 border-white/20 text-white", children: _jsx(SelectValue, { placeholder: "Todas" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todas", children: "Todas" }), _jsx(SelectItem, { value: "CNA Angra dos Reis", children: "CNA Angra dos Reis" }), _jsx(SelectItem, { value: "CNA Mangaratiba", children: "CNA Mangaratiba" }), _jsx(SelectItem, { value: "Casa", children: "Casa" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-2 block", children: "Data In\u00EDcio" }), _jsx(Input, { type: "date", value: filters.dataInicio, onChange: (event) => handleFilterChange('dataInicio', event.target.value), className: "bg-white/10 border-white/20 text-white" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm text-gray-300 mb-2 block", children: "Data Fim" }), _jsx(Input, { type: "date", value: filters.dataFim, onChange: (event) => handleFilterChange('dataFim', event.target.value), className: "bg-white/10 border-white/20 text-white" })] })] }) })] }), !reportGenerated && !loading && (_jsx(Card, { className: "glass-card border-dashed border-white/20", children: _jsxs(CardContent, { className: "text-center text-gray-300 py-12", children: ["Utilize os filtros acima e clique em ", _jsx("span", { className: "font-semibold text-white", children: "\"Gerar Relat\u00F3rio\"" }), " para listar os lan\u00E7amentos dispon\u00EDveis."] }) })), loading && (_jsx("div", { className: "flex justify-center py-16", children: _jsx(Loader2, { className: "h-10 w-10 text-blue-400 animate-spin" }) })), reportGenerated && !loading && (_jsxs(_Fragment, { children: [generatedAt && (_jsxs("div", { className: "text-sm text-gray-400 text-right", children: [_jsx("span", { className: "text-white font-medium", children: "Gerado em:" }), " ", format(generatedAt, 'dd/MM/yyyy HH:mm')] })), _jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-white", children: "Lan\u00E7amentos registrados" }) }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-gray-200", children: [_jsx("th", { className: "px-3 py-2 border-b border-white/10", children: "Selecionar" }), columns.map((column) => (_jsx("th", { className: "px-3 py-2 border-b border-white/10 whitespace-nowrap", children: column }, column)))] }) }), _jsx("tbody", { children: filteredLancamentos.length ? (filteredLancamentos.map((item) => (_jsxs("tr", { className: "border-b border-white/5 hover:bg-white/5", children: [_jsx("td", { className: "px-3 py-2", children: _jsx("input", { type: "checkbox", checked: selectedId === item.id, onChange: () => setSelectedId((prev) => (prev === item.id ? null : item.id)), className: "h-4 w-4 accent-blue-500" }) }), _jsx("td", { className: "px-3 py-2", children: formatDate(item.data) }), _jsx("td", { className: "px-3 py-2", children: item.tipo || '-' }), _jsx("td", { className: "px-3 py-2", children: item.unidade || '-' }), _jsx("td", { className: "px-3 py-2", children: item.cliente_fornecedor || '-' }), _jsx("td", { className: "px-3 py-2", children: item.descricao || '-' }), _jsx("td", { className: "px-3 py-2 font-mono text-green-300", children: formatCurrency(item.valor) }), _jsx("td", { className: "px-3 py-2", children: item.status || '-' }), _jsx("td", { className: "px-3 py-2", children: item.aluno || '-' }), _jsx("td", { className: "px-3 py-2", children: item.parcela || '-' }), _jsx("td", { className: "px-3 py-2", children: item.desc_pontual != null ? formatCurrency(item.desc_pontual) : '-' }), _jsx("td", { className: "px-3 py-2", children: item.obs || '-' }), _jsx("td", { className: "px-3 py-2", children: item.datapag ? formatDate(item.datapag) : '-' })] }, item.id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: columns.length + 1, className: "text-center py-10 text-gray-400", children: "Nenhum lan\u00E7amento encontrado." }) })) })] }) }) })] })] }))] }));
};
export default ImpressaoDoc;
