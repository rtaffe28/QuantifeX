import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

type User = {
  id: number
  username: string
  email: string
}

type PortfolioStock = {
  id: number
  stock_id: number
  symbol: string
  company_name: string
  current_price: string
  shares: string
  market_value: string
  created_at: string
  updated_at: string
}

type Stock = {
  id: number
  symbol: string
  company_name: string
  current_price: string
  created_at: string
  updated_at: string
}

type AuthMode = 'login' | 'register'

type PortfolioFormState = {
  stock_id: string
  shares: string
}

type FieldErrors = Record<string, string>

const emptyPortfolioForm: PortfolioFormState = {
  stock_id: '',
  shares: '',
}

class ApiError extends Error {
  fieldErrors: FieldErrors

  constructor(message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.fieldErrors = fieldErrors
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const contentType = response.headers.get('content-type')
  const data = contentType?.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(
      data?.error ?? `Request failed with status ${response.status}`,
      data?.errors ?? {},
    )
  }

  return data as T
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' })
  const [stocks, setStocks] = useState<Stock[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([])
  const [portfolioForm, setPortfolioForm] = useState<PortfolioFormState>(emptyPortfolioForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [authErrors, setAuthErrors] = useState<FieldErrors>({})
  const [portfolioErrors, setPortfolioErrors] = useState<FieldErrors>({})

  const totalMarketValue = useMemo(
    () =>
      portfolio.reduce((total, stock) => {
        return total + Number(stock.market_value)
      }, 0),
    [portfolio],
  )

  async function loadStocks() {
    const stockData = await apiRequest<Stock[]>('/stocks/')
    setStocks(stockData)

    setPortfolioForm((currentForm) => {
      if (currentForm.stock_id || stockData.length === 0) {
        return currentForm
      }

      return { ...currentForm, stock_id: String(stockData[0].id) }
    })
  }

  async function loadPortfolio() {
    setIsPortfolioLoading(true)
    try {
      const stocks = await apiRequest<PortfolioStock[]>('/portfolio-stocks/')
      setPortfolio(stocks)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load portfolio')
    } finally {
      setIsPortfolioLoading(false)
    }
  }

  useEffect(() => {
    async function restoreSession() {
      try {
        const currentUser = await apiRequest<User>('/auth/me/')
        setUser(currentUser)
        await loadStocks()
        await loadPortfolio()
      } catch {
        setUser(null)
      } finally {
        setIsCheckingSession(false)
      }
    }

    restoreSession()
  }, [])

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setAuthErrors({})

    try {
      const endpoint = authMode === 'login' ? '/auth/login/' : '/auth/register/'
      const loggedInUser = await apiRequest<User>(endpoint, {
        method: 'POST',
        body: JSON.stringify(authForm),
      })

      setUser(loggedInUser)
      setAuthForm({ username: '', email: '', password: '' })
      await loadStocks()
      await loadPortfolio()
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setAuthErrors(requestError.fieldErrors)
      }

      setError(requestError instanceof Error ? requestError.message : 'Authentication failed')
    }
  }

  async function handleLogout() {
    setError('')

    try {
      await apiRequest<{ logged_out: boolean }>('/auth/logout/', { method: 'POST' })
      setUser(null)
      setPortfolio([])
      setPortfolioForm(emptyPortfolioForm)
      setEditingId(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not log out')
    }
  }

  async function handlePortfolioSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPortfolioErrors({})
    setIsSaving(true)

    const clientErrors: FieldErrors = {}

    if (!portfolioForm.stock_id) {
      clientErrors.stock_id = 'Choose a stock.'
    }

    const sharesValue = Number(portfolioForm.shares)
    if (!portfolioForm.shares) {
      clientErrors.shares = 'Shares are required.'
    } else if (!Number.isFinite(sharesValue) || sharesValue <= 0) {
      clientErrors.shares = 'Shares must be greater than 0.'
    }

    if (Object.keys(clientErrors).length > 0) {
      setPortfolioErrors(clientErrors)
      setError('Please fix the highlighted fields.')
      setIsSaving(false)
      return
    }

    const payload = {
      stock_id: Number(portfolioForm.stock_id),
      shares: portfolioForm.shares,
    }

    try {
      const savedStock = await apiRequest<PortfolioStock>(
        editingId ? `/portfolio-stocks/${editingId}/` : '/portfolio-stocks/',
        {
          method: editingId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        },
      )

      setPortfolio((currentPortfolio) => {
        if (!editingId) {
          return [savedStock, ...currentPortfolio]
        }

        return currentPortfolio.map((stock) => (stock.id === savedStock.id ? savedStock : stock))
      })

      setPortfolioForm(emptyPortfolioForm)
      setEditingId(null)
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setPortfolioErrors(requestError.fieldErrors)
      }

      setError(requestError instanceof Error ? requestError.message : 'Could not save stock')
    } finally {
      setIsSaving(false)
    }
  }

  function startEditing(stock: PortfolioStock) {
    setEditingId(stock.id)
    setPortfolioForm({
      stock_id: String(stock.stock_id),
      shares: stock.shares,
    })
  }

  async function deletePortfolioStock(stockId: number) {
    if (!window.confirm('Delete this stock from your portfolio?')) {
      return
    }

    setError('')

    try {
      await apiRequest<{ deleted: boolean }>(`/portfolio-stocks/${stockId}/`, {
        method: 'DELETE',
      })
      setPortfolio((currentPortfolio) => currentPortfolio.filter((stock) => stock.id !== stockId))

      if (editingId === stockId) {
        setEditingId(null)
        setPortfolioForm(emptyPortfolioForm)
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not delete stock')
    }
  }

  if (isCheckingSession) {
    return <main className="app-shell">Loading QuantifeX...</main>
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-panel" aria-labelledby="auth-heading">
          <div>
            <p className="eyebrow">QuantifeX</p>
            <h1 id="auth-heading">{authMode === 'login' ? 'Log in' : 'Create account'}</h1>
            <p className="muted">Track your personal stock portfolio from one focused dashboard.</p>
          </div>

          <div className="segmented-control" aria-label="Authentication mode">
            <button
              className={authMode === 'login' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('login')}
            >
              Log in
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form className="form-grid" onSubmit={handleAuthSubmit}>
            <label>
              Username
              <input
                autoComplete="username"
                required
                value={authForm.username}
                onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })}
              />
              {authErrors.username && <span className="field-error">{authErrors.username}</span>}
            </label>

            {authMode === 'register' && (
              <label>
                Email
                <input
                  autoComplete="email"
                  type="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                />
                {authErrors.email && <span className="field-error">{authErrors.email}</span>}
              </label>
            )}

            <label>
              Password
              <input
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                required
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
              />
              {authErrors.password && <span className="field-error">{authErrors.password}</span>}
            </label>

            {error && <p className="error-message">{error}</p>}

            <button className="primary-button" type="submit">
              {authMode === 'login' ? 'Log in' : 'Create user'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">QuantifeX</p>
          <h1>Stock Portfolio</h1>
        </div>
        <div className="user-actions">
          <span>{user.username}</span>
          <button className="secondary-button" type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {error && <p className="error-message">{error}</p>}

      <section className="summary-grid" aria-label="Portfolio summary">
        <div className="summary-item">
          <span>Holdings</span>
          <strong>{portfolio.length}</strong>
        </div>
        <div className="summary-item">
          <span>Market value</span>
          <strong>{formatMoney(totalMarketValue)}</strong>
        </div>
      </section>

      <section className="portfolio-layout">
        <form className="portfolio-form" onSubmit={handlePortfolioSubmit}>
          <h2>{editingId ? 'Edit holding' : 'Add holding'}</h2>
          <label>
            Stock
            <select
              required
              value={portfolioForm.stock_id}
              onChange={(event) =>
                setPortfolioForm({ ...portfolioForm, stock_id: event.target.value })
              }
            >
              <option value="" disabled>
                Select a stock
              </option>
              {stocks.map((stock) => (
                <option key={stock.id} value={stock.id}>
                  {stock.symbol} - {stock.company_name} ({formatMoney(Number(stock.current_price))})
                </option>
              ))}
            </select>
            {portfolioErrors.stock_id && (
              <span className="field-error">{portfolioErrors.stock_id}</span>
            )}
          </label>
          <label>
            Shares
            <input
              max="99999999.9999"
              min="0"
              required
              step="0.0001"
              type="number"
              value={portfolioForm.shares}
              onChange={(event) =>
                setPortfolioForm({ ...portfolioForm, shares: event.target.value })
              }
            />
            {portfolioErrors.shares && <span className="field-error">{portfolioErrors.shares}</span>}
          </label>
          {stocks.length === 0 && (
            <p className="empty-state">Add stocks to the backend before creating portfolio holdings.</p>
          )}
          <div className="form-actions">
            <button className="primary-button" disabled={isSaving || stocks.length === 0} type="submit">
              {isSaving ? 'Saving...' : editingId ? 'Save changes' : 'Add stock'}
            </button>
            {editingId && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setPortfolioForm(emptyPortfolioForm)
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="portfolio-table-wrap" aria-labelledby="portfolio-heading">
          <div className="table-heading">
            <h2 id="portfolio-heading">Holdings</h2>
            <button className="secondary-button" type="button" onClick={loadPortfolio}>
              Refresh
            </button>
          </div>

          {isPortfolioLoading ? (
            <p className="empty-state">Loading portfolio...</p>
          ) : portfolio.length === 0 ? (
            <p className="empty-state">No stocks yet. Add your first holding to get started.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th>Shares</th>
                  <th>Current price</th>
                  <th>Market value</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {portfolio.map((stock) => {
                  return (
                    <tr key={stock.id}>
                      <td>
                        <strong>{stock.symbol}</strong>
                      </td>
                      <td>{stock.company_name || '-'}</td>
                      <td>{Number(stock.shares).toLocaleString()}</td>
                      <td>{formatMoney(Number(stock.current_price))}</td>
                      <td>{formatMoney(Number(stock.market_value))}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => startEditing(stock)}
                          >
                            Edit
                          </button>
                          <button
                            className="danger-button"
                            type="button"
                            onClick={() => deletePortfolioStock(stock.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
