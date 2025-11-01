'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { observer } from 'mobx-react-lite';
import { authStore } from '@/stores/authStore';
import { api } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { access_token, userId } = await api.login(username, password);
      authStore.login(access_token, userId, username);

      // 사용자의 강아지 목록 확인
      const dogs = await api.getDogs(userId);

      // 강아지가 있으면 채팅 페이지로, 없으면 온보딩 페이지로
      if (dogs.length > 0) {
        router.push('/');
      } else {
        router.push('/onboarding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="text-gray-600 mt-2">계정에 로그인하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            사용자 이름
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div className="text-center text-sm text-gray-600">
        아직 계정이 없으신가요?{' '}
        <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
          회원가입
        </Link>
      </div>
    </div>
  );
}

export default observer(LoginForm);
