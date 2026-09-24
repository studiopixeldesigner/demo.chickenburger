'use server';
import { cookies } from 'next/headers';

export async function loginAction(password: string) {
  const targetPassword = process.env.ADMIN_PASSWORD;

  if (targetPassword && password === targetPassword) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 24 heures
      sameSite: 'lax',
    });
    return { success: true };
  }
  return { success: false };
}

export async function verifyAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    throw new Error('Non autorisé : session invalide ou absente.');
  }
}

export async function checkAuthAction(): Promise<{ authenticated: boolean }> {
  try {
    await verifyAuth();
    return { authenticated: true };
  } catch {
    return { authenticated: false };
  }
}