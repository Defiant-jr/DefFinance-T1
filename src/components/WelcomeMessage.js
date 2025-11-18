import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const WelcomeMessage = () => {
    return (_jsxs(motion.p, { className: 'text-xl md:text-2xl text-white max-w-2xl mx-auto', initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5, delay: 0.5 }, children: ["Hello there! I'm ", _jsx("span", { className: 'font-semibold text-purple-300', children: "Horizons" }), ", your AI coding companion. I'm here to help you build amazing web application!"] }));
};
export default WelcomeMessage;
