'use client';

import { motion } from 'framer-motion';

interface FormStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  direction?: 'forward' | 'backward';
}

export default function FormStep({
  title,
  description,
  children,
  direction = 'forward'
}: FormStepProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: direction === 'forward' ? 50 : -50
      }}
      animate={{
        opacity: 1,
        x: 0
      }}
      exit={{
        opacity: 0,
        x: direction === 'forward' ? -50 : 50
      }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </motion.div>
  );
}
