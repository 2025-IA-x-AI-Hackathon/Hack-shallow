'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import ProgressBar from './ProgressBar';
import FormStep from './FormStep';
import { DOG_IMAGES } from '@/lib/dogImages';

const TOTAL_STEPS = 6;

export default function OnboardingFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    birth_date: '',
    sex: 'unknown' as 'male' | 'female' | 'unknown',
    neutered: false,
    weight_kg: '',
  });

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection('forward');
      setCurrentStep(currentStep + 1);
    } else {
      // 온보딩 완료 - 반려견 정보 저장
      setIsLoading(true);
      setError('');

      try {
        await api.createDog({
          name: formData.name,
          breed: formData.breed || undefined,
          birth_date: formData.birth_date || undefined,
          sex: formData.sex,
          neutered: formData.neutered,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        });
        router.push('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : '반려견 정보 저장에 실패했습니다.');
        setIsLoading(false);
      }
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

  // Enter 키로 다음 단계 진행
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || isLoading) return;
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      const type = (target as HTMLInputElement)?.type;
      // textarea는 제외, 입력 중에 줄바꿈 방지
      if (tag === 'textarea') return;
      // step 0에서 이름이 비어 있으면 진행 금지
      if (currentStep === 0 && !formData.name) return;
      e.preventDefault();
      handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentStep, formData.name, isLoading]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <FormStep
            title="반려견의 이름을 알려주세요"
            description="반려견의 이름을 입력해주세요."
            direction={direction}
          >
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 뽀삐"
              required
            />
          </FormStep>
        );
      case 1:
        return (
          <FormStep
            title="반려견의 품종을 선택해주세요"
            description="선택하지 않으셔도 괜찮습니다."
            direction={direction}
          >
            <select
              value={formData.breed}
              onChange={(e) => updateFormData('breed', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">선택하지 않음</option>
              {DOG_IMAGES.map((dog) => (
                <option key={dog.label} value={dog.label}>
                  {dog.label}
                </option>
              ))}
            </select>
          </FormStep>
        );
      case 2:
        return (
          <FormStep
            title="반려견의 생년월일을 알려주세요"
            description="정확한 날짜를 모르시면 대략적인 날짜를 입력해주세요."
            direction={direction}
          >
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => updateFormData('birth_date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </FormStep>
        );
      case 3:
        return (
          <FormStep
            title="반려견의 성별을 선택해주세요"
            description="성별을 선택해주세요."
            direction={direction}
          >
            <div className="space-y-3">
              {[
                { value: 'male', label: '남아' },
                { value: 'female', label: '여아' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.sex === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="sex"
                    value={option.value}
                    checked={formData.sex === option.value}
                    onChange={(e) => updateFormData('sex', e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-lg">{option.label}</span>
                </label>
              ))}
            </div>
          </FormStep>
        );
      case 4:
        return (
          <FormStep
            title="중성화 수술을 받았나요?"
            description="중성화 여부를 선택해주세요."
            direction={direction}
          >
            <div className="space-y-3">
              {[
                { value: true, label: '예, 받았습니다' },
                { value: false, label: '아니요, 받지 않았습니다' },
              ].map((option) => {
                const isSelected =
                  (formData.neutered === option.value) ||
                  (String(formData.neutered) === option.value.toString());
                return (
                <label
                  key={option.value.toString()}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="neutered"
                    value={option.value.toString()}
                    checked={isSelected}
                    onChange={() => updateFormData('neutered', option.value.toString())}
                    className="mr-3"
                  />
                  <span className="text-lg">{option.label}</span>
                </label>
              );})}
            </div>
          </FormStep>
        );
      case 5:
        return (
          <FormStep
            title="반려견의 체중을 알려주세요"
            description="체중을 kg 단위로 입력해주세요. (선택사항)"
            direction={direction}
          >
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.weight_kg}
              onChange={(e) => updateFormData('weight_kg', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 5.5"
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

      {error && (
        <div className="text-red-500 text-sm text-center">{error}</div>
      )}

      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0 || isLoading}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          이전
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading || (currentStep === 0 && !formData.name)}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '저장 중...' : currentStep === TOTAL_STEPS - 1 ? '완료' : '다음'}
        </button>
      </div>
    </div>
  );
}
