import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
const Financeiro = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const cards = [
        {
            title: 'Baixa',
            description: 'Registrar baixas financeiras rapidamente.',
            icon: Wallet,
            implemented: false,
        },
        {
            title: 'Bordero de Baixa',
            description: 'Organize e consolide baixas em borderos.',
            icon: Receipt,
            implemented: false,
        },
    ];
    const handleCardClick = (implemented) => {
        if (!implemented) {
            toast({
                title: 'Em breve!',
                description: 'Estamos trabalhando para liberar este recurso.',
            });
        }
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "space-y-8", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "Financeiro - SysFina" }), _jsx("meta", { name: "description", content: "Central de a\u00E7\u00F5es financeiras." })] }), _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs(Button, { variant: "outline", size: "icon", className: "h-10 w-10", onClick: () => navigate(-1), children: [_jsx(ArrowLeft, { className: "h-5 w-5" }), _jsx("span", { className: "sr-only", children: "Voltar" })] }), _jsx("h1", { className: "text-3xl font-bold gradient-text", children: "Financeiro" })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: cards.map((card) => {
                    const Icon = card.icon;
                    return (_jsx(Card, { className: `glass-card cursor-pointer transition-colors ${card.implemented ? 'hover:border-blue-500' : 'hover:border-white/10'}`, onClick: () => handleCardClick(card.implemented), children: _jsxs(CardContent, { className: "p-6 flex flex-col gap-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-3 rounded-lg bg-white/10 text-gray-300", children: _jsx(Icon, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-white", children: card.title }), _jsx("p", { className: "text-sm text-gray-400", children: card.description })] })] }), !card.implemented && (_jsx("span", { className: "text-xs font-medium text-gray-400 uppercase tracking-wide", children: "Em desenvolvimento" }))] }) }, card.title));
                }) })] }));
};
export default Financeiro;
