import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Cadastros from '@/pages/Cadastros';
import ContasPagar from '@/pages/ContasPagar';
import ContasReceber from '@/pages/ContasReceber';
import Dashboard from '@/pages/Dashboard';
import DreGerencial from '@/pages/DreGerencial';
import Financeiro from '@/pages/Financeiro';
import FluxoCaixa from '@/pages/FluxoCaixa';
import FluxoCaixaDetalhado from '@/pages/FluxoCaixaDetalhado';
import ImpressaoDoc from '@/pages/ImpressaoDoc';
import Lancamentos from '@/pages/Lancamentos';
import Login from '@/pages/Login';
import RelatorioContas from '@/pages/RelatorioContas';
import RelatorioFechamento from '@/pages/RelatorioFechamento';
import Relatorios from '@/pages/Relatorios';
import SignUp from '@/pages/SignUp';
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "flex justify-center items-center h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500" }) }));
    }
    return user ? children : _jsx(Navigate, { to: "/login" });
};
function App() {
    return (_jsx(Router, { children: _jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900", children: [_jsxs(Helmet, { children: [_jsx("title", { children: "SysFina v1.0.0 - Dashboard Financeiro" }), _jsx("meta", { name: "description", content: "Dashboard moderno para controle de contas a pagar e receber com integra\u00E7\u00E3o ao Google Sheets" })] }), _jsx("main", { className: "container mx-auto px-4 py-8", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/signup", element: _jsx(SignUp, {}) }), _jsx(Route, { path: "/", element: _jsx(PrivateRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/contas-receber", element: _jsx(PrivateRoute, { children: _jsx(ContasReceber, {}) }) }), _jsx(Route, { path: "/contas-pagar", element: _jsx(PrivateRoute, { children: _jsx(ContasPagar, {}) }) }), _jsx(Route, { path: "/fluxo-caixa", element: _jsx(PrivateRoute, { children: _jsx(FluxoCaixa, {}) }) }), _jsx(Route, { path: "/financeiro", element: _jsx(PrivateRoute, { children: _jsx(Financeiro, {}) }) }), _jsx(Route, { path: "/lancamentos", element: _jsx(PrivateRoute, { children: _jsx(Lancamentos, {}) }) }), _jsx(Route, { path: "/relatorios", element: _jsx(PrivateRoute, { children: _jsx(Relatorios, {}) }) }), _jsx(Route, { path: "/cadastros", element: _jsx(PrivateRoute, { children: _jsx(Cadastros, {}) }) }), _jsx(Route, { path: "/relatorios/fluxo-caixa-detalhado", element: _jsx(PrivateRoute, { children: _jsx(FluxoCaixaDetalhado, {}) }) }), _jsx(Route, { path: "/relatorios/dre-gerencial", element: _jsx(PrivateRoute, { children: _jsx(DreGerencial, {}) }) }), _jsx(Route, { path: "/relatorios/fechamento", element: _jsx(PrivateRoute, { children: _jsx(RelatorioFechamento, {}) }) }), _jsx(Route, { path: "/relatorios/contas", element: _jsx(PrivateRoute, { children: _jsx(RelatorioContas, {}) }) }), _jsx(Route, { path: "/relatorios/impressao-doc", element: _jsx(PrivateRoute, { children: _jsx(ImpressaoDoc, {}) }) })] }) }), _jsx(Toaster, {})] }) }));
}
export default App;
