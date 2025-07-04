'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.replace('/login');
        return;
      }

      // Verifica se o token tem formato JWT válido (3 partes separadas por ponto)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        localStorage.removeItem('authToken');
        router.replace('/login');
        return;
      }

      // Se chegou até aqui, o token existe e tem formato válido
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Será redirecionado para /login
  }

  return <>{children}</>;
} 