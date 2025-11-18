import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, TrendingUp, ArrowLeft, FileClock, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
const Relatorios = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const handleNavigation = (path, implemented = true) => {
        if (implemented) {
            navigate(path);
        }
        else {
            toast({
                title: "Em breve!",
                description: "🚧 Este recurso ainda não foi implementado, mas estará disponível em breve! 🚀",
            });
        }
    };
    const reportOptions = [
        {
            title: "Fluxo de Caixa Detalhado",
            icon: BarChart3,
            description: "Análise detalhada de entradas e saídas por período.",
            action: () => handleNavigation('/relatorios/fluxo-caixa-detalhado'),
            implemented: true,
        },
        {
            title: "DRE Gerencial",
            icon: PieChart,
            description: "Demonstrativo de Resultado do Exercício para visão de lucro.",
            action: () => handleNavigation('/relatorios/dre-gerencial'),
            implemented: true,
        },
        {
            title: "Contas a Pagar/Receber",
            icon: TrendingUp,
            description: "Relatório completo de contas em aberto, pagas e vencidas.",
            action: () => handleNavigation('/relatorios/contas'),
            implemented: true,
        },
        {
            title: "Acompanhamento de Fechamento",
            icon: FileClock,
            description: "Acompanhe o saldo mensal com entradas e saidas abertas.",
            action: () => handleNavigation('/relatorios/fechamento'),
            implemented: true,
        },
        {
            title: "Impressão de DOC",
            icon: Printer,
            description: "Gere documentos DOC formatados para impressão.",
            action: () => handleNavigation('/relatorios/impressao-doc'),
            implemented: true,
        }
    ];
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "space-y-8", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Central de Relat\u00F3rios - SysFina" }), _jsx("meta", { name: "description", content: "Gere relat\u00F3rios financeiros detalhados." })] }), _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Button, { variant: "outline", size: "icon", className: "h-10 w-10", onClick: () => navigate('/'), children: [_jsx(ArrowLeft, { className: "h-5 w-5" }), _jsx("span", { className: "sr-only", children: "Voltar" })] }), _jsx("h1", { className: "text-3xl font-bold gradient-text", children: "Central de Relat\u00F3rios" })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: reportOptions.map((option, index) => {
                    const Icon = option.icon;
                    return (_jsx(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.2 + index * 0.1 }, children: _jsxs(Card, { className: "glass-card h-full flex flex-col justify-between hover:border-blue-500 transition-colors duration-300 cursor-pointer", onClick: option.action, children: [_jsxs(CardContent, { className: "p-6 flex flex-col items-center text-center", children: [_jsx("div", { className: "p-4 bg-blue-500/10 rounded-full mb-4", children: _jsx(Icon, { className: `w-12 h-12 ${option.implemented ? 'text-blue-400' : 'text-gray-500'}` }) }), _jsx("h2", { className: `text-xl font-semibold mb-2 ${option.implemented ? 'text-white' : 'text-gray-400'}`, children: option.title }), _jsx("p", { className: "text-gray-400 text-sm flex-grow", children: option.description })] }), _jsx("div", { className: "p-4 pt-0", children: _jsx(Button, { className: "w-full bg-blue-600 hover:bg-blue-700", disabled: !option.implemented, children: option.implemented ? 'Gerar Relatório' : 'Em Breve' }) })] }) }, index));
                }) })] }));
};
export default Relatorios;
