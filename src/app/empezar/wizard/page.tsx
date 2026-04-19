import { redirect } from 'next/navigation';
import { createSsrClient } from '@/lib/supabase/ssr';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EmpezarWizardPage() {
  const supabase = await createSsrClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/empezar/wizard');
  }

  return (
    <div className='flex min-h-dvh flex-col items-center justify-center bg-ink-950 px-4'>
      {/* Glows */}
      <div className='pointer-events-none fixed -left-40 top-20 h-96 w-96 rounded-full bg-rose-600/10 blur-[120px]' />
      <div className='pointer-events-none fixed -right-32 bottom-10 h-80 w-80 rounded-full bg-red-600/10 blur-[100px]' />

      <div className='relative w-full max-w-md'>
        {/* Logo */}
        <div className='mb-10 text-center'>
          <span className='font-future text-2xl font-semibold tracking-tight text-white'>
            Bookido
          </span>
        </div>

        {/* Card */}
        <div className='rounded-2xl border border-white/[0.08] bg-ink-900/60 p-10 backdrop-blur-sm text-center'>
          {/* Icon */}
          <div className='mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600/20 border border-rose-600/20'>
            <svg
              className='h-7 w-7 text-rose-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={1.8}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
              />
            </svg>
          </div>

          <h1 className='mb-2 text-2xl font-semibold text-white'>
            Tu wizard está listo
          </h1>
          <p className='mb-1 text-sm text-zinc-400'>Bienvenido,</p>
          <p className='mb-8 text-sm font-medium text-rose-400 truncate'>
            {user.email}
          </p>

          <p className='mb-8 text-sm text-zinc-400 leading-relaxed'>
            Configura tu agenda en menos de 10 minutos: agrega tus servicios,
            horarios y empieza a recibir reservaciones.
          </p>

          {/* CTA */}
          <a
            href='https://bookido.online/nuevo'
            className='block w-full rounded-xl bg-rose-600 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-95'
          >
            Comenzar configuración →
          </a>

          <div className='mt-6'>
            <Link
              href='/panel'
              className='text-sm text-zinc-500 hover:text-zinc-300 transition'
            >
              Ir al panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
