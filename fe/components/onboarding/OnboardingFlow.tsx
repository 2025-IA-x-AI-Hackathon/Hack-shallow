'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import ProgressBar from './ProgressBar';
import FormStep from './FormStep';

const TOTAL_STEPS = 6;

export default function OnboardingFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    occupation: '',
    interests: '',
    goals: '',
    experience: '',
  });

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection('forward');
      setCurrentStep(currentStep + 1);
    } else {
      // 온보딩 완료 후 메인 페이지로 이동
      router.push('/');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <FormStep
            title="이름을 알려주세요"
            description="서비스에서 사용할 이름을 입력해주세요."
            direction={direction}
          >
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이름을 입력하세요"
            />
          </FormStep>
        );
      case 1:
        return (
          <FormStep
            title="나이를 입력해주세요"
            description="더 나은 서비스를 제공하기 위해 필요합니다."
            direction={direction}
          >
            <input
              type="number"
              value={formData.age}
              onChange={(e) => updateFormData('age', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="나이를 입력하세요"
            />
          </FormStep>
        );
      case 2:
        return (
          <FormStep
            title="직업을 알려주세요"
            description="어떤 일을 하고 계신가요?"
            direction={direction}
          >
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => updateFormData('occupation', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="직업을 입력하세요"
            />
          </FormStep>
        );
      case 3:
        return (
          <FormStep
            title="관심사를 알려주세요"
            description="어떤 것에 관심이 있으신가요?"
            direction={direction}
          >
            <textarea
              value={formData.interests}
              onChange={(e) => updateFormData('interests', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="관심사를 입력하세요"
            />
          </FormStep>
        );
      case 4:
        return (
          <FormStep
            title="목표를 설정해주세요"
            description="이 서비스를 통해 달성하고 싶은 목표는 무엇인가요?"
            direction={direction}
          >
            <textarea
              value={formData.goals}
              onChange={(e) => updateFormData('goals', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="목표를 입력하세요"
            />
          </FormStep>
        );
      case 5:
        return (
          <FormStep
            title="경험을 공유해주세요"
            description="관련된 경험이 있으신가요?"
            direction={direction}
          >
            <textarea
              value={formData.experience}
              onChange={(e) => updateFormData('experience', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="경험을 입력하세요"
            />
          </FormStep>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-lg shadow-md">
      <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <div key={currentStep}>
            {renderStep()}
          </div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          이전
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {currentStep === TOTAL_STEPS - 1 ? '완료' : '다음'}
        </button>
      </div>
    </div>
  );
}
