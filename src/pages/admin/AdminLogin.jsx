import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, onAuth } from '../../supabase/config';
import SEO from '../../components/SEO';
import './Admin.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        return onAuth(user => {
            if (user) navigate('/admin', { replace: true });
        });
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signIn(email, password);
            navigate('/admin', { replace: true });
        } catch {
            setError('Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            {/* A crawlable, indexable login form is an invitation to
                credential-stuffing scanners. */}
            <SEO routePath="/admin/login" title="Admin" noindex />
            <main className="admin-login-card">
                <img src="/Logo/new-logo.png" alt="Bogot Master" className="admin-logo" width="904" height="904" />
                <h1>Admin Panel</h1>
                <form onSubmit={handleSubmit}>
                    <div className="admin-field">
                        <label htmlFor="admin-email">Email</label>
                        <input
                            id="admin-email"
                            name="email"
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="admin-field">
                        <label htmlFor="admin-password">Password</label>
                        <input
                            id="admin-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="admin-error" role="alert">{error}</p>}
                    <button type="submit" className="admin-btn-primary" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
            </main>
        </div>
    );
};

export default AdminLogin;
