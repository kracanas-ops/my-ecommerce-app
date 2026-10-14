import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import AnimatedLink from './AnimatedLink';
import MotionButton from './MotionButton';
import MotionInput from './MotionInput';
import { floatIn, spring } from './motion';
import { useAuth } from './useAuth';

export default function Auth({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-5 py-16">
      <motion.section
        className="glass-panel w-full max-w-md rounded-3xl p-7 sm:p-9"
        initial="hidden"
        animate="show"
        variants={floatIn}
        whileHover={{ y: -2, boxShadow: '0 30px 90px rgba(99, 75, 185, 0.2)' }}
        transition={spring}
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">{isRegister ? 'Join the community' : 'Welcome back'}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{isRegister ? 'Create your account' : 'Sign in to Forma'}</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          {isRegister ? 'Your next favorite thing is just around the corner.' : 'Pick up right where you left off.'}
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {isRegister && (
            <label className="block space-y-2 text-sm text-zinc-300">
              Name
              <MotionInput autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={80} />
            </label>
          )}
          <label className="block space-y-2 text-sm text-zinc-300">
            Email address
            <MotionInput type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="block space-y-2 text-sm text-zinc-300">
            Password
            <MotionInput type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={128} />
            {isRegister && <span className="block text-xs text-zinc-500">Use at least 8 characters.</span>}
          </label>
          <AnimatePresence mode="wait">
            {error && <motion.p key={error} initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }} transition={spring} className="overflow-hidden rounded-xl border border-red-300/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-100" role="alert">{error}</motion.p>}
          </AnimatePresence>
          <MotionButton
            className="glass-button w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
          </MotionButton>
        </form>

        <p className="mt-7 text-center text-sm text-zinc-500">
          {isRegister ? 'Already have an account?' : 'New to Forma?'}{' '}
          <AnimatedLink className="font-medium text-violet-200 hover:text-white" to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Sign in' : 'Create an account'}
          </AnimatedLink>
        </p>
      </motion.section>
    </main>
  );
}
