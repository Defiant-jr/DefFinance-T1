import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
const DreGerencial = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [competencias, setCompetencias] = useState([]);
    const [selectedCompetencia, setSelectedCompetencia] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const reportRef = useRef();
    const [reportGenerated, setReportGenerated] = useState(false);
    const [generatedAt, setGeneratedAt] = useState(null);
    useEffect(() => {
        const fetchCompetencias = async () => {
            const { data, error } = await supabase.from('lancamentos').select('data').order('data', { ascending: false });
            if (error || !data || data.length === 0) {
                const now = new Date();
                const currentCompetencia = format(now, 'yyyy-MM');
                setCompetencias([currentCompetencia]);
                setSelectedCompetencia(currentCompetencia);
                return;
            }
            const firstDate = new Date(data[data.length - 1].data + 'T00:00:00');
            const lastDate = new Date(data[0].data + 'T00:00:00');
            const interval = eachMonthOfInterval({ start: firstDate, end: lastDate });
            const comps = interval.map(date => format(date, 'yyyy-MM')).reverse();
            setCompetencias(comps);
            if (comps.length > 0)
                setSelectedCompetencia(comps[0]);
        };
        fetchCompetencias();
    }, []);
    const formatCurrency = (value, isParenthesis = false) => {
        const formatted = (Math.abs(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return value < 0 && isParenthesis ? `(${formatted})` : formatted;
    };
    const handleGenerateReport = async () => {
        if (!selectedCompetencia) {
            toast({ title: "Selecione uma competência", variant: "destructive" });
            return;
        }
        setLoading(true);
        setReportData(null);
        setReportGenerated(false);
        const [year, month] = selectedCompetencia.split('-');
        const yearNumber = Number(year);
        const monthNumber = Number(month);
        const firstDay = startOfMonth(new Date(yearNumber, monthNumber - 1));
        const lastDay = endOfMonth(new Date(yearNumber, monthNumber - 1));
        const { data, error } = await supabase
            .from('lancamentos')
            .select('tipo, valor, obs')
            .eq('status', 'Pago')
            .gte('datapag', format(firstDay, 'yyyy-MM-dd'))
            .lte('datapag', format(lastDay, 'yyyy-MM-dd'));
        setLoading(false);
        if (error) {
            toast({ title: "Erro ao buscar dados", description: error.message, variant: "destructive" });
            return;
        }
        const receitaBruta = data.filter(d => d.tipo === 'Entrada').reduce((acc, item) => acc + item.valor, 0);
        const custos = data.filter(d => d.tipo === 'Saida' && d.obs?.toLowerCase().includes('custo')).reduce((acc, item) => acc + item.valor, 0);
        const despesas = data.filter(d => d.tipo === 'Saida' && !d.obs?.toLowerCase().includes('custo')).reduce((acc, item) => acc + item.valor, 0);
        const lucroBruto = receitaBruta - custos;
        const resultado = lucroBruto - despesas;
        setReportData({
            receitaBruta,
            custos,
            lucroBruto,
            despesas,
            resultado,
            competencia: format(new Date(yearNumber, monthNumber - 1), 'MMMM/yyyy', { locale: ptBR })
        });
        setReportGenerated(true);
        setGeneratedAt(new Date());
    };
    const handleDownloadPdf = () => {
        const input = reportRef.current;
        if (!input)
            return;
        html2canvas(input, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / imgHeight;
            const pdfHeight = pdfWidth / ratio;
            pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 10);
            pdf.save(`dre_${selectedCompetencia}.pdf`);
        });
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "space-y-8", children: [_jsx(Helmet, { children: _jsx("title", { children: "DRE Gerencial - SysFina" }) }), _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Button, { variant: "outline", size: "icon", className: "h-10 w-10", onClick: () => navigate('/relatorios'), children: [_jsx(ArrowLeft, { className: "h-5 w-5" }), _jsx("span", { className: "sr-only", children: "Voltar" })] }), _jsx("h1", { className: "text-3xl font-bold gradient-text", children: "DRE Gerencial" })] }) }), _jsxs(Card, { className: "glass-card", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-white", children: "Configura\u00E7\u00E3o do Relat\u00F3rio" }) }), _jsxs(CardContent, { className: "flex flex-col gap-4 md:flex-row md:items-end md:justify-between", children: [_jsx("div", { className: "w-full md:w-1/2", children: _jsxs(Select, { onValueChange: setSelectedCompetencia, value: selectedCompetencia, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecione a compet\u00EAncia" }) }), _jsx(SelectContent, { children: competencias.map(comp => _jsx(SelectItem, { value: comp, children: format(new Date(comp + '-02'), 'MMMM/yyyy', { locale: ptBR }) }, comp)) })] }) }), _jsxs("div", { className: "w-full md:w-auto flex flex-col sm:flex-row gap-3 md:justify-end", children: [_jsx(Button, { onClick: handleGenerateReport, disabled: loading || !selectedCompetencia, className: "w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white", children: loading ? 'Gerando...' : 'Gerar Relatório' }), _jsxs(Button, { variant: "outline", onClick: handleDownloadPdf, disabled: !reportGenerated || loading, className: "w-full sm:w-auto border-blue-600 text-blue-300 hover:bg-blue-500/10", children: [_jsx(FileDown, { className: "mr-2 h-4 w-4" }), " Gerar PDF"] })] })] })] }), !reportGenerated && !loading && (_jsx(Card, { className: "glass-card border-dashed border-white/20", children: _jsxs(CardContent, { className: "text-center text-gray-300 py-10", children: ["Escolha a compet\u00EAncia desejada e clique em ", _jsx("span", { className: "text-white font-semibold", children: "\"Gerar Relat\u00F3rio\"" }), " para visualizar o DRE."] }) })), loading && (_jsx("div", { className: "flex justify-center py-16", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" }) })), reportGenerated && reportData && !loading && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, children: [_jsx("div", { className: "text-sm text-gray-400 text-right mb-2", children: generatedAt && (_jsxs("span", { children: [_jsx("span", { className: "text-white font-medium", children: "Gerado em:" }), " ", format(generatedAt, 'dd/MM/yyyy HH:mm')] })) }), _jsxs("div", { ref: reportRef, className: "bg-white text-slate-800 p-6 rounded-lg", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Demonstrativo de Resultado do Exerc\u00EDcio" }), _jsx("p", { className: "text-lg capitalize", children: reportData.competencia })] }), _jsx("table", { className: "dre-table", children: _jsxs("tbody", { children: [_jsxs("tr", { className: "header-row", children: [_jsx("td", { children: "Descri\u00E7\u00E3o" }), _jsx("td", { className: "text-right", children: "Valor" })] }), _jsxs("tr", { children: [_jsx("td", { children: "(+) Receita Operacional Bruta" }), _jsx("td", { className: "text-right font-mono", children: formatCurrency(reportData.receitaBruta) })] }), _jsxs("tr", { className: "total-row", children: [_jsx("td", { children: "(=) Lucro Bruto" }), _jsx("td", { className: "text-right font-mono", children: formatCurrency(reportData.lucroBruto) })] }), _jsxs("tr", { children: [_jsx("td", { children: "(-) Custos" }), _jsx("td", { className: "text-right font-mono", children: formatCurrency(reportData.custos, true) })] }), _jsxs("tr", { children: [_jsx("td", { children: "(-) Despesas Operacionais" }), _jsx("td", { className: "text-right font-mono", children: formatCurrency(reportData.despesas, true) })] }), _jsxs("tr", { className: `total-row ${reportData.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`, children: [_jsx("td", { children: "(=) Resultado L\u00EDquido do Per\u00EDodo" }), _jsx("td", { className: "text-right font-mono", children: formatCurrency(reportData.resultado, true) })] })] }) })] })] }))] }));
};
export default DreGerencial;
