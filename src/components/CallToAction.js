import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const CallToAction = () => {
    return (_jsx(motion.p, { className: 'text-md text-white max-w-lg mx-auto', initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5, delay: 0.8 }, children: "Let's turn your ideas into reality." }));
};
export default CallToAction;
